/**
 * Transaction Parser Service
 * 
 * Extracts structured transaction data from raw SMS/notification text.
 * Supports Indian banking SMS formats: UPI, NEFT, IMPS, card transactions.
 * Filters out OTP messages, promotional messages, and non-financial content.
 */

// ── Blacklist patterns — messages to ignore ──────────────────
const IGNORE_PATTERNS = [
  /\bOTP\b/i,
  /\bone.time.password\b/i,
  /\bverification.code\b/i,
  /\bpromotion(al)?\b/i,
  /\boffer\b/i,
  /\bcashback.?offer\b/i,
  /\bapply\s+now\b/i,
  /\bclick\s+here\b/i,
  /\bsubscribe\b/i,
  /\bunsubscribe\b/i,
  /\bavail(able)?\b.*\bloan\b/i,
  /\bpre.?approved\b/i,
  /\bcongratulations\b/i,
  /\bbalance\s*(is|:)\s*/i,  // Balance inquiry, not transaction
  /\bavailable\s+bal(ance)?\b/i,
];

// ── Amount extraction patterns ───────────────────────────────
const AMOUNT_PATTERNS = [
  // Rs.500 | Rs 500 | Rs.5,000.00 | INR 500
  /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  // 500.00 debited | 500 credited
  /([\d,]+(?:\.\d{1,2})?)\s*(?:debited|credited|paid|received|sent|transferred)/i,
  // Paid Rs 500 | Received Rs 500
  /(?:paid|received|sent|transferred|debited|credited)\s*(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  // Amount: 500
  /amount[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
];

// ── Transaction type detection ───────────────────────────────
const DEBIT_KEYWORDS = [
  /\bdebited\b/i,
  /\bpaid\b/i,
  /\bsent\b/i,
  /\btransferred\b/i,
  /\bspent\b/i,
  /\bpurchase\b/i,
  /\bbought\b/i,
  /\bwithdra(wn|wal)\b/i,
  /\bpayment\b/i,
  /\bcharged\b/i,
];

const CREDIT_KEYWORDS = [
  /\bcredited\b/i,
  /\breceived\b/i,
  /\brefund(ed)?\b/i,
  /\bcashback\b/i,
  /\bdeposit(ed)?\b/i,
];

// ── Merchant extraction patterns ─────────────────────────────
const MERCHANT_PATTERNS = [
  // "paid to AMAZON" | "sent to FLIPKART"
  /(?:paid|sent|transferred)\s+to\s+([A-Za-z][A-Za-z0-9\s&.'-]{1,40}?)(?:\s+(?:via|on|from|ref|UPI|NEFT|IMPS|for|w\/))/i,
  // "paid to AMAZON" at end of message
  /(?:paid|sent|transferred)\s+to\s+([A-Za-z][A-Za-z0-9\s&.'-]{1,40}?)\.?\s*$/i,
  // "at AMAZON" | "at Swiggy"
  /\bat\s+([A-Za-z][A-Za-z0-9\s&.'-]{1,40}?)(?:\s+(?:on|ref|UPI|NEFT|IMPS|for|w\/))/i,
  /\bat\s+([A-Za-z][A-Za-z0-9\s&.'-]{1,40}?)\.?\s*$/i,
  // "from JOHN" (for received/credit)
  /(?:received|credited)\s+from\s+([A-Za-z][A-Za-z0-9\s&.'-]{1,40}?)(?:\s+(?:via|on|ref|UPI|NEFT|IMPS))/i,
  // "to VPA merchant@upi"
  /(?:to|from)\s+VPA\s+([A-Za-z0-9._-]+)(?:@)/i,
  // "merchant: AMAZON"
  /merchant[:\s]+([A-Za-z][A-Za-z0-9\s&.'-]{1,40})/i,
  // Google Pay / PhonePe notification format: "Paid ₹500 to Merchant Name"
  /(?:Paid|Sent|Received)\s+(?:Rs\.?|INR|₹)\s*[\d,]+(?:\.\d+)?\s+(?:to|from)\s+([A-Za-z][A-Za-z0-9\s&.'-]{1,40})/i,
];

// ── Reference number patterns ────────────────────────────────
const REFERENCE_PATTERNS = [
  /(?:ref\.?\s*(?:no\.?|number|#)?|txn\.?\s*(?:no\.?|id)?|transaction\s*(?:id|no\.?)?|UPI\s*Ref)[:\s]*([A-Za-z0-9]{6,20})/i,
  /\bRef\s+(\d{6,20})\b/i,
  /\b(\d{12})\b/, // 12-digit UPI reference
];

/**
 * Check if a message should be ignored (OTP, promotion, etc.)
 * @param {string} text - Raw message text
 * @returns {boolean} True if message should be ignored
 */
function shouldIgnore(text) {
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    return true;
  }
  return IGNORE_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Extract amount from message text
 * @param {string} text - Raw message text
 * @returns {number|null} Extracted amount or null
 */
function extractAmount(text) {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      const amount = parseFloat(cleaned);
      if (!isNaN(amount) && amount > 0 && amount < 10000000) { // Sanity check: max 1 crore
        return amount;
      }
    }
  }
  return null;
}

/**
 * Detect transaction type (Debit or Credit)
 * @param {string} text - Raw message text
 * @returns {string} 'Debit' or 'Credit'
 */
function detectTransactionType(text) {
  // Check credit first (less common, more specific)
  for (const pattern of CREDIT_KEYWORDS) {
    if (pattern.test(text)) return 'Credit';
  }
  // Default to debit (more common for expense tracking)
  for (const pattern of DEBIT_KEYWORDS) {
    if (pattern.test(text)) return 'Debit';
  }
  return 'Debit'; // Default
}

/**
 * Extract merchant name from message text
 * @param {string} text - Raw message text
 * @returns {string} Merchant name or 'Unknown'
 */
function extractMerchant(text) {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let merchant = match[1].trim();
      // Clean up: remove trailing punctuation, "via", "on", etc.
      merchant = merchant.replace(/[.,;:!]+$/, '').trim();
      // Capitalize first letter of each word
      merchant = merchant
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      if (merchant.length >= 2) {
        return merchant;
      }
    }
  }
  return 'Unknown';
}

/**
 * Extract reference number from message text
 * @param {string} text - Raw message text
 * @returns {string} Reference number or empty string
 */
function extractReference(text) {
  for (const pattern of REFERENCE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
}

/**
 * Parse a raw SMS/notification message into structured transaction data.
 * 
 * @param {string} rawText - The raw SMS or notification text
 * @param {string} source - 'SMS' or 'NOTIFICATION'
 * @returns {object|null} Parsed transaction data or null if not a financial message
 * 
 * @example
 * parseTransaction("Rs.500 paid to AMAZON via UPI Ref 123456", "SMS")
 * // Returns:
 * // {
 * //   amount: 500,
 * //   merchant: "Amazon",
 * //   transactionType: "Debit",
 * //   reference: "123456",
 * //   source: "SMS",
 * //   rawMessage: "Rs.500 paid to AMAZON via UPI Ref 123456",
 * //   date: "2026-06-18T..."
 * // }
 */
function parseTransaction(rawText, source = 'SMS') {
  // Step 1: Check if message should be ignored
  if (shouldIgnore(rawText)) {
    return null;
  }

  // Step 2: Extract amount (required — if no amount, not a transaction)
  const amount = extractAmount(rawText);
  if (amount === null) {
    return null;
  }

  // Step 3: Extract other fields
  const merchant = extractMerchant(rawText);
  const transactionType = detectTransactionType(rawText);
  const reference = extractReference(rawText);

  return {
    amount,
    merchant,
    transactionType,
    reference,
    source: source.toUpperCase() === 'NOTIFICATION' ? 'NOTIFICATION' : 'SMS',
    rawMessage: rawText,
    date: new Date().toISOString(),
  };
}

module.exports = {
  parseTransaction,
  shouldIgnore,
  extractAmount,
  extractMerchant,
  detectTransactionType,
  extractReference,
};
