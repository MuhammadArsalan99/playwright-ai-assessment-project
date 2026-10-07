const { test, expect } = require('../../fixtures');
const { ADDRESS, CARD } = require('../../utils/testData');

test('verified multi-item checkout', async ({
  customer,
  catalogPage,
  productPage,
  cartPage,
  checkoutPage,
  invoicesPage,
  invoiceDetailPage,
  page,
}) => {
  const products = [];
  let invoice;
  let cartSnapshot;

  // 1. Add two different products from their product pages
  await catalogPage.goto();
  const productNames = await catalogPage.pickInStock(2);
  for (const productName of productNames) {
    await test.step(`add ${productName} from its product page`, async () => {
      await catalogPage.goto();
      await catalogPage.openProduct(productName);
      const product = await productPage.readDetails();
      expect(product.name).toBe(productName);
      await productPage.addToCart();
      products.push(product);
    });
  }
  const [keep, drop] = products;
  expect(keep.name).not.toBe(drop.name);

  // 2. Cart: change one quantity, remove the other, verify arithmetic from the page
  await test.step('open the cart and verify both products are listed', async () => {
    await cartPage.open();
    await expect(cartPage.rowFor(keep.name)).toBeVisible();
    await expect(cartPage.rowFor(drop.name)).toBeVisible();
  });

  await test.step('change the quantity of the first product', async () => {
    await cartPage.setQuantity(keep.name, 3);
    await expect(cartPage.rowFor(keep.name).getByRole('spinbutton')).toHaveValue('3');
    await cartPage.expectTotalsConsistent();
  });

  await test.step('remove the second product', async () => {
    await cartPage.removeItem(drop.name);
    await cartPage.expectTotalsConsistent();
  });

  await test.step('the kept line price equals the unit price read earlier x 3', async () => {
    const snapshot = await cartPage.readSnapshot();
    const line = snapshot.lines.find((l) => l.qty === 3 && l.unitCents === keep.unitCents);
    expect(line, 'kept product line with qty 3').toBeTruthy();
    expect(line.lineCents).toBe(keep.unitCents * 3);
  });

  await test.step('record the verified cart before checkout', async () => {
    cartSnapshot = await cartPage.readSnapshot();
  });

  // 3. Checkout up to payment
  await test.step('proceed to the payment step', async () => {
    await checkoutPage.proceed(1);
    await checkoutPage.proceed(2);
    await checkoutPage.fillAddress(ADDRESS);
    await checkoutPage.proceed(3);
  });

  await test.step('choose credit card and verify its fields (and only its fields) appear', async () => {
    await checkoutPage.choosePayment('credit-card');
    await checkoutPage.expectFieldsFor('credit-card');
  });

  // 4. Complete the order and assert the confirmation
    await test.step('check the payment details', async () => {
    await checkoutPage.fillCreditCard(CARD());
    await checkoutPage.checkPayment(); // asserts "Payment was successful" and the Confirm button
  });

    await test.step('confirm the order and get an invoice number', async () => {
    await checkoutPage.confirmOrder();
    invoice = await checkoutPage.expectOrderConfirmed();
  });

    await test.step('the order is in My invoices and matches the verified cart', async () => {
    await invoicesPage.goto();
    await invoicesPage.openInvoice(invoice);

    await expect(invoiceDetailPage.invoiceNumber).toHaveValue(invoice);
    await expect(invoiceDetailPage.lines).toHaveCount(cartSnapshot.lines.length);
    const lines = await invoiceDetailPage.readLines();

    // Same lines as the cart: quantity, unit price and line total.
    const signature = (l) => `${l.qty} x ${l.unitCents} = ${l.lineCents}`;
    expect(lines.map(signature).sort()).toEqual(cartSnapshot.lines.map(signature).sort());

    // Right products: the one we kept is there, the one we removed is not.
    const names = lines.map((l) => l.name);
    expect(names).toContain(keep.name);
    expect(names).not.toContain(drop.name);

    // The stored total equals the cart total we verified before ordering.
    expect(await invoiceDetailPage.readTotalCents()).toBe(cartSnapshot.totalCents);

    await expect(invoiceDetailPage.street).not.toHaveValue('');
    await expect(invoiceDetailPage.city).not.toHaveValue('');
    await expect(invoiceDetailPage.postalCode).not.toHaveValue('');
  });

  await test.step('the cart is empty after the order', async () => {
    await page.goto('/checkout');
    await expect(cartPage.rows).toHaveCount(0);
  });
});