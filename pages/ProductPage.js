const { expect } = require('@playwright/test');
const { parseCents } = require('../utils/price');

class ProductPage {
  constructor(page) {
    this.page = page;
    this.nameHeading = page.getByTestId('product-name');
    this.unitPrice = page.getByTestId('unit-price');
    this.increase = page.getByTestId('increase-quantity');
    this.addButton = page.getByTestId('add-to-cart');
    // Scoped to the heading so badges on related-product cards are not picked up.
    this.ecoBadge = this.nameHeading.getByTestId('eco-badge');
  }

  async readDetails() {
    // The heading also contains the "ECO" badge text, so read only its own text nodes.
    const name = await this.nameHeading.evaluate((el) =>
      Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join('')
        .trim()
    );
    return {
      name,
      unitCents: parseCents(await this.unitPrice.innerText()),
      isEco: await this.ecoBadge.isVisible(),
    };
  }

  async addToCart(quantity = 1) {
    for (let i = 1; i < quantity; i++) await this.increase.click();
    await this.addButton.click();

    await expect(this.page.getByText(/product added to shopping(?: cart)?/i)).toBeVisible({ timeout: 15_000 });
  }
}

module.exports = { ProductPage };