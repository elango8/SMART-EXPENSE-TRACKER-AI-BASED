/**
 * Category Mapper Service
 * 
 * Rule-based merchant-to-category prediction engine.
 * Uses case-insensitive partial matching for merchant names.
 * Returns category with confidence score.
 */

// ── Merchant → Category mapping (case-insensitive) ──────────
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
  'ccd': { category: 'Food & Dining', confidence: 85 },
  'dunkin': { category: 'Food & Dining', confidence: 90 },
  'subway': { category: 'Food & Dining', confidence: 95 },
  'barbeque nation': { category: 'Food & Dining', confidence: 90 },
  'haldiram': { category: 'Food & Dining', confidence: 85 },
  'blue bottle coffee': { category: 'Food & Dining', confidence: 90 },

  // Transport
  'uber': { category: 'Transport', confidence: 95 },
  'ola': { category: 'Transport', confidence: 95 },
  'rapido': { category: 'Transport', confidence: 95 },
  'irctc': { category: 'Transport', confidence: 90 },
  'makemytrip': { category: 'Transport', confidence: 85 },
  'goibibo': { category: 'Transport', confidence: 85 },
  'redbus': { category: 'Transport', confidence: 90 },
  'cleartrip': { category: 'Transport', confidence: 85 },
  'indigo': { category: 'Transport', confidence: 85 },
  'air india': { category: 'Transport', confidence: 85 },
  'petrol': { category: 'Transport', confidence: 80 },
  'fuel': { category: 'Transport', confidence: 80 },
  'hp pump': { category: 'Transport', confidence: 80 },
  'iocl': { category: 'Transport', confidence: 80 },
  'bpcl': { category: 'Transport', confidence: 80 },

  // Entertainment
  'netflix': { category: 'Entertainment', confidence: 95 },
  'hotstar': { category: 'Entertainment', confidence: 95 },
  'disney': { category: 'Entertainment', confidence: 90 },
  'prime video': { category: 'Entertainment', confidence: 90 },
  'spotify': { category: 'Entertainment', confidence: 95 },
  'youtube': { category: 'Entertainment', confidence: 85 },
  'jiocinema': { category: 'Entertainment', confidence: 90 },
  'zee5': { category: 'Entertainment', confidence: 90 },
  'sonyliv': { category: 'Entertainment', confidence: 90 },
  'bookmyshow': { category: 'Entertainment', confidence: 90 },
  'pvr': { category: 'Entertainment', confidence: 90 },
  'inox': { category: 'Entertainment', confidence: 90 },
  'cinepolis': { category: 'Entertainment', confidence: 90 },
  'steam': { category: 'Entertainment', confidence: 85 },
  'playstation': { category: 'Entertainment', confidence: 85 },

  // Bills & Utilities
  'electricity': { category: 'Bills', confidence: 90 },
  'water bill': { category: 'Bills', confidence: 90 },
  'gas bill': { category: 'Bills', confidence: 90 },
  'broadband': { category: 'Bills', confidence: 85 },
  'jio': { category: 'Bills', confidence: 80 },
  'airtel': { category: 'Bills', confidence: 80 },
  'vodafone': { category: 'Bills', confidence: 80 },
  'vi ': { category: 'Bills', confidence: 75 },
  'bsnl': { category: 'Bills', confidence: 80 },
  'consolidated edison': { category: 'Bills', confidence: 95 },
  'tata power': { category: 'Bills', confidence: 90 },
  'insurance': { category: 'Bills', confidence: 85 },
  'lic': { category: 'Bills', confidence: 85 },
};

// ── Keyword-based fallback mapping ───────────────────────────
const KEYWORD_CATEGORY_MAP = [
  { keywords: ['grocery', 'groceries', 'supermarket', 'mart', 'store', 'shop'], category: 'Shopping & Retail', confidence: 70 },
  { keywords: ['restaurant', 'food', 'eat', 'dining', 'cafe', 'coffee', 'tea', 'bakery', 'biryani', 'pizza', 'burger'], category: 'Food & Dining', confidence: 70 },
  { keywords: ['cab', 'taxi', 'ride', 'auto', 'flight', 'train', 'bus', 'metro', 'travel', 'parking', 'toll'], category: 'Transport', confidence: 70 },
  { keywords: ['movie', 'game', 'music', 'concert', 'show', 'theater', 'theatre', 'streaming'], category: 'Entertainment', confidence: 65 },
  { keywords: ['bill', 'recharge', 'emi', 'loan', 'premium', 'utility', 'rent', 'maintenance'], category: 'Bills', confidence: 65 },
  { keywords: ['hospital', 'medical', 'medicine', 'pharmacy', 'doctor', 'clinic', 'health', 'apollo', 'medplus'], category: 'Bills', confidence: 65 },
  { keywords: ['school', 'college', 'tuition', 'course', 'udemy', 'coursera', 'education'], category: 'Bills', confidence: 60 },
];

/**
 * Map a merchant name to a category with confidence score.
 * 
 * @param {string} merchantName - The merchant name to categorize
 * @returns {{ category: string, confidence: number }} Category and confidence score
 * 
 * @example
 * mapCategory("Amazon")
 * // Returns: { category: "Shopping & Retail", confidence: 95 }
 * 
 * mapCategory("Unknown Store XYZ")
 * // Returns: { category: "Other", confidence: 50 }
 */
function mapCategory(merchantName) {
  if (!merchantName || typeof merchantName !== 'string') {
    return { category: 'Other', confidence: 50 };
  }

  const lowerMerchant = merchantName.toLowerCase().trim();

  // Step 1: Exact match in merchant map
  if (MERCHANT_CATEGORY_MAP[lowerMerchant]) {
    return MERCHANT_CATEGORY_MAP[lowerMerchant];
  }

  // Step 2: Partial match — check if merchant name contains a known merchant
  for (const [key, value] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (lowerMerchant.includes(key) || key.includes(lowerMerchant)) {
      return {
        category: value.category,
        confidence: Math.max(value.confidence - 10, 50), // Slightly lower confidence for partial match
      };
    }
  }

  // Step 3: Keyword-based fallback
  for (const entry of KEYWORD_CATEGORY_MAP) {
    for (const keyword of entry.keywords) {
      if (lowerMerchant.includes(keyword)) {
        return {
          category: entry.category,
          confidence: entry.confidence,
        };
      }
    }
  }

  // Step 4: Default to "Other"
  return { category: 'Other', confidence: 50 };
}

/**
 * Get all available categories
 * @returns {string[]} List of category names
 */
function getAvailableCategories() {
  const categories = new Set();
  Object.values(MERCHANT_CATEGORY_MAP).forEach(v => categories.add(v.category));
  categories.add('Other');
  return Array.from(categories);
}

module.exports = {
  mapCategory,
  getAvailableCategories,
  MERCHANT_CATEGORY_MAP,
};
