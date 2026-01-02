/**
 * A list of keywords used to automatically identify fast food purchases.
 * These are checked against the item description in a case-insensitive manner.
 * If a match is found, the purchase is automatically marked as a "shameful purchase"
 * and bypasses the AI call analysis.
 */
export const FAST_FOOD_KEYWORDS: string[] = [
  'burger',
  'pizza',
  'fries',
  'taco',
  'hot dog',
  'nuggets',
  'soda',
  'milkshake',
  'burrito',
  'kebab',
  'donut',
  'takeout',
  'takeaway',
  'drive-thru',
  'fast food',
  'chicken wings',
  'onion rings',
];
