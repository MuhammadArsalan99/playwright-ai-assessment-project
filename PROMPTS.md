# AI Prompt Log

This file records prompts and corrections that affected the test design. Reusable prompts live in `prompts/`.

## Project rules and structure

- **Prompt:** Review the assessment and identify its priorities, deliverables, and project rules.
- **Correction:** Check recommendations against the brief and repository. `AGENT.md` is the project guidance file; it defines locator priority, integer-cent price checks, shared-account precautions, and the featured checkout flow.

## Recorded workflows

- **Prompt:** Review Playwright codegen recordings and identify reliable locators and reusable flows.
- **Correction:** Treat recordings as evidence, not finished tests. Verify locators in the live DOM, select in-stock products, and avoid typing into street/city fields filled by the address lookup.

## Test failures and live behavior

- **Prompt:** Diagnose failures from the Playwright call log and complete the checkout, cart-quantity, and eco-discount scenarios.
- **Correction:** Compare the locator, expected value, and received value before changing code. Never send a wrong password to a shared account. The cart normalizes zero and negative quantities to one, limits oversized orders, and applies the 5% eco discount with one eco item. `ECO_DISCOUNT_MIN_ITEMS` is set to `1` based on focused tests.
- **Verification:** The focused eco-discount suite passed 3 tests after the threshold update. The user reported a 35-test full run passing before that final update; rerun the full suite after subsequent changes before reporting overall status.

## Tools and roles

- **GitHub Copilot Free (VS Code, Agent mode):** Planning, drafting page objects and tests, reviewing what I pasted back (codegen recordings, HTML, error output)
- **Me:** ran everything, inspected the live app by hand, pasted real HTML and errors back, and decided what was kept.

## How I verified AI output

1. Run every test before accepting it.
2. Mutation check: break one expected value on purpose and confirm the test fails, then revert.
3. Read the Playwright call log and trace before asking for a fix.
4. Never accept a locator I had not seen in real page HTML.
5. Compare claims about the app against the app, by hand.

## AGENTS.md, and noticing it was incomplete

**Prompt:** Asked for a rules file, then: "does it contain all the instructions shared in the assessment doc?"
**AI result:** First draft held conventions only. On my question it listed what was missing: the core flows, featured scenario, negative cases, deliverables, verification rule.
**My steering:** Added a Scope section, renamed to `AGENTS.md` (tools read that name), reworded the shared-demo line in my own words.
**Verification (Copilot):** "Read AGENTS.md and tell me in three bullets: the locator rules, the price rule, and the featured scenario steps." Its answer matched the file.

## Config

**Prompt:** Pasted my default `use` block.
**AI result:** Added `baseURL`, `testIdAttribute: 'data-test'`, screenshot on failure.
**Why it matters:** `getByTestId` reads `data-testid` by default, and this app uses `data-test`, so every test-id locator would have found nothing.

## Codegen recording 1

**Prompt:** Pasted a full codegen recording: "can you review this".
**AI result:** Hook inventory, plus a list of recorded locators that break my own rules: `tr:nth-child(2) > .col-md-1 > .btn`, `.nth(3)`, hard-coded `$179.10`, generated product IDs.
**My steering:** Kept it as evidence in `docs/`, never in `tests/`. Used only the hooks I could see.

## Recording 2 and the eco discount

**Prompt:** Pasted a second recording.
**AI result:** Noticed `cart-subtotal`, `cart-eco-discount`, `cart-total` and warned the brief's "cart total = sum of line totals" might not hold.
**Initial finding:** My first manual notes recorded a five-item threshold and a discount on the whole subtotal. Later focused tests showed the live app applies the 5% discount with one eco item and not with one non-eco item; `ECO_DISCOUNT_MIN_ITEMS` was updated to `1`. Treat the earlier five-item note as superseded. Subtotal and discount rows appear only when a discount applies.
**Result:** Assertions check line = unit x quantity, subtotal = sum of lines, and the displayed total using the app's percentage calculation, all from page values. The rule is kept in `utils/rules.js`.

## Payment map and my first mutation check

**Prompt:** Pasted the fields shown by each payment method.
**AI result:** `utils/paymentMethods.js` and a data-driven fields test.
**My check:** Added `cvv` to `bank-transfer` on purpose. Both `bank-transfer` and `credit-card` failed.
**What was wrong:** `expectFieldsFor` asserted every other method's fields hidden, so a shared field contradicted itself. Rewritten to decide per field against the chosen method. Re-ran: only the mutated method fails.

## Smoke test: three corrections

**(a)** `Cannot find module '../utils/paymentMethods'`: the file did not exist yet. I created it.
**(b)** `No price found in "14.15"`: the AI's price regex required a `$`, assuming one format. The product page shows prices without it. Regex fixed.
**(c)** A PowerShell inline check printed `.15` because `$14` was expanded inside double quotes. Avoid double-quoted inline shell checks for dollar-prefixed prices. There is no `tests/unit/price.spec.js` in the current project.

## Featured test and a mutation check

**Prompt:** Asked for the featured scenario in small steps.
**AI result:** Two products, quantity change, removal, whole-cart arithmetic, plus an independent check of the kept line against the unit price read on the product page.
**My check:** Changed `unitCents * 3` to `* 4`. Failed with Expected 5660, Received 4245 (1415 x 4 vs x 3). Reverted. The assertion compares real values.

## I locked the shared account

**Prompt:** Asked for auth tests.
**AI result:** Advised sending a wrong password to the real customer email "only once".
**What went wrong:** My own exploration with wrong passwords locked the shared customer account and everything depending on login failed.
**Correction:** Invalid-login tests use unknown emails only. Rule added to AGENTS.md. Logged in OBSERVATIONS.md.

