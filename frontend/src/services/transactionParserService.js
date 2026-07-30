/**
 * Transaction Parser Service (Client-Side)
 * 
 * Mirrors the backend parser for instant client-side parsing.
 * Processes SMS/notification text locally before sending to server.
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
  /\bbalance\s*(is|:)\s*/i,
  /\bavailable\s+bal(ance)?\b/i,
];

// ── Amount extraction patterns ───────────────────────────────
const AMOUNT_PATTERNS = [
  /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)\s*(?:debited|credited|paid|received|sent|transferred)/i,
  /(?:paid|received|sent|transferred|debited|credited)\s*(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  /amount[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
];

// ── Transaction type detection ───────────────────────────────
const DEBIT_KEYWORDS = [
  /\bdebited\b/i, /\bpaid\b/i, /\bsent\b/i, /\btransferred\b/i,
  /\bspent\b/i, /\bpurchase\b/i, /\bbought\b/i, /\bwithdra(wn|wal)\b/i,
  /\bpayment\b/i, /\bcharged\b/i,
];

const CREDIT_KEYWORDS = [
  /\bcredited\b/i, /\breceived\b/i, /\brefund(ed)?\b/i,
  /\bcashback\b/i, /\bdeposit(ed)?\b/i,
];

// ── Merchant extraction patterns ─────────────────────────────
const MERCHANT_PATTERNS = [
  /(?:paid|sent|transferred)\s+to\s+([A-Za-z][A-Za-z0-9\s&.'-]{1,40}?)(?:\s+(?:via|on|from|ref|UPI|NEFT|IMPS|for|w\/))/i,
  /(?:paid|sent|transferred)\s+to\s+([A-Za-z][A-Za-z0-9\s&.'-]{1,40}?)\.?\s*$/i,
  /\bat\s+([A-Za-z][A-Za-z0-9\s&.'-]{1,40}?)(?:\s+(?:on|ref|UPI|NEFT|IMPS|for|w\/))/i,
  /\bat\s+([A-Za-z][A-Za-z0-9\s&.'-]{1,40}?)\.?\s*$/i,
  /(?:received|credited)\s+from\s+([A-Za-z][A-Za-z0-9\s&.'-]{1,40}?)(?:\s+(?:via|on|ref|UPI|NEFT|IMPS))/i,
  /(?:to|from)\s+VPA\s+([A-Za-z0-9._-]+)(?:@)/i,
  /merchant[:\s]+([A-Za-z][A-Za-z0-9\s&.'-]{1,40})/i,
  /(?:Paid|Sent|Received)\s+(?:Rs\.?|INR|₹)\s*[\d,]+(?:\.\d+)?\s+(?:to|from)\s+([A-Za-z][A-Za-z0-9\s&.'-]{1,40})/i,
];

// ── Reference number patterns ────────────────────────────────
const REFERENCE_PATTERNS = [
  /(?:ref\.?\s*(?:no\.?|number|#)?|txn\.?\s*(?:no\.?|id)?|transaction\s*(?:id|no\.?)?|UPI\s*Ref)[:\s]*([A-Za-z0-9]{6,20})/i,
  /\bRef\s+(\d{6,20})\b/i,
  /\b(\d{12})\b/,
];

function shouldIgnore(text) {
  if (!text || typeof text !== 'string' || text.trim().length < 10) return true;
  return IGNORE_PATTERNS.some(pattern => pattern.test(text));
}

function extractAmount(text) {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      const amount = parseFloat(cleaned);
      if (!isNaN(amount) && amount > 0 && amount < 10000000) return amount;
    }
  }
  return null;
}

function detectTransactionType(text) {
  for (const pattern of CREDIT_KEYWORDS) {
    if (pattern.test(text)) return 'Credit';
  }
  for (const pattern of DEBIT_KEYWORDS) {
    if (pattern.test(text)) return 'Debit';
  }
  return 'Debit';
}

function extractMerchant(text) {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let merchant = match[1].trim().replace(/[.,;:!]+$/, '').trim();
      merchant = merchant
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      if (merchant.length >= 2) return merchant;
    }
  }
  return 'Unknown';
}

function extractReference(text) {
  for (const pattern of REFERENCE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return '';
}

/**
 * Parse a raw SMS/notification message into structured transaction data.
 * @param {string} rawText - The raw SMS or notification text
 * @param {string} source - 'SMS' or 'NOTIFICATION'
 * @returns {object|null} Parsed transaction data or null
 */
export function parseTransaction(rawText, source = 'SMS') {
  if (shouldIgnore(rawText)) return null;

  const amount = extractAmount(rawText);
  if (amount === null) return null;

  return {
    amount,
    merchant: extractMerchant(rawText),
    transactionType: detectTransactionType(rawText),
    reference: extractReference(rawText),
    source: source.toUpperCase() === 'NOTIFICATION' ? 'NOTIFICATION' : 'SMS',
    rawMessage: rawText,
    date: new Date().toISOString(),
  };
}

export default { parseTransaction };
