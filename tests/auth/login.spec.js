const { test, expect } = require('../../fixtures');
const { CUSTOMER } = require('../../utils/testData');

// Never submit a wrong password for a shared account
// the app locks accounts after repeated failures. Invalid cases use unknown emails only.
const unknownEmail = () => `nobody.${Date.now()}@example.com`;

test.describe('login', () => {
  test('customer signs in with valid credentials', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(CUSTOMER.email, CUSTOMER.password);
    await loginPage.expectLoggedIn();
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  // Messages below were observed in the live app. Update here if the wording changes.
  const invalidCases = [
    {
      name: 'unknown email',
      email: unknownEmail,
      password: 'welcome01',
      shown: [/invalid email or password/i],
      notShown: [/is required/i],
    },
    {
      name: 'malformed email',
      email: () => 'not-an-email',
      password: 'welcome01',
      shown: [/email format is invalid/i],
      notShown: [/invalid email or password/i, /is required/i],
    },
    {
      name: 'empty email',
      email: () => '',
      password: 'welcome01',
      shown: [/email is required/i],
      notShown: [/password is required/i, /invalid email or password/i],
    },
    {
      name: 'empty password',
      email: unknownEmail,
      password: '',
      shown: [/password is required/i],
      notShown: [/email is required/i, /invalid email or password/i],
    },
    {
      name: 'both fields empty',
      email: () => '',
      password: '',
      shown: [/email is required/i, /password is required/i],
      notShown: [/invalid email or password/i],
    },
  ];

  for (const c of invalidCases) {
    test(`shows the right message and does not sign in: ${c.name}`, async ({ loginPage, page }) => {
      await loginPage.goto();
      await loginPage.login(c.email(), c.password);
      for (const message of c.shown) await expect(page.getByText(message)).toBeVisible();
      for (const message of c.notShown) await expect(page.getByText(message)).toBeHidden();
      await loginPage.expectStillLoggedOut();
    });
  }
});