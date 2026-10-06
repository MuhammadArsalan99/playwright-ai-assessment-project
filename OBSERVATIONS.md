# OBSERVATIONS.md

**Application:** https://practicesoftwaretesting.com (shared public demo)
**Observed:** manual checks and automated runs on 2026-10-06 and 2026-10-07.

**Severity scale:** **High** = a customer can end up with wrong data or money at risk. **Medium** = a validation or availability gap with customer impact. **Low** = an inconsistency, accessibility issue or testability cost.

## Summary

| #   | Severity | Area     | Finding                                                                                              |
| --- | -------- | -------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Medium   | Checkout | One automated run showed an invoice address different from the checkout form; cause is unconfirmed   |
| 2   | Medium   | Checkout | An address with a country, city and postal code that do not belong together is accepted              |
| 3   | Medium   | Payment  | A card number that fails the standard checksum is accepted                                           |
| 4   | Medium   | Sign-in  | Anyone can lock the shared customer account                                                          |
| 5   | Low      | Payment  | "Payment was successful" appears before the order exists                                             |
| 6   | Low      | Cart     | Separately rounded discount and total differ by one cent; test assertions use conflicting formulas   |
| 7   | Low      | Checkout | One address entry sends the postcode lookup twice                                                    |
| 8   | Low      | Catalog  | Prices are formatted differently on the product page and in the cart                                 |
| 9   | Low      | Cart     | The remove control has no accessible name or test hook, and its icon markup changed between sessions |
| 10  | Low      | Invoices | The invoice list has no search or filter and turns over quickly                                      |
| 11  | Low      | Invoices | Every "Details" link has the same accessible name                                                    |

---

## Findings

### 1. An automated run showed an invoice address different from the checkout form

- **Severity:** Medium; observed in automation once and not reproduced by hand.
- **Where:** Checkout, address step, then My invoices.
- **Steps to reproduce:**
  1. Sign in as the customer, add an in-stock product and proceed to the address step.
  2. Select country Armenia, then enter postal code `123456` and a house number.
  3. To reproduce the reported automation race, type street and city immediately while the lookup is still pending. Do not use this as the normal checkout flow; those fields are lookup-populated.
  4. Continue, pay by credit card and confirm the order.
  5. Open My invoices, open the new invoice and compare its billing address with step 3.
- **Expected:** The invoice shows the address the form displayed when the order was submitted.
- **Actual:** In an automated run the form displayed `Test street 654` and `Frankfurt` immediately before continuing, and again at the next step. The invoice for that order showed `Gulgowski Glens` and `South Velvahaven`. Entering the same flow by hand at normal typing speed produced an invoice that matched the form.
- **Evidence:** Console output of the form values and the invoice values from the same run, and a request log showing the lookup response arriving after the fields were filled (PROMPTS.md entry 19).
- **Why it matters:** If the invoice persists an address different from the one shown at submission, the order could be sent to an unintended address. The current evidence does not establish that this occurs during normal use.
- **How the suite handles it:** `CheckoutPage.fillAddress()` does not type street or city, but its non-empty checks do not prove the lookup has finished. The featured test checks that invoice address fields are populated; it does not assert they match the checkout form.
- **Status:** One automated mismatch observed on 2026-10-07; not reproduced by hand at normal speed. Root cause is unconfirmed.

### 2. An address with a country, city and postal code that do not belong together is accepted

- **Severity:** Medium
- **Where:** Checkout, address step.
- **Steps to reproduce:**
  1. Proceed to the address step with an item in the cart.
  2. Select country Armenia and enter postal code `123456`, any house number, city `Frankfurt` and state `Oklahoma State`.
  3. Continue.
- **Expected:** The form flags the combination, or the lookup rejects it.
- **Actual:** The form accepts it and the order can be completed.
- **Why it matters:** Orders can be placed for addresses that cannot exist, which leads to failed deliveries and manual clean-up.
- **Status:** Reproduced in manual checks and in repeated automated checkouts.

### 3. A card number that fails the standard checksum is accepted

- **Severity:** Medium (this may be deliberate for a demo; for a real shop it would be a serious gap)
- **Where:** Checkout, payment step, credit card.
- **Steps to reproduce:**
  1. Reach the payment step and choose Credit Card.
  2. Enter card number `1234-1234-1234-1234`, a future expiry in `MM/YYYY` format, a 3-digit CVV and a holder name.
  3. Click "Check payment".
