# BusPlanner Assessment

Playwright JavaScript tests for the Practice Software Testing web application at <https://practicesoftwaretesting.com>.

## Setup

Requirements: Node.js, npm, and internet access to the live application. The tests target the public Practice Software Testing demo; there is no local application server to start.

```powershell
npm ci
npx playwright install chromium
```

## Tests and Audit

```powershell
# Check the mechanical project rules
npm run audit

# Run the full suite serially; tests modify shared demo state and place real orders
npx playwright test --workers=1

# Run one test file
npx playwright test tests/checkout/featured.spec.js

# Run tests with a visible browser
npx playwright test --headed

# Run only the smoke test
npm run test:smoke

# Audit, then run the suite (CI sets one worker)
npm run test:ci
```

The suite currently targets Chromium. It uses shared live-demo accounts, cart data, products, and order history, which can change between runs. Avoid parallel runs; checkout tests place real orders.

## HTML Report

Playwright uses the HTML reporter. After a test run, open the latest report with:

```powershell
npm run report
```

Alternatively, run `npx playwright show-report`. The report includes test results and available failure attachments, such as screenshots and traces.

## Project Layout

- `tests/auth/`: valid and invalid sign-in cases.
- `tests/catalog/`: search, sorting, filtering, and result-count cases.
- `tests/cart/`: cart arithmetic, quantity limits, and eco-discount rules.
- `tests/checkout/`: featured checkout, negative validation, and payment-method cases.
- `tests/smoke.spec.js`: basic product-to-cart smoke check.
- `pages/`: page objects for locators and UI actions.
- `fixtures/`: shared Playwright fixtures, including authenticated test flows.
- `utils/`: test data, payment methods, price parsing, and business rules.
- `docs/`: Playwright codegen recordings retained as workflow evidence.
- `scripts/audit-rules.js`: mechanical checks run by `npm run audit`.
- `AGENT.md`: project-specific coding and testing rules.

For locator rules, known live-app behavior, and current follow-up work, see `AGENT.md`, `OBSERVATIONS.md`, and `HANDOFF.md`.
