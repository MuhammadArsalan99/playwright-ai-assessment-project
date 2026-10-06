# BusPlanner Assessment: Playwright (JavaScript)

## Application under test

- Practice Software Testing Web Application: https://practicesoftwaretesting.com
- Shared public Web Application: other people use the same accounts, and data can reset or change at any time. Never assume the cart, orders, or products are in a known state.
- Account (password: welcome01): customer2@practicesoftwaretesting.com
- Never submit a wrong password for a shared account: the app locks accounts after repeated failures.

## Commands

- Run all tests: `npx playwright test`
- Run one file: `npx playwright test tests/checkout/featured.spec.js`
- Headed / debug: `npx playwright test --headed` or `--debug`
- Open report: `npx playwright show-report`
- Explore locators: `npx playwright codegen https://practicesoftwaretesting.com`

## Project structure

- `pages/` page objects (one class per page, locators + actions, no assertions about business outcomes)
- `fixtures/` custom fixtures (for example an authenticated customer)
- `utils/` helpers (price parsing, unique test data)
- `tests/` split by area: auth, catalog, cart, checkout, negative

## Locator rules (in priority order)

1. `data-test` attributes via `page.getByTestId()` (configure `testIdAttribute: 'data-test'` in playwright.config.js)
2. `getByRole`, `getByLabel`, `getByPlaceholder`
3. `getByText` only for static, user-visible copy

- Never use brittle CSS chains, nth-child, or XPath.
- Never invent a locator. Confirm it exists in the real page HTML first.

## Test rules

- No `waitForTimeout` or fixed sleeps. Use web-first assertions: `await expect(locator).toHaveText(...)`.
- Never hard-code prices, totals, or product counts. Read them from the page and compare in cents (integers) to avoid floating-point errors.
- Every test must assert a real outcome (cart contents, totals, confirmation), not only that a click worked.
- Tests must be independent. Do not rely on data from earlier tests or earlier runs.
- Use unique data (timestamp suffix) for anything created.
- Keep tests short and readable. Put reusable steps in page objects or fixtures.

## Workflow rules

- Before writing a page object, inspect the real page and use the actual attributes.
- Run the test after writing it. Do not report a test as working until it has passed.
- Log anything that looks like a defect, validation gap, or inconsistency in OBSERVATIONS.md with steps to reproduce and why it matters.
- Record notable prompts and corrections in PROMPTS.md.

## Scope (from the assessment brief)

Priority order: 1) featured checkout scenario, 2) core flows, 3) negative tests.

### Core flows

- Sign in with valid and invalid credentials
- Find products via search, and via a filter or sort
- Add a product to the cart and verify cart contents
- Progress through checkout as far as is reasonable

### Featured scenario: verified multi-item checkout

1. Sign in as the customer, add at least two different products from their product pages
2. In the cart, change one item's quantity and remove another
3. Read values from the page and assert: each line total = unit price x quantity; cart total = sum of line totals
4. At the payment step, choose a method and verify its method-specific fields appear before completing
5. Complete the order and assert the confirmation

### Negative / edge cases

- Data-driven invalid logins
- Empty or invalid checkout fields
- Quantity edge cases (zero, very large number)

## Deliverables (keep these up to date)

README.md (run instructions), OBSERVATIONS.md, PROMPTS.md (prompts, corrections), HANDOFF.md (how to maintain, add a test, what to automate next)

## Verification

- Run every test before calling it done
- Be able to explain why each locator and assertion was chosen
