---
name: run-test
description: Run a ContextQA test case and report the truthful per-step result. Use whenever asked to run, execute, re-run or verify a ContextQA test case by id, or to check whether a case passes. Handles polling, reports pass/fail correctly, and flags auto-healed steps.
---

# Run a ContextQA test case

Runs a case end to end and reports what actually happened.

## The rule this skill exists for

**`get_execution_status` returns "Execution completed successfully" even when the
test FAILED.** It reports that the *run* reached a terminal state, not that the
assertions passed. Reading it aloud will state the opposite of the truth.

Never report pass/fail from `get_execution_status`. The only source of truth is
`get_test_step_results(result_id)` and each step's `result` field.

## Steps

1. **Execute.** `execute_test_case(test_case_id=<id>)`. Note the
   `number_of_executions` value it returns — polling needs it.

2. **Poll.** `get_execution_status(test_case_id=<id>, number_of_executions=<n>)`
   until it stops saying "Execution in progress". Wait roughly 20 seconds between
   polls. A typical run takes 60–85 seconds; a run whose element is genuinely
   missing takes 95–105 seconds because it burns a 30-second locator timeout.

   Treat the terminal message as "finished", nothing more.

3. **Get the truth.** `get_test_step_results(result_id=<result_id>)`.

4. **Report** a table, one row per step:

   | # | Action | Result | Duration | Healed |
   |---|--------|--------|---------:|--------|

   - `result` is `SUCCESS` or `FAILURE`, taken verbatim from the step
   - `auto_healed: true` means the recorded locator no longer matched and the AI
     found the element by context. Call it out explicitly — it is a passing step,
     but the UI moved underneath it and that is worth knowing.
   - Note the field is omitted entirely when false, so absence means not healed.

5. **State the overall outcome in one line.** The case passed only if *every*
   step is `SUCCESS`. One `FAILURE` means the case failed, whatever the status
   message said.

6. **If any step failed**, offer — do not run unprompted —
   `investigate_failure(result_id=<result_id>)` for root-cause analysis with
   screenshots, DOM, console and network evidence.

## Running several cases

Trigger every case first, then poll them. Firing three runs in parallel finishes
in about the time one takes; running them in series costs three times as long.

## Do not

- Do not report a result before `get_test_step_results` has returned.
- Do not retry a failing case hoping it passes. A red run is information.
- Do not edit the test case or the application to make a test pass unless asked.
