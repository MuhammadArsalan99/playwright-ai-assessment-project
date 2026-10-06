const { expect } = require('@playwright/test');

class LoginPage {
  constructor(page) {
    this.page = page;
    this.navSignIn = page.getByTestId('nav-sign-in');
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submit = page.getByTestId('login-submit');
  }

  async goto() {
    await this.page.goto('/');
    await this.navSignIn.click();
  }

  async login(email, password) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  async expectLoggedIn() {
    await expect(this.navSignIn).toBeHidden();
  }

  async expectInvalidCredentials() {
    // No data-test known for this message, so match the user-visible text.
    await expect(this.page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(this.submit).toBeVisible(); // still on the login form
  }

  async expectStillLoggedOut() {
    await expect(this.submit).toBeVisible();
    await expect(this.navSignIn).toBeVisible();
  }
}

module.exports = { LoginPage };