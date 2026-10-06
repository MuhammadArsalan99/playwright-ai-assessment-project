const { expect } = require('@playwright/test');
const { parseCents } = require('../utils/price');

class InvoiceDetailPage {
  constructor(page) {
    this.page = page;
    this.invoiceNumber = page.getByTestId('invoice-number');
    this.total = page.getByTestId('total');
    this.paymentMethod = page.getByTestId('payment-method');
    this.street = page.getByTestId('street');
    this.city = page.getByTestId('city');
    this.postalCode = page.getByTestId('postal_code');
    // The products table has no hooks and is the only table on this page.
    // Body rows contain cells, the header row contains column headers.
    this.lines = page.getByRole('row').filter({ has: page.getByRole('cell') });
  }

  async readTotalCents() {
    await expect(this.total).not.toHaveValue('');
    return parseCents(await this.total.inputValue());
  }

  // Columns by position: Quantity, Product, Price, Total (no hooks exist).
  async readLines() {
    const lines = [];
    for (const row of await this.lines.all()) {
      const cells = row.getByRole('cell');
      lines.push({
        qty: Number((await cells.nth(0).innerText()).trim()),
        name: (await cells.nth(1).innerText()).trim(), // trim also removes the trailing &nbsp;
        unitCents: parseCents(await cells.nth(2).innerText()),
        lineCents: parseCents(await cells.nth(3).innerText()),
      });
    }
    return lines;
  }
}

module.exports = { InvoiceDetailPage };