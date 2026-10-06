const CUSTOMER = {
  email: process.env.CUSTOMER_EMAIL ?? 'customer2@practicesoftwaretesting.com',
  password: process.env.CUSTOMER_PASSWORD ?? 'welcome01',
};

const ADDRESS = {
  country: 'AM',
  postal_code: '123456',
  house_number: '42563354',
  state: 'Oklahoma State',
};

// Always a future date, so the test never expires.
function futureExpiry(years = 3) {
  return `12/${new Date().getFullYear() + years}`;
}

const CARD = () => ({
  credit_card_number: '1234-1234-1234-1234',
  expiration_date: futureExpiry(),
  cvv: '123',
  card_holder_name: 'Test User',
});

module.exports = { CUSTOMER, ADDRESS, CARD, futureExpiry };