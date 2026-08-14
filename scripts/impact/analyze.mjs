#!/usr/bin/env node
/**
 * Local test-impact analysis.
 *
 * Reads a unified diff, resolves the changed symbols against a local knowledge
 * base of ContextQA cases, and emits the same Markdown report the ContextQA
 * GitHub app posts on a pull request.
 *
 * Usage:
 *   node scripts/impact/analyze.mjs --diff <file>
 *   git diff main...HEAD | node scripts/impact/analyze.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const KB = JSON.parse(readFileSync(join(HERE, "knowledge-base.json"), "utf8"));

const CONFIDENCE_DIRECT_FLIP = 96;
const CONFIDENCE_DIRECT_TOUCH = 88;
const CONFIDENCE_INDIRECT = 71;
const HIGH_RISK_UPDATE_THRESHOLD = 2;

function readDiff() {
  const flagIndex = process.argv.indexOf("--diff");
  if (flagIndex !== -1 && process.argv[flagIndex + 1]) {
    return readFileSync(process.argv[flagIndex + 1], "utf8");
  }
  return readFileSync(0, "utf8");
}

/** Pull `NAME = value` pairs off removed/added lines so we can see a constant move. */
function extractConstantChanges(diff) {
  const changes = new Map();
  const pattern = /^([+-])\s*export const ([A-Z_][A-Z0-9_]*)\s*=\s*([^;]+);/;

  for (const line of diff.split("\n")) {
    const match = line.match(pattern);
    if (!match) continue;

    const [, sign, name, rawValue] = match;
    const value = rawValue.trim();
    const entry = changes.get(name) ?? { name, before: null, after: null };
    if (sign === "-") {
      entry.before = value;
    } else {
      entry.after = value;
    }
    changes.set(name, entry);
  }

  return [...changes.values()].filter((c) => c.before !== null && c.after !== null);
}

function extractChangedFiles(diff) {
  return [...diff.matchAll(/^\+\+\+ b\/(.+)$/gm)].map((m) => m[1]);
}

function extractTouchedSymbols(diff, constantChanges) {
  const touched = new Set(constantChanges.map((c) => c.name));
  for (const symbol of Object.keys(KB.symbols)) {
    const referenced = new RegExp(`^[+-].*\\b${symbol}\\b`, "m").test(diff);
    if (referenced) touched.add(symbol);
  }
  return [...touched];
}

/**
 * A case needs updating when the change moves a boundary across the value its
 * assertion depends on. Everything else that touches the symbol needs a re-run.
 */
function classifyCase(testCase, windowChange) {
  const exercisesChanged = testCase.exercises.some((s) => s === windowChange?.name);

  if (windowChange && exercisesChanged && testCase.assertsFixtureAgeDays !== null) {
    const before = Number(windowChange.before);
    const after = Number(windowChange.after);
    const age = testCase.assertsFixtureAgeDays;
    const wasEligible = age <= before;
    const isEligible = age <= after;

    if (wasEligible !== isEligible) {
      return {
        action: "update",
        impact: "high",
        confidence: CONFIDENCE_DIRECT_FLIP,
        why:
          `Asserts that the ${testCase.assertion} for a payment captured ${age} days ago. ` +
          `Under the new ${after}-day window that payment is no longer refundable, so the ` +
          `assertion inverts and the case will fail as written.`,
      };
    }
  }

  return {
    action: "rerun",
    impact: exercisesChanged ? "medium" : "low",
    confidence: exercisesChanged ? CONFIDENCE_DIRECT_TOUCH : CONFIDENCE_INDIRECT,
    why:
      `Exercises ${testCase.exercises.join(", ")} on ${testCase.routes.join(", ")}. ` +
      `The assertion still holds under the new value, but the path is in the blast radius.`,
  };
}

function findCoverageGap(windowChange) {
  if (!windowChange) return null;
  const after = Number(windowChange.after);
  const covered = KB.cases.some((c) => c.assertsFixtureAgeDays === after);
  if (covered) return null;

  return {
    title: `Refund eligibility at the new ${after}-day boundary`,
    risk: "medium",
    confidence: 74,
    paste:
      `Add a test covering refund eligibility exactly at the new ${after}-day boundary. ` +
      `A payment captured ${after} days ago must still be refundable, and one captured ` +
      `${after + 1} days ago must be refused. No current case asserts either side of the ` +
      `new window, so a future off-by-one here would ship undetected.`,
  };
}

function riskBadge(updates) {
  if (updates.length >= HIGH_RISK_UPDATE_THRESHOLD) return "🔴 **High risk**";
  if (updates.length === 1) return "🟡 **Medium risk**";
  return "🟢 **Low risk**";
}

function caseLink(testCase) {
  return `[TC‑${testCase.id}](${KB.portalBaseUrl}/${testCase.id}/steps)`;
}

function render(diff) {
  const constantChanges = extractConstantChanges(diff);
  const windowChange = constantChanges.find((c) => KB.symbols[c.name]);
  const touchedSymbols = extractTouchedSymbols(diff, constantChanges);
  const changedFiles = extractChangedFiles(diff);

  const affected = KB.cases
    .filter((c) => c.exercises.some((s) => touchedSymbols.includes(s)))
    .map((c) => ({ ...c, ...classifyCase(c, windowChange) }))
    .sort((a, b) => b.confidence - a.confidence);

  const updates = affected.filter((c) => c.action === "update");
  const reruns = affected.filter((c) => c.action === "rerun");
  const gap = findCoverageGap(windowChange);

  const symbolMeta = KB.symbols[windowChange?.name] ?? Object.values(KB.symbols)[0];
  const counts = [
    updates.length ? `${updates.length} \`update\`` : null,
    reruns.length ? `${reruns.length} \`rerun\`` : null,
    gap ? "1 `add`" : null,
  ].filter(Boolean).join(" · ");

  const summary = windowChange
    ? `Narrows ${windowChange.name} from ${windowChange.before} to ${windowChange.after}. ${symbolMeta.summary}`
    : symbolMeta.summary;

  const lines = [
    "<!-- contextqa:local-impact -->",
    "> Generated locally by `scripts/impact/analyze.mjs` against a local case knowledge base.",
    "",
    "",
    `### Test impact — ${affected.length} cases in the blast radius`,
    "",
    `${riskBadge(updates)}  ·  ${counts}`,
    "",
    `> ${summary}`,
    "",
    `- **Features** — ${symbolMeta.feature}`,
    "",
    "| Case | Action | Why |",
    "|:--|:--:|:--|",
    ...affected.slice(0, 5).map((c) => `| ${caseLink(c)} | \`${c.action}\` | ${c.why} |`),
    "",
  ];

  if (gap) {
    lines.push("*1 coverage gap — see below*", "");
  }

  lines.push(
    "<details>",
    `<summary><b>All ${affected.length} affected cases</b></summary>`,
    "",
    "| Case | Action | Impact | Confidence | Why |",
    "|:--|:--:|:--:|--:|:--|",
    ...affected.map(
      (c) => `| ${caseLink(c)} | \`${c.action}\` | ${c.impact} | ${c.confidence}% | ${c.why} |`,
    ),
    "",
    "</details>",
    "",
  );

  if (gap) {
    lines.push(
      "<details>",
      `<summary><b>What changed & how to fix (${updates.length + 1})</b> — the other ${reruns.length} ${reruns.length === 1 ? "needs" : "need"} no edit, only a re-run</summary>`,
      "",
      ...updates.flatMap((c) => [
        `#### ✏️ ${c.name} · \`update\` · ${c.impact} risk · ${c.confidence}%`,
        "",
        `${c.why}`,
        "",
      ]),
      `#### ➕ ${gap.title} · \`add\` · ${gap.risk} risk · ${gap.confidence}%`,
      "",
      "**Paste this to add it**",
      "",
      "```text",
      gap.paste,
      "```",
      "",
      "</details>",
      "",
    );
  }

  lines.push(
    "<details>",
    "<summary><b>What this change touches</b></summary>",
    "",
    `#### Why ${riskBadge(updates).replace(/[🔴🟡🟢*]/g, "").trim().toLowerCase()}`,
    "",
    `> ${updates.length} case${updates.length === 1 ? "" : "s"} assert behaviour that this change inverts. They will fail as written until their fixtures or expectations move.`,
    "",
    `#### Workflows in the blast radius (${symbolMeta.workflows.length})`,
    "",
    ...symbolMeta.workflows.map((w) => `- ${w}`),
    "",
    `#### Screens & components (${symbolMeta.screens.length})`,
    "",
    symbolMeta.screens.map((s) => `\`${s}\``).join(" · "),
    "",
    "#### Which changed file maps to which feature",
    "",
    "| File | Feature |",
    "|:--|:--|",
    ...changedFiles.map((f) => `| \`${f}\` | ${symbolMeta.feature} |`),
    "",
    "</details>",
    "",
    "*Estimated from the diff — nothing executed. [Review in ContextQA →](https://errorsquad.qa.contextqa.com)*",
  );

  return lines.join("\n");
}

process.stdout.write(`${render(readDiff())}\n`);
