const { expect } = require('@playwright/test');

class InvoicesPage {
  constructor(page) {
    this.page = page;
    this.title = page.getByTestId('page-title');
  }

  async goto() {
    await this.page.goto('/account/invoices');
    await expect(this.title).toHaveText('Invoices');
  }

  // Rows have no test hook, so find the row by a cell whose whole text is the invoice number.
  // Matching the cell (not the row text) avoids "INV-1" matching "INV-10" and avoids
  // the number running into the next cell's text.
  rowFor(invoiceNumber) {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('cell', { name: invoiceNumber, exact: true }),
    });
  }

  // Page 1 only. The list is newest-first and busy, so a fresh order is on page 1.
  async openInvoice(invoiceNumber) {
    const row = this.rowFor(invoiceNumber);
    await expect(row, `${invoiceNumber} should be listed on page 1 of My invoices`).toHaveCount(1, {
      timeout: 15_000,
    });
    await row.getByRole('link', { name: 'Details' }).click();
  }
}

module.exports = { InvoicesPage };