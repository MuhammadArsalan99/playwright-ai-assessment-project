const { expect } = require('@playwright/test');

const { parseCents } = require('../utils/price');
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class CatalogPage {
  constructor(page) {
    this.page = page;
    this.sort = page.getByTestId('sort');
    this.searchInput = page.getByTestId('search-query');
    this.searchSubmit = page.getByTestId('search-submit');
    this.ecoFilter = page.getByTestId('eco-friendly-filter');
    this.cards = page.locator('a[data-test^="product-"]');
    this.noResults = page.getByTestId('no-results');
    this.resultCount = page.getByTestId('search-result-count');
    this.searchTerm = page.getByTestId('search-term');
    this.searchCompleted = page.getByTestId('search_completed');
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.cards.first()).toBeVisible();
  }

  async search(term) {
    await this.searchInput.fill(term);
    await this.searchSubmit.click();
    await expect(this.searchCompleted).toBeVisible();
  }

  async sortBy(value) {
    await this.sort.selectOption(value); // for example 'price,desc'
  }

  async filterEcoOnly() {
    await this.ecoFilter.check();
    await expect
      .poll(async () => {
        const cards = await this.readCards().catch(() => []);
        return cards.length > 0 && cards.every((card) => card.isEco);
      }, { message: 'catalog should finish filtering to eco products' })
      .toBe(true);
  }

  cardsWithEco() {
    return this.cards.filter({ has: this.page.getByTestId('eco-badge') });
  }

  cardsWithoutEco() {
    return this.cards.filter({ hasNot: this.page.getByTestId('eco-badge') });
  }

  async readCards() {
    const result = [];
    for (const card of await this.cards.all()) {
      result.push({
        name: (await card.getByTestId('product-name').innerText()).trim(),
        priceCents: parseCents(await card.getByTestId('product-price').innerText()),
        isEco: (await card.getByTestId('eco-badge').count()) > 0,
        inStock: (await card.getByTestId('out-of-stock').count()) === 0,
      });
    }
    return result;
  }

  inStockCards() {
    return this.cards.filter({ hasNot: this.page.getByTestId('out-of-stock') });
  }

  async readResultCount() {
    const text = await this.resultCount.innerText();
    const match = text.match(/(\d+)\s+products?\s+found/i);
    if (!match) throw new Error(`No result count in "${text}"`);
    return Number(match[1]);
  }

    // The card for a product, found by its exact name (the name element has padding spaces).
  cardFor(name) {
    return this.cards.filter({
      has: this.page
        .getByTestId('product-name')
        .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(name)}\\s*$`) }),
    });
  }

  // Names of `count` distinct in-stock products shown right now, read from the page.
  async pickInStock(count = 1, { eco } = {}) {
    let names = [];
    await expect
      .poll(async () => {
        const cards = await this.readCards().catch(() => []);
        names = [...new Set(cards
          .filter((card) => card.inStock && (eco === undefined || card.isEco === eco))
          .map((card) => card.name))];
        return names.length;
      }, { message: `catalog should show ${count} matching in-stock product(s)`, timeout: 15_000 })
      .toBeGreaterThanOrEqual(count);

    return names.slice(0, count);
  }

  async openProduct(name) {
    await this.cardFor(name).click();
  }
}

module.exports = { CatalogPage };