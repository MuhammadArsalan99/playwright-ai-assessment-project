// Source: observed in the live app via codegen and manual check. Update here if the app changes.
const PAYMENT_METHODS = [
  { value: 'credit-card', fields: ['credit_card_number', 'expiration_date', 'cvv', 'card_holder_name'] },
  { value: 'bank-transfer', fields: ['bank_name', 'account_name', 'account_number'] },
  { value: 'buy-now-pay-later', fields: ['monthly_installments'] },
  { value: 'gift-card', fields: ['gift_card_number', 'validation_code'] },
  { value: 'cash-on-delivery', fields: [] }, // verified: no extra fields
];

// Observed in the live app. Update here if the options change.
const INSTALLMENT_OPTIONS = ['3', '6', '9', '12'];

module.exports = { PAYMENT_METHODS, INSTALLMENT_OPTIONS };