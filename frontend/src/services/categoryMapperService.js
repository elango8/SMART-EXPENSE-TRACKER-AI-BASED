/**
 * Category Mapper Service (Client-Side)
 * 
 * Mirrors the backend category mapper for instant UI feedback.
 * Provides category suggestion without a network call.
 */

// ── Merchant → Category mapping ──────────────────────────────
const MERCHANT_CATEGORY_MAP = {
  // Shopping & Retail
  'amazon': { category: 'Shopping & Retail', confidence: 95 },
  'flipkart': { category: 'Shopping & Retail', confidence: 95 },
  'myntra': { category: 'Shopping & Retail', confidence: 95 },
  'ajio': { category: 'Shopping & Retail', confidence: 95 },
  'meesho': { category: 'Shopping & Retail', confidence: 90 },
  'snapdeal': { category: 'Shopping & Retail', confidence: 90 },
  'nykaa': { category: 'Shopping & Retail', confidence: 90 },
  'tata cliq': { category: 'Shopping & Retail', confidence: 90 },
  'shoppers stop': { category: 'Shopping & Retail', confidence: 90 },
  'reliance': { category: 'Shopping & Retail', confidence: 80 },
  'dmart': { category: 'Shopping & Retail', confidence: 85 },
  'big bazaar': { category: 'Shopping & Retail', confidence: 85 },
  'croma': { category: 'Shopping & Retail', confidence: 85 },
  'vijay sales': { category: 'Shopping & Retail', confidence: 85 },

  // Food & Dining
  'swiggy': { category: 'Food & Dining', confidence: 95 },
  'zomato': { category: 'Food & Dining', confidence: 95 },
  'dominos': { category: 'Food & Dining', confidence: 95 },
  'pizza hut': { category: 'Food & Dining', confidence: 95 },
  'mcdonald': { category: 'Food & Dining', confidence: 95 },
  'kfc': { category: 'Food & Dining', confidence: 95 },
  'burger king': { category: 'Food & Dining', confidence: 95 },
  'starbucks': { category: 'Food & Dining', confidence: 90 },
  'cafe coffee day': { category: 'Food & Dining', confidence: 90 },
  'subway': { category: 'Food & Dining', confidence: 95 },
  'blue bottle coffee': { category: 'Food & Dining', confidence: 90 },

  // Transport
  'uber': { category: 'Transport', confidence: 95 },
  'ola': { category: 'Transport', confidence: 95 },
  'rapido': { category: 'Transport', confidence: 95 },
  'irctc': { category: 'Transport', confidence: 90 },
  'makemytrip': { category: 'Transport', confidence: 85 },
  'redbus': { category: 'Transport', confidence: 90 },

  // Entertainment
  'netflix': { category: 'Entertainment', confidence: 95 },
  'hotstar': { category: 'Entertainment', confidence: 95 },
  'spotify': { category: 'Entertainment', confidence: 95 },
  'youtube': { category: 'Entertainment', confidence: 85 },
  'bookmyshow': { category: 'Entertainment', confidence: 90 },
  'pvr': { category: 'Entertainment', confidence: 90 },

  // Bills
  'electricity': { category: 'Bills', confidence: 90 },
  'jio': { category: 'Bills', confidence: 80 },
  'airtel': { category: 'Bills', confidence: 80 },
  'vodafone': { category: 'Bills', confidence: 80 },
  'bsnl': { category: 'Bills', confidence: 80 },
  'consolidated edison': { category: 'Bills', confidence: 95 },
  'tata power': { category: 'Bills', confidence: 90 },
};

// ── Keyword-based fallback ───────────────────────────────────
const KEYWORD_CATEGORY_MAP = [
  { keywords: ['grocery', 'supermarket', 'mart', 'store', 'shop'], category: 'Shopping & Retail', confidence: 70 },
  { keywords: ['restaurant', 'food', 'cafe', 'coffee', 'pizza', 'burger'], category: 'Food & Dining', confidence: 70 },
  { keywords: ['cab', 'taxi', 'ride', 'flight', 'train', 'bus', 'travel'], category: 'Transport', confidence: 70 },
  { keywords: ['movie', 'game', 'music', 'streaming'], category: 'Entertainment', confidence: 65 },
  { keywords: ['bill', 'recharge', 'emi', 'loan', 'rent'], category: 'Bills', confidence: 65 },
];

/**
 * Map a merchant name to a category with confidence score.
 * @param {string} merchantName - The merchant name
 * @returns {{ category: string, confidence: number }}
 */
export function mapCategory(merchantName) {
  if (!merchantName || typeof merchantName !== 'string') {
    return { category: 'Other', confidence: 50 };
  }

  const lower = merchantName.toLowerCase().trim();

  // Exact match
  if (MERCHANT_CATEGORY_MAP[lower]) {
    return MERCHANT_CATEGORY_MAP[lower];
  }

  // Partial match
  for (const [key, value] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return { category: value.category, confidence: Math.max(value.confidence - 10, 50) };
    }
  }

  // Keyword fallback
  for (const entry of KEYWORD_CATEGORY_MAP) {
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) {
        return { category: entry.category, confidence: entry.confidence };
      }
    }
  }

  return { category: 'Other', confidence: 50 };
}

export default { mapCategory };
