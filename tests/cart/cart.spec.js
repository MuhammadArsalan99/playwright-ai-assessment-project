const { test, expect } = require('../../fixtures');

test.describe('cart', () => {
  const invalidQuantities = ['0', '-5'];

  test('an added product appears with the right name, price and quantity', async ({
    customer,
    catalogPage,
    productPage,
    cartPage,
  }) => {
    // Pick an in-stock product from the grid and read what the product page says.
    await catalogPage.goto();
    const [productName] = await catalogPage.pickInStock(1);
    await catalogPage.openProduct(productName);
    const product = await productPage.readDetails();
    expect(product.name).toBe(productName);

    // Add two of them, so quantity and line price are tested and not just presence.
    await productPage.addToCart(2);
    await cartPage.open();

    // The row is found by the product name, so a wrong name fails here.
    await expect(cartPage.rowFor(product.name)).toBeVisible();

    // Name, unit price and quantity come from the product page and the click, not constants.
    await expect
      .poll(() => cartPage.readRow(product.name), { message: 'cart row should match the product page' })
      .toEqual({
        qty: 2,
        unitCents: product.unitCents,
        lineCents: product.unitCents * 2,
      });

    // The whole cart is arithmetically consistent, including the eco discount if one applies.
    await cartPage.expectTotalsConsistent();
  });

  for (const quantity of invalidQuantities) {
    test(`quantity ${quantity} is corrected to one`, async ({ customer, catalogPage, productPage, cartPage }) => {
      await catalogPage.goto();
      const [productName] = await catalogPage.pickInStock(1);
      await catalogPage.openProduct(productName);
      const product = await productPage.readDetails();
      expect(product.name).toBe(productName);
      await productPage.addToCart();
      await cartPage.open();

      await cartPage.setQuantity(product.name, quantity);

      await expect(cartPage.rowFor(product.name).getByRole('spinbutton')).toHaveValue('1');
      await cartPage.expectTotalsConsistent();
    });
  }

  test('quantity above the maximum shows the limit alert and is capped', async ({
    customer,
    catalogPage,
    productPage,
    cartPage,
    page,
  }) => {
    await catalogPage.goto();
    const [name] = await catalogPage.pickInStock(1);
    await catalogPage.openProduct(name);
    const product = await productPage.readDetails();
    expect(product.name).toBe(name);
    await productPage.addToCart();
    await cartPage.open();

    await cartPage.setQuantity(product.name, '999999999999999999');

    await expect(page.getByRole('alert', { name: /you can order at most 99 of/i })).toBeVisible();
    await expect
      .poll(async () => Number(await cartPage.rowFor(product.name).getByRole('spinbutton').inputValue()))
      .toBeLessThanOrEqual(99);
    await cartPage.expectTotalsConsistent();
  });
});