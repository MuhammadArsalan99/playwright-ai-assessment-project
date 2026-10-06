const { test, expect } = require('../../fixtures');
const { PAYMENT_METHODS, INSTALLMENT_OPTIONS } = require('../../utils/paymentMethods');

test.describe('payment method fields', () => {
  for (const method of PAYMENT_METHODS) {
    test(`${method.value}: shows only its own fields`, async ({ atPayment, checkoutPage }) => {
      await checkoutPage.choosePayment(method.value);
      await expect(checkoutPage.installmentsError).toBeHidden();
      await checkoutPage.expectFieldsFor(method.value);
    });
  }

    test('buy-now-pay-later: offers the expected installment options', async ({ atPayment, checkoutPage }) => {
    await checkoutPage.choosePayment('buy-now-pay-later');
    await expect(checkoutPage.installments).toHaveValue(''); // placeholder is selected by default
    expect(await checkoutPage.installmentOptionValues()).toEqual(INSTALLMENT_OPTIONS);
  });

   test('buy-now-pay-later: leaving installments unselected shows a validation message', async ({ atPayment, checkoutPage }) => {
    await checkoutPage.choosePayment('buy-now-pay-later');

    // Touch the field and leave it without choosing a plan.
    await checkoutPage.installments.focus();
    await checkoutPage.installments.blur();

    await expect(checkoutPage.installmentsError).toBeVisible();
    await expect(checkoutPage.installments).toHaveValue('');
  });

  test('buy-now-pay-later: choosing a plan clears the validation message', async ({ atPayment, checkoutPage }) => {
    await checkoutPage.choosePayment('buy-now-pay-later');

    // Trigger the message first, so "hidden afterwards" proves it was cleared.
    await checkoutPage.installments.focus();
    await checkoutPage.installments.blur();
    await expect(checkoutPage.installmentsError).toBeVisible();

    await checkoutPage.installments.selectOption('6');
    await expect(checkoutPage.installments).toHaveValue('6');
    await expect(checkoutPage.installmentsError).toBeHidden();
  });
});