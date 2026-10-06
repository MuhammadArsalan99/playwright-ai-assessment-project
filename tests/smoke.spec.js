const { test, expect } = require('../fixtures');

test.describe('smoke', () => {
  test('customer can add one product and the cart arithmetic is consistent', async ({
    customer, // requesting this fixture logs in first
    catalogPage,
    productPage,
    cartPage,
  }) => {
    // 1. Pick the first product from the grid (no hard-coded product or ID)
    await catalogPage.goto();
    const [name] = await catalogPage.pickInStock(1);
    await catalogPage.openProduct(name);

    // 2. Read its details from the product page, then add it
    const product = await productPage.readDetails();
    expect(product.name).toBe(name); // product page agrees with the card we chose
    expect(product.unitCents).toBeGreaterThan(0);
    await productPage.addToCart();

    // 3. The cart must contain that product
    await cartPage.open();
    await expect(cartPage.rowFor(product.name)).toBeVisible();

    // 4. Arithmetic: line = unit x qty, total consistent (read from the page)
    await cartPage.expectTotalsConsistent();
  });
});