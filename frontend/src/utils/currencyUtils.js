// Currency configuration map
export const CURRENCY_CONFIG = {
  INR: { symbol: '₹', locale: 'en-IN', code: 'INR' },
  USD: { symbol: '$', locale: 'en-US', code: 'USD' },
  EUR: { symbol: '€', locale: 'de-DE', code: 'EUR' },
  GBP: { symbol: '£', locale: 'en-GB', code: 'GBP' },
  JPY: { symbol: '¥', locale: 'ja-JP', code: 'JPY' },
};

/**
 * Get the symbol for a given currency code.
 * @param {string} currencyCode - e.g. 'INR', 'USD'
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currencyCode) => {
  const code = (currencyCode || 'INR').toUpperCase();
  return CURRENCY_CONFIG[code]?.symbol || CURRENCY_CONFIG.INR.symbol;
};

/**
 * Format a numeric amount according to the currency code's locale and symbol.
 * @param {number|string} amount - The amount to format
 * @param {string} currencyCode - e.g. 'INR', 'USD'
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode) => {
  const code = (currencyCode || 'INR').toUpperCase();
  const config = CURRENCY_CONFIG[code] || CURRENCY_CONFIG.INR;
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    // Fallback format
    const formattedNum = numericAmount.toFixed(numericAmount % 1 === 0 ? 0 : 2);
    return `${config.symbol}${formattedNum}`;
  }
};