## Login messages

**Prompt:** I noticed 4 of the invalid-login tests only asserted "still logged out".
**AI result:** Asked me to capture the real messages instead of guessing them.
**My finding:** Both empty: "Email is required" and "Password is required". Empty password: "Password is required". Malformed email: "Email format is invalid".
**What was wrong:** The AI had assumed a malformed email gets the generic server error and drafted an observation about missing validation. I checked the app, found the format message, and the observation was withdrawn.

## Catalog and out-of-stock products

**Prompt:** Pasted a card, the sort `<select>`, and search result HTML.
**AI result:** `readCards`, search, sort, eco filter and no-results tests, with no hard-coded term or count.
**My finding:** The search HTML contained `out-of-stock` cards. Earlier tests picked `cards.first()` with no stock check.
**Result:** Added `inStockCards()`.

## Installments

**Prompt:** Pasted the installments `<select>` HTML.
**AI result:** Options `3, 6, 9, 12` and a validation test.
**What was wrong:** The first "plan accepted" test asserted the error was hidden, which also passes if it never showed. Rewritten to trigger the message first (touch and leave the field), then choose a plan. I confirmed the trigger by hand.

## The test passed without placing an order

**Prompt:** Pasted my HTML before and after the first click.
**My finding:** The button reads "Check payment", then "Confirm". My featured test clicked once, so it passed without ever placing an order, which is also why the cart was never emptied.
**Result:** Split into `checkPayment()` and `confirmOrder()`. Pasted the confirmation HTML: invoice number in `#order-confirmation`. The AI's earlier "no order number" observation was wrong and was deleted.

## Verifying the order on its invoice

**Prompt:** Pasted the invoices list and detail HTML.
**AI result:** `InvoicesPage` and `InvoiceDetailPage`: find my own invoice by number on page 1, compare lines and total with the cart I verified before ordering.
**What was wrong:** The row lookup used `\bINV-...\b`. Cells have no separating text, so the number ran into the next cell and the pattern could never match (0 elements, 31 retries). Replaced by an exact cell match.

## The address mismatch

**Symptom:** The invoice street differed from the checkout value.
**Finding:** The test had been typing into street/city while the postcode lookup was also updating the address. Removed those fills and wait for the lookup-populated values instead. A shared-account invoice can still show a saved address different from the transient checkout result, so the featured test checks that invoice address fields are populated rather than requiring exact equality.

## Confirm stopped working

**Symptom:** Confirm failed in the test and by hand.
**My check:** Reproduced manually, so not a test bug. After the simplified `fillAddress`, Confirm worked again.
**Note:** The sequence suggests address handling was involved, but the cause was not isolated.

## Cart link after the order

**Symptom:** The invoice page did not expose `nav-cart`, so the test timed out trying to click it.
**Result:** The featured test navigates to `/checkout` and verifies the cart has zero rows after ordering.

## Cart test

**AI result:** Add an in-stock product with quantity 2, compare name, unit price and line price with what the product page showed.
**Result:** The cart test reads the selected product's name and unit price from its product page, adds quantity two, and checks the matching cart row and arithmetic.

## Product selection, audit, and CI

**Feedback:** Picking products by position is fragile on the shared demo, especially when stock and grid contents change.
**Change:** `CatalogPage.pickInStock()` reads distinct in-stock product names, optionally filtered by eco status; `openProduct(name)` opens the matching card. Migrated the `atPayment` fixture and cart, eco-discount, featured-checkout, and negative-checkout tests to these helpers, with product-page name checks where the product details are read.
**Follow-up:** A later full run exposed that `pickInStock()` could read stale pre-filter cards immediately after the eco checkbox was checked. The selected name (`Long Nose Pliers`) was absent from the settled eco grid. `CatalogPage.filterEcoOnly()` now polls until all displayed cards are eco products before selection proceeds.
**CI:** `.github/workflows/playwright.yml` runs the audit and Playwright tests with concurrency limited because tests place real orders on a shared demo.

## Final full run

**Latest command:** `npx playwright test --workers=1 --reporter=list`
**Result:** 35 passed, 0 failed, 0 skipped on 2026-10-07. `npm run audit` reported 0 findings across 20 files. This run followed the eco-filter wait fix.

---

## Where the AI got it wrong

| # | AI mistake | How it was caught | Fix |
| 9 | Fields assertion assumed no shared fields | Mutation check failed two tests | Per-field logic |
| 11 | Price regex needed `$` | Error text `No price found in "14.15"` | Optional symbol, two decimals |
| 11 | Shell check mangled by PowerShell | Printed `.15` | Unit test file |
| 13 | Advised a wrong password on a real account | The account locked | Unknown emails only |
| 14 | Assumed malformed email gives a generic error | Checked the app | Observation withdrawn |
| 16 | Test that could not fail | Reviewed it | Trigger the message first |
| 17 | Test passed without placing an order | My HTML showed two clicks | Split steps |
| 18 | `\b` regex that could never match | Call log: 0 elements x31 | Exact cell match |
| 19 | Poll that could not fail; wrong claim about the lookup | Console output | Request log, then simplify |

## Where I overruled or redirected the AI

- Found the real eco discount rule by experiment (entry 8).
- Caught that the checkout is two steps (entry 17).
- Observed the address lookup timing (entry 19).
- Declared address handling too complex and had it simplified.
- Found Confirm failing by hand and separated an app failure from a test failure (entry 20).
