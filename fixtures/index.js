const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { CatalogPage } = require('../pages/CatalogPage');
const { ProductPage } = require('../pages/ProductPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');
const { CUSTOMER, ADDRESS } = require('../utils/testData');
const { InvoicesPage } = require('../pages/InvoicesPage');
const { InvoiceDetailPage } = require('../pages/InvoiceDetailPage');

exports.test = base.test.extend({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  catalogPage: async ({ page }, use) => use(new CatalogPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  invoicesPage: async ({ page }, use) => use(new InvoicesPage(page)),
  invoiceDetailPage: async ({ page }, use) => use(new InvoiceDetailPage(page)),

  // Request this fixture to start a test already signed in as the customer.
  customer: async ({ loginPage }, use) => {
    await loginPage.goto();
    await loginPage.login(CUSTOMER.email, CUSTOMER.password);
    await loginPage.expectLoggedIn();
    await use();
  },

  // Signed in, one product in the cart, standing on the payment step.
  atPayment: async ({ customer, catalogPage, productPage, cartPage, checkoutPage }, use) => {
    await catalogPage.goto();
    const [productName] = await catalogPage.pickInStock(1);
    await catalogPage.openProduct(productName);
    await productPage.addToCart();
    await cartPage.open();
    await checkoutPage.proceed(1);
    await checkoutPage.proceed(2);
    await checkoutPage.fillAddress(ADDRESS);
    await checkoutPage.proceed(3);
    await use();
  },
});

exports.expect = base.expect;