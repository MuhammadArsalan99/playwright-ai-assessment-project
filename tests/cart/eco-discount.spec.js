const { test, expect } = require('../../fixtures');
const { ECO_DISCOUNT_MIN_ITEMS, ECO_DISCOUNT_RATE } = require('../../utils/rules');

test.describe('eco discount rule', () => {
  test.describe.configure({ mode: 'serial' });

  const cases = [
    { name: 'applies at the item threshold with an eco product', isEco: true, quantity: ECO_DISCOUNT_MIN_ITEMS, discounted: true },
    { name: 'does not apply at the threshold without an eco product', isEco: false, quantity: ECO_DISCOUNT_MIN_ITEMS, discounted: false },
    { name: 'zero quantity normalizes to one and qualifies with an eco product', isEco: true, quantity: ECO_DISCOUNT_MIN_ITEMS, discounted: true, setZero: true },
  ];

  for (const scenario of cases) {
    test(scenario.name, async ({ customer, catalogPage, productPage, cartPage }) => {
      await catalogPage.goto();
      if (scenario.isEco) await catalogPage.filterEcoOnly();

      const [productName] = await catalogPage.pickInStock(1, { eco: scenario.isEco });
      await catalogPage.openProduct(productName);
      const product = await productPage.readDetails();
      expect(product.name).toBe(productName);
      expect(product.isEco).toBe(scenario.isEco);
      await productPage.addToCart(scenario.quantity);
      await cartPage.open();
      if (scenario.setZero) await cartPage.setQuantity(product.name, '0');

      await expect
        .poll(async () => {
          const current = await cartPage.readSnapshot();
          return current.lines.length === 1 && current.lines[0].qty === scenario.quantity;
        }, { message: 'cart should show the selected product quantity' })
        .toBe(true);
      const snapshot = await cartPage.readSnapshot();

      if (scenario.discounted) {
        await expect
          .poll(async () => {
            const current = await cartPage.readSnapshot();
            return current.discountCents !== null && current.subtotalCents !== null;
          }, { message: 'eligible cart should display subtotal and eco discount' })
          .toBe(true);

        const updated = await cartPage.readSnapshot();
        expect(updated.subtotalCents).toBe(snapshot.lines[0].lineCents);
        expect(updated.discountCents).toBe(Math.round(updated.subtotalCents * ECO_DISCOUNT_RATE));
        expect(updated.totalCents).toBe(Math.round(updated.subtotalCents * (1 - ECO_DISCOUNT_RATE)));
      } else {
        await expect
          .poll(async () => (await cartPage.readSnapshot()).discountCents)
          .toBeNull();
        const updated = await cartPage.readSnapshot();
        expect(updated.totalCents).toBe(updated.lines[0].lineCents);
      }

    });
  }
});