- **Expected:** The number is rejected, because it does not pass the standard Luhn checksum.
- **Actual:** "Payment was successful" is shown. The form only rejects malformed input, for example a card number that is too short, an expiry in the wrong format, and a CVV that is not 3 or 4 digits.
- **Why it matters:** Typing errors in a card number are not caught, so they surface later as payment failures.
- **Status:** Reproduced in a manual recording and in every automated checkout.

### 4. Anyone can lock the shared customer account

- **Severity:** Medium
- **Where:** Sign-in.
- **Steps to reproduce:**
  1. Open the sign-in form.
  2. Submit the customer email with a wrong password several times in a row.
  3. Try to sign in as the customer.
- **Expected:** Failed attempts from one user do not block other users of the same account.
- **Actual:** The account became locked and sign-in as the customer failed until the lock cleared. This happened during exploratory testing and blocked every test that signs in.
- **Why it matters:** Lockout is good protection against guessing, but on a shared account anyone can deny access to everyone else, including automated suites.
- **How the suite handles it:** Invalid-login tests use unknown email addresses only. A wrong password is never sent to the customer or admin account (rule in AGENTS.md).
- **Status:** Reproduced during the assessment runs.

### 5. "Payment was successful" appears before the order exists

- **Severity:** Low
- **Where:** Checkout, payment step.
- **Steps to reproduce:**
  1. Reach the payment step, choose Credit Card and enter valid details.
  2. Click "Check payment". A green "Payment was successful" message appears and the button now reads "Confirm".
  3. Do not click Confirm. Look at the cart and at My invoices.
- **Expected:** A success message means the order has been placed, or the wording makes clear that one more step is needed.
- **Actual:** The order is only created when "Confirm" is clicked. The confirmation page with an invoice number and the removal of the cart appear only after that second click. An automated test that clicked once passed without ever placing an order.
- **Why it matters:** A customer who sees the success message can leave without confirming, believing the order is complete.
- **Status:** Reproduced in every run.

### 6. The displayed discount and the total are one cent apart

- **Severity:** Low
- **Where:** Cart.
- **Steps to reproduce:**
  1. Add Wood Saw to the cart with quantity 5.
  2. Compare the subtotal, discount and total.
- **Expected:** The displayed values follow one documented cent-rounding rule.
- **Actual:** Subtotal `$60.90`, discount `$3.05`, total `$57.86`. Subtracting the displayed rounded discount gives `$57.85`; the total matches rounding 95% of the subtotal independently.
- **Why it matters:** The figures on screen do not add up, which can look like a pricing error on a receipt.
- **How the suite handles it:** Assertions currently use two formulas: `eco-discount.spec.js` rounds the discounted subtotal, while `CartPage.checkSnapshot()` subtracts the displayed discount exactly. There is no one-cent tolerance in `checkSnapshot()`.
- **Status:** Reproduced.

### 7. One address entry sends the postcode lookup twice

- **Severity:** Low
- **Where:** Checkout, address step.
- **Steps to reproduce:** Open the browser network tab, enter country, postal code and house number, and watch requests to `/postcode-lookup`.
- **Expected:** One request per entry.
- **Actual:** Two identical `GET /postcode-lookup?country=AM&postcode=123456&house_number=...` requests are sent.
- **Why it matters:** Wasted calls, and two responses give the page two chances to overwrite what the user has typed (see finding 1).
- **Status:** Reproduced in the request log of an automated run.

### 8. Prices are formatted differently on the product page and in the cart

- **Severity:** Low
- **Where:** Product page and cart.
- **Steps to reproduce:** Open any product page and read the unit price, then add it and read the price in the cart row.
- **Expected:** The same format on both pages.
- **Actual:** The product page shows `14.15`; the cart shows `$14.15`.
- **Why it matters:** It points to separate formatting logic per page and broke a price parser that assumed one format.
- **Status:** Reproduced.

### 9. The remove control has no accessible name or test hook, and its icon markup changed between sessions

- **Severity:** Low
- **Where:** Cart, red remove button on each row.
- **Steps to reproduce:** Add an item, open the cart and inspect the remove button.
- **Expected:** A name for assistive technology (`aria-label` or text) and a `data-test` hook.
- **Actual:** An `<a class="btn btn-danger">` containing only an icon. It has no `data-test`, no `href` and no accessible name, and the icon is `aria-hidden`. In an earlier session the icon was `<i class="fa fa-remove">`, and in a later one `<fa-icon><svg data-icon="xmark">`.
- **Why it matters:** A screen reader announces nothing useful, and automation has to rely on a styling class. The icon change shows why a selector must not depend on the icon.
- **How the suite handles it:** The page object finds the row by product name and clicks `a.btn-danger` inside that row only.
- **Status:** Reproduced in two sessions.

