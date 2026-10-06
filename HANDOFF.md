# Handoff

## Project State

This is a Playwright JavaScript test suite against the live Practice Software Testing demo. The suite runs in Chromium and uses the HTML reporter. The app is shared and can change or retain user data between runs; run the full suite before reporting a final result.

## Structure

- `tests/auth/login.spec.js`: valid and invalid login cases.
- `tests/catalog/catalog.spec.js`: search, sorting, filtering, and result counts.
- `tests/cart/cart.spec.js`: cart content, quantity normalization, and maximum-order behavior.
- `tests/cart/eco-discount.spec.js`: eco-discount scenarios using constants from `utils/rules.js`.
- `tests/checkout/featured.spec.js`: multi-item checkout and invoice verification.
- `tests/checkout/negative.spec.js`: invalid address and card validation.
- `tests/checkout/payment-methods.spec.js`: payment-specific fields and installments.
- `pages/`: page objects; keep business outcome assertions in tests.
- `fixtures/index.js`: reusable page objects and signed-in checkout fixtures.
- `utils/`: shared test data and parsing/business-rule helpers.

## Add or Change a Test

1. Read `AGENT.md` and the closest existing test/page object.
2. Inspect the live page or a current DOM/codegen recording before choosing a locator. Prefer `getByTestId()` for `data-test`, then role/label/placeholder locators, then static visible text.
3. Choose currently in-stock products from the grid. Do not assume cart contents or fixed product availability.
4. For checkout, enter country, postal code, and house number to trigger the lookup. Do not type into lookup-filled street/city fields; fill state only if the lookup leaves it blank. The current page helper waits for street/city to be non-empty, which does not prove the lookup has finished; improve this wait before relying on exact submitted values.
5. Read prices and totals from the UI and compare integer cents. Reuse `utils/rules.js` for business constants. Apply one explicit rounding rule consistently to both cart and eco-discount assertions.
6. Use web-first assertions/polling rather than fixed sleeps. Assert a real outcome.
7. Run the narrow test, then `npx playwright test`. Review failures and their call logs before changing expectations.
8. Record verified app changes or inconsistencies in `OBSERVATIONS.md`; record notable AI prompts/corrections in `PROMPTS.md`.

## Shared-Site Precautions

- Credentials come from `utils/testData.js` and may be overridden with `CUSTOMER_EMAIL` and `CUSTOMER_PASSWORD` environment variables. Never submit an incorrect password to a shared account.
- The demo's cart, account address, stock, and validation messages may change. Avoid relying on state from previous runs.
- After ordering, verify cart rows at the cart route; navigation elements may differ by page.

## Verified Behavior

- Cart quantities `0` and `-5` normalize to `1`; oversized quantities show an alert stating the maximum is 99.
- The eco discount is 5% and appears with an eco item at quantity 1; one non-eco item does not receive it. `ECO_DISCOUNT_MIN_ITEMS` is currently `1` based on focused tests.
- One automated run showed an invoice address different from the checkout form; this was not reproduced by hand, so the cause is unconfirmed. The featured test currently checks that invoice address fields are populated, not that they match the form.
- The eco test rounds the subtotal after applying the discount rate, while `CartPage.checkSnapshot()` subtracts the displayed rounded discount. These can differ by one cent; resolve the expected rounding behavior and align both checks. See `OBSERVATIONS.md` for details.

## Next Checks

- Reconfirm long-house-number validation and update the negative-address test: `postcode-lookup-error` was absent in one run while state stayed blank and checkout remained disabled.
- Make `fillAddress()` wait for an actual lookup update, not merely non-empty street/city values.
- Choose the cart rounding rule and align `CartPage.checkSnapshot()` with the eco-discount test.
- Verify whether oversized quantity is reset to exactly 99 after its alert.
- Check the cart's response to non-numeric quantity input.
- Rerun the full suite after any changes and inspect the HTML report with `npx playwright show-report`.
