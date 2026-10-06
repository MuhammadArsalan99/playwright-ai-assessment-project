# Add a Playwright Test

Add a focused Playwright test for this request: [describe behavior and expected outcome].

Before editing:

- Read `AGENT.md` and inspect the nearest existing test, page object, fixture, and relevant live page.
- Confirm each locator in the real page DOM or by inspecting an existing reliable call/codegen trace. Do not invent selectors.
- Use an in-stock product selected from the current grid; never assume a fixed product is available.

Follow this project’s conventions:

- Use `data-test` with `getByTestId()` first, then role/label/placeholder locators, then text only for static visible copy. Avoid brittle CSS chains, XPath, and positional selectors.
- Keep page objects for locators/actions and put business-outcome assertions in tests.
- Read prices/totals from the page and compare integer cents. Use `utils/rules.js` for business constants rather than duplicating them.
- Use web-first assertions and polling for asynchronous UI updates. Do not use fixed sleeps.
- Keep tests independent, assert a real outcome, and avoid changing unrelated files.
- Address lookup fills street/city fields: enter only the fields that trigger the lookup (country, postal code, house number); never type into lookup-populated fields.
- Never submit a wrong password for a shared account. Use only the configured valid credentials or a unique unknown email for negative login cases.

After editing, run the narrowest relevant Playwright test. Report the exact command and result; do not claim success unless it passed. Log verified defects or changed live behavior in `OBSERVATIONS.md`.
