# Triage a Playwright Failure

Investigate this failure without guessing: [paste test name, error, and call log].

1. Read `AGENT.md`, the failing test, and the page object/helper used at the failing line.
2. Start with the call log. Identify which locator resolved, what value/state it had, what Playwright expected, and whether the failure is a locator problem, app validation, stale state, or asynchronous rendering. Read the screenshot and `error-context.md` when available.
3. Reproduce the failing behavior with the narrowest test or a careful live check. Confirm locators against the real page before changing them. Prefer the existing locator hierarchy: `data-test`, role/label/placeholder, then static visible text. Do not guess selectors or add fixed sleeps.
4. Check for dynamic/shared state. Select currently in-stock products; never assume a cart or product state. Never submit a wrong password to a shared account.
5. On checkout, do not type into street/city fields populated by the address lookup. Capture the final form values after the lookup settles, but do not assume an invoice matches volatile lookup or shared-account address values exactly; record a mismatch as an observation.
6. Make the smallest root-cause fix. Preserve the intended business assertion; if live behavior contradicts it, record the discrepancy in `OBSERVATIONS.md` instead of silently changing the expected rule.
7. Rerun the focused test and report the command, pass/fail result, evidence, and any remaining blocker. Do not claim a fix is verified without a fresh run.