### 10. The invoice list has no search or filter and turns over quickly

- **Severity:** Low
- **Where:** My invoices.
- **Steps to reproduce:** Sign in as the customer and open My invoices.
- **Expected:** A way to find one invoice, such as search or a date filter.
- **Actual:** 15 invoices per page over 12 or more pages, newest first, with no search box. The 15 rows on page 1 covered about 32 minutes of orders from many users.
- **Why it matters:** On a shared account a specific invoice leaves page 1 within about half an hour, so finding it means paging.
- **How the suite handles it:** The test looks for its own invoice number on page 1 immediately after ordering.
- **Status:** Reproduced.

### 11. Every "Details" link has the same accessible name

- **Severity:** Low
- **Where:** My invoices, last column.
- **Steps to reproduce:** Inspect the links in the last column of the invoice table.
- **Expected:** Each link says which invoice it opens.
- **Actual:** Every link is named "Details".
- **Why it matters:** Screen reader users hear a list of identical links, and automation has to scope to the row.
- **Status:** Reproduced.

---

## Business rules observed

### Eco discount

- A 5% discount is calculated on the cart subtotal. An in-stock eco product at quantity 1 received it. A single non-eco product at quantity 1 did not. The threshold is stored as `ECO_DISCOUNT_MIN_ITEMS = 1` in `utils/rules.js`.
- The subtotal and discount lines appear only when a discount applies. Without one, the cart shows only the total.
- Example: Wood Saw at quantity 5 showed subtotal `$60.90`, discount `$3.05`, total `$57.86`.
- The brief's rule "cart total equals the sum of the line totals" holds only when no discount applies. The eco test calculates total by rounding the subtotal after applying the rate; `CartPage.checkSnapshot()` instead subtracts the displayed rounded discount. These formulas can differ by one cent and should be aligned to an explicit rounding rule.

### Cart quantity

- Entering `0` or `-5` changes the value to `1`.
- Entering a quantity above the limit shows an alert that the maximum order is 99.

---

## Testability and risk notes

- **Shared state.** Other people use the same accounts, the cart can change between runs, and the data resets. Tests pick products from the live grid by name after a stock check and assert only the rows they created.
- **Every checkout run places a real order** and invoice on the public demo.
- **Dynamic IDs.** Product, category and brand `data-test` values contain generated IDs, so they are never hard-coded.
- **Two-step checkout.** "Check payment" and "Confirm" are the same `data-test="finish"` button, so tests check the label before each click.
- **Delayed confirmation.** The order confirmation can take several seconds, so the test allows up to 20 seconds.
- **Post-order cart check.** The invoice page does not expose the cart link, so the featured test navigates to `/checkout` and asserts there are zero cart rows after ordering.
- **Product name on the product page includes the eco badge text.** The page object reads the heading's own text so cart row locators (`Quantity for <name>`) still match.
- **Missing hooks.** The order confirmation (`#order-confirmation`), invoice table rows and invoice product lines have no `data-test`. The suite uses the id, role and cell text, and the product columns by position.

---

## Checked, no defect

- **Sign-in messages.** Both fields empty shows "Email is required" and "Password is required". An empty email shows only the first, an empty password only the second. A malformed email shows "Email format is invalid". An unknown, well-formed email shows the generic "Invalid email or password", which does not reveal whether an address is registered.
- **Payment fields.** Each method shows only its own fields. Cash on delivery shows none, and switching method removes the previous method's fields.
- **Installments.** The options are 3, 6, 9 and 12. The validation message appears when the field is left without a choice and disappears once a plan is chosen.
- **Search.** The result count matches the products shown, up to the page size of 9, and a search with no matches shows an empty-state message.
- **Sort and filter.** Price and name sorting order the products on the first page in both directions, and the eco filter shows only eco products.
- **Cart arithmetic.** Each line equals unit price times quantity, and the subtotal equals the sum of the lines.
- **Invoice.** In the featured test runs, the invoice's lines, quantities and total matched the cart that was verified before ordering.

## Observed once, not reproduced

- **Confirm did not place the order.** In one session the Confirm button did not place an order, both by hand and in the automated test. After the address step was changed to let the lookup fill street and city, Confirm worked in every later run. It is not reported as a defect because it did not recur.
