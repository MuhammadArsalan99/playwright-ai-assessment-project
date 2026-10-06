// Parse a displayed price such as "14.15", "$1,234.56" or "-$4.50" into integer cents.
// Requires exactly two decimals, so stray numbers in a label ("5%", "3 items") are never read as money.
// The currency symbol is optional because the product page shows prices without it.
function parseCents(text) {
  const match = String(text).replace(/,/g, '').match(/(-)?\s*\$?\s*(\d+\.\d{2})(?!\d)/);
  if (!match) throw new Error(`No price found in "${text}"`);
  const cents = Math.round(parseFloat(match[2]) * 100);
  return match[1] ? -cents : cents;
}

module.exports = { parseCents };