const { test, expect } = require('../../fixtures');

test.describe('checkout negative cases', () => {
  test('invalid postcode or house number shows the lookup error before proceeding', async ({
    customer,
    catalogPage,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    await catalogPage.goto();
    const [productName] = await catalogPage.pickInStock(1);
    await catalogPage.openProduct(productName);
    await productPage.addToCart();

    await cartPage.open();
    await checkoutPage.proceed(1);
    await checkoutPage.proceed(2);

    await checkoutPage.page.getByTestId('country').selectOption('AM');
    await checkoutPage.page.getByTestId('postal_code').fill('123456');
    await checkoutPage.page.getByTestId('house_number').fill('42563553656');

    await expect(checkoutPage.page.getByTestId('postcode-lookup-error')).toBeVisible();
    await expect(checkoutPage.page.getByTestId('street')).not.toHaveValue('');
    await expect(checkoutPage.page.getByTestId('city')).not.toHaveValue('');
  });

  const invalidCardCases = [
    {
      name: 'card number format',
      field: 'credit_card_number',
      value: '0',
      message: /invalid card number format/i,
    },
    {
      name: 'expiry format',
      field: 'expiration_date',
      value: '23/',
      message: /invalid date format\. use mm\//i,
    },
    {
      name: 'cvv length',
      field: 'cvv',
      value: '02',
      message: /cvv must be 3 or 4 digits/i,
    },
  ];

  for (const c of invalidCardCases) {
    test(`credit card validation: ${c.name}`, async ({ atPayment, checkoutPage }) => {
      await checkoutPage.choosePayment('credit-card');
      await checkoutPage.page.getByTestId(c.field).fill(c.value);
      await expect(checkoutPage.page.getByText(c.message)).toBeVisible();
    });
  }
});
