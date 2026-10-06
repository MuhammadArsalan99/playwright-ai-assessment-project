const { expect } = require('@playwright/test');
const { PAYMENT_METHODS } = require('../utils/paymentMethods');

class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.paymentMethod = page.getByTestId('payment-method');
    this.finishButton = page.getByTestId('finish');
    this.successMessage = page.getByTestId('payment-success-message');
    this.installments = page.getByTestId('monthly_installments');
    this.installmentsError = page.getByText(/select the number of monthly installments/i);
    // No data-test on the confirmation, so use its id.
    this.orderConfirmation = page.locator('#order-confirmation');
    this.invoiceNumber = this.orderConfirmation.locator('span');
  }

  async proceed(step) {
    await this.page.getByTestId(`proceed-${step}`).click(); // 1: cart, 2: sign-in step, 3: address
  }

  async fillAddress(address) {
    await this.page.getByTestId('country').selectOption(address.country);
    await this.page.getByTestId('postal_code').fill(address.postal_code);
    await this.page.getByTestId('house_number').fill(address.house_number);

    // Street and city are filled by the app's postcode lookup. Do not type into them.
    await expect(this.page.getByTestId('street')).not.toHaveValue('', { timeout: 15_000 });
    await expect(this.page.getByTestId('city')).not.toHaveValue('', { timeout: 15_000 });

    const state = this.page.getByTestId('state');
    if (!(await state.inputValue()).trim()) await state.fill(address.state);
  }

  async choosePayment(method) {
    await this.paymentMethod.selectOption(method);
  }

  async expectFieldsFor(method) {
    const expected = new Set(PAYMENT_METHODS.find((m) => m.value === method).fields);
    const allFields = new Set(PAYMENT_METHODS.flatMap((m) => m.fields));

    for (const field of allFields) {
      const locator = this.page.getByTestId(field);
      if (expected.has(field)) await expect(locator).toBeVisible();
      else await expect(locator).toBeHidden();
    }
  }

  async fillCreditCard(card) {
    for (const [field, value] of Object.entries(card)) {
      await this.page.getByTestId(field).fill(value);
    }
  }

  // Validate payment first; confirming the order is a separate action.
  async checkPayment() {
    await expect(this.finishButton).toHaveText(/check payment/i);
    await this.finishButton.click();
    await expect(this.successMessage).toHaveText(/payment was successful/i);
    await expect(this.finishButton).toHaveText(/confirm/i);
  }

  // Step 2: the same button now reads "Confirm" and should place the order.
  async confirmOrder() {
    await expect(this.finishButton).toHaveText(/confirm/i);
    await this.finishButton.click();
  }

  async installmentOptionValues() {
    // Skip the disabled placeholder option (value "").
    return this.installments.locator('option:not([disabled])').evaluateAll((opts) => opts.map((o) => o.value));
  }

  // The confirmation appears some time after "Confirm", so allow a longer wait.
  async expectOrderConfirmed() {
    await expect(this.orderConfirmation).toContainText(/thanks for your order/i, { timeout: 20_000 });
    await expect(this.invoiceNumber).toHaveText(/^INV-\d+$/);
    return (await this.invoiceNumber.innerText()).trim();
  }

  async readAddress() {
    const read = (field) => this.page.getByTestId(field).inputValue();
    return {
      street: await read('street'),
      city: await read('city'),
      postal_code: await read('postal_code'),
    };
  }
}

module.exports = { CheckoutPage };