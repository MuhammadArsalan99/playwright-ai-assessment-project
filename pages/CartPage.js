const { expect } = require('@playwright/test');
const { parseCents } = require('../utils/price');

// Pure arithmetic check. Returns a list of problems (empty means consistent).
function checkSnapshot(s) {
  const problems = [];
  let sum = 0;
  s.lines.forEach((l, i) => {
    sum += l.lineCents;
    if (l.lineCents !== l.unitCents * l.qty) {
      problems.push(`line ${i + 1}: ${l.lineCents} != ${l.unitCents} x ${l.qty}`);
    }
  });
  let expectedTotal = sum;
  if (s.subtotalCents !== null) {
    if (s.subtotalCents !== sum) problems.push(`subtotal ${s.subtotalCents} != sum of lines ${sum}`);
    expectedTotal = s.subtotalCents - (s.discountCents ?? 0);
  }
  if (s.totalCents !== expectedTotal) problems.push(`total ${s.totalCents} != expected ${expectedTotal}`);
  return problems;
}

class CartPage {
  constructor(page) {
    this.page = page;
    this.navCart = page.getByTestId('nav-cart');
    this.rows = page.getByRole('row').filter({ has: page.getByTestId('line-price') });
    this.subtotal = page.getByTestId('cart-subtotal');
    this.discount = page.getByTestId('cart-eco-discount');
    this.total = page.getByTestId('cart-total');
  }

  async open() {
    await this.navCart.click();
  }

  rowFor(name) {
    return this.rows.filter({
      has: this.page.getByRole('spinbutton', { name: `Quantity for ${name}`, exact: true }),
    });
  }

  async setQuantity(name, quantity) {
    const input = this.rowFor(name).getByRole('spinbutton');
    await input.fill(String(quantity));
    await input.press('Tab');
  }

  async readRow(name) {
    const row = this.rowFor(name);
    return {
      qty: Number(await row.getByRole('spinbutton').inputValue()),
      unitCents: parseCents(await row.getByTestId('product-price').innerText()),
      lineCents: parseCents(await row.getByTestId('line-price').innerText()),
    };
  }

  async removeItem(name) {
    const row = this.rowFor(name);
    // The remove control has no data-test and no accessible name (see OBSERVATIONS.md),
    // so use its styling class, scoped to the row found by product name.
    await row.locator('a.btn-danger').click();
    await expect(row).toHaveCount(0);
  }

  // subtotal and eco discount exist only when a discount applies.
  async readSnapshot() {
    const lines = [];
    for (const row of await this.rows.all()) {
      lines.push({
        unitCents: parseCents(await row.getByTestId('product-price').innerText()),
        qty: Number(await row.getByRole('spinbutton').inputValue()),
        lineCents: parseCents(await row.getByTestId('line-price').innerText()),
      });
    }
    const optional = async (locator) =>
      (await locator.count()) ? parseCents(await locator.innerText()) : null;
    const discount = await optional(this.discount);
    return {
      lines,
      subtotalCents: await optional(this.subtotal),
      discountCents: discount === null ? null : Math.abs(discount),
      totalCents: parseCents(await this.total.innerText()),
    };
  }

  // Totals refresh asynchronously after each change, so poll until consistent.
  async expectTotalsConsistent() {
    await expect
      .poll(async () => {
        try {
          return checkSnapshot(await this.readSnapshot());
        } catch (e) {
          return [`could not read cart: ${e.message}`];
        }
      }, { message: 'cart arithmetic should be consistent' })
      .toEqual([]);
  }
}

module.exports = { CartPage, checkSnapshot };