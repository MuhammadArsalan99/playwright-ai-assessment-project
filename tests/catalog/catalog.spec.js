const { test, expect } = require('../../fixtures');
const { PAGE_SIZE } = require('../../utils/rules');

// The grid re-renders after search, sort and filter. Cards can detach mid-read,
// so a failed read counts as "not ready yet" and expect.poll tries again.
const readCardsOrEmpty = (catalogPage) => catalogPage.readCards().catch(() => []);

function isSorted(values, compare, direction) {
  // direction: 1 = ascending, -1 = descending
  return values.every((v, i) => i === 0 || compare(values[i - 1], v) * direction <= 0);
}
const byNumber = (a, b) => a - b;
const byText = (a, b) => a.localeCompare(b);

test.describe('catalog', () => {
  test('search finds a product by a word from its name', async ({ catalogPage }) => {
    await catalogPage.goto();

    // Take the term from the page itself: the longest word of the first product's name.
    const [first] = await catalogPage.readCards();
    const term = first.name
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9]/gi, ''))
      .sort((a, b) => b.length - a.length)[0];

    await catalogPage.search(term);

    await expect
      .poll(async () => {
        const cards = await readCardsOrEmpty(catalogPage);
        return cards.length > 0 && cards.every((c) => c.name.toLowerCase().includes(term.toLowerCase()));
      }, { message: `every result should contain "${term}"` })
      .toBe(true);

    const names = (await catalogPage.readCards()).map((c) => c.name);
    expect(names).toContain(first.name);
  });

  test('eco filter shows only eco products', async ({ catalogPage }) => {
    await catalogPage.goto();
    await catalogPage.filterEcoOnly();

    await expect
      .poll(async () => {
        const cards = await readCardsOrEmpty(catalogPage);
        return cards.length > 0 && cards.every((c) => c.isEco);
      }, { message: 'every card should carry an eco badge' })
      .toBe(true);
  });

    // Checks the first page only (9 cards). Sorting across pages is not verified.
  const sorts = [
    { label: 'price low to high', value: 'price,asc', key: (c) => c.priceCents, compare: byNumber, direction: 1 },
    { label: 'price high to low', value: 'price,desc', key: (c) => c.priceCents, compare: byNumber, direction: -1 },
    { label: 'name A to Z', value: 'name,asc', key: (c) => c.name.toLowerCase(), compare: byText, direction: 1 },
    { label: 'name Z to A', value: 'name,desc', key: (c) => c.name.toLowerCase(), compare: byText, direction: -1 },
  ];

  for (const s of sorts) {
    test(`sort by ${s.label} orders the visible products`, async ({ catalogPage }) => {
      await catalogPage.goto();
      await catalogPage.sortBy(s.value);

      await expect
        .poll(async () => {
          const cards = await readCardsOrEmpty(catalogPage);
          return cards.length >= 2 && isSorted(cards.map(s.key), s.compare, s.direction);
        }, { message: `visible products should be sorted by ${s.label}` })
        .toBe(true);
    });
  }

  test('search with no matches shows the empty state', async ({ catalogPage }) => {
    const term = `zzzz${Date.now()}`;
    await catalogPage.goto();
    await catalogPage.search(term);
    await expect(catalogPage.noResults).toHaveText(/no products found/i);
    await expect(catalogPage.searchTerm).toHaveText(term);
    await expect(catalogPage.resultCount).toContainText(/0 products found/i);
    await expect(catalogPage.cards).toHaveCount(0);
  });

    test('search result count matches the products shown', async ({ catalogPage }) => {
    await catalogPage.goto();
    const [first] = await catalogPage.readCards();
    const term = first.name.split(/\s+/).map((w) => w.replace(/[^a-z0-9]/gi, ''))
      .sort((a, b) => b.length - a.length)[0];

    await catalogPage.search(term);
    await expect(catalogPage.resultCount).toBeVisible();
    await expect(catalogPage.searchTerm).toHaveText(term);

    // One page shows at most PAGE_SIZE cards, so compare against min(count, PAGE_SIZE).
    await expect
      .poll(async () => {
        try {
          const count = await catalogPage.readResultCount();
          const shown = (await catalogPage.readCards()).length;
          return shown === Math.min(count, PAGE_SIZE);
        } catch {
          return false;
        }
      }, { message: 'cards shown should equal the reported count, up to one page' })
      .toBe(true);
  });
});