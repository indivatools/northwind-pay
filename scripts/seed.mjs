import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(HERE, "..", "data", "db.json");
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Ages are relative so a reseed always produces the same *relative* fixture,
 * whatever day the demo runs on. The 21- and 30-day rows are load-bearing:
 * 21 flips eligibility when the refund window narrows, 30 sits exactly on the
 * documented boundary.
 */
const SEED = [
  { ageDays: 2, name: "Dana Whitfield", email: "dana.whitfield@example.com", description: "Aurora Wireless Headphones", amountCents: 24900, last4: "4242" },
  { ageDays: 5, name: "Marcus Ellery", email: "marcus.ellery@example.com", description: "Trailhead Running Shoes", amountCents: 13500, last4: "1881" },
  { ageDays: 12, name: "Priya Raghunathan", email: "priya.r@example.com", description: "Cascade Filter Coffee Maker", amountCents: 8925, last4: "0004" },
  { ageDays: 21, name: "Tomas Lindqvist", email: "t.lindqvist@example.com", description: "Meridian Desk Lamp", amountCents: 6400, last4: "4242" },
  { ageDays: 29, name: "Ada Nwosu", email: "ada.nwosu@example.com", description: "Solstice Weekender Bag", amountCents: 18000, last4: "5100" },
  { ageDays: 30, name: "Grace Okonkwo", email: "grace.okonkwo@example.com", description: "Harbour Wool Overcoat", amountCents: 32750, last4: "4242" },
  { ageDays: 31, name: "Bilal Haddad", email: "bilal.haddad@example.com", description: "Fjord Insulated Bottle", amountCents: 3200, last4: "0341" },
  { ageDays: 45, name: "Renata Alvarez", email: "renata.alvarez@example.com", description: "Atlas Carry-On Suitcase", amountCents: 27500, last4: "1881" },
];

const now = Date.now();

const transactions = SEED.map((row, index) => ({
  id: `txn_${String(index + 1).padStart(4, "0")}`,
  reference: `CQA-${String(10_400 + index * 7)}`,
  customerName: row.name,
  customerEmail: row.email,
  description: row.description,
  amountCents: row.amountCents,
  currency: "USD",
  cardLast4: row.last4,
  status: "CAPTURED",
  capturedAt: new Date(now - row.ageDays * MS_PER_DAY).toISOString(),
  refundedAt: null,
}));

mkdirSync(dirname(DB_PATH), { recursive: true });
writeFileSync(DB_PATH, `${JSON.stringify({ transactions, refunds: [] }, null, 2)}\n`, "utf8");

console.log(`Seeded ${transactions.length} transactions -> ${DB_PATH}`);
