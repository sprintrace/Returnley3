import { FAST_FOOD_KEYWORDS } from './keywords';

export const isConsumablePurchase = (item: string, category: string): boolean => {
  const consumableCategories = ['Fast Food', 'Dining & Entertainment', 'Groceries'];
  if (consumableCategories.includes(category)) {
    return true;
  }
  const lowerCaseItem = item.toLowerCase();
  return FAST_FOOD_KEYWORDS.some(keyword => lowerCaseItem.includes(keyword));
};

export const isShamefulConsumable = (item: string, category: string): boolean => {
  if (category === 'Fast Food') return true;
  if (category === 'Groceries') return false; // Groceries are not inherently shameful
  const lowerCaseItem = item.toLowerCase();
  return FAST_FOOD_KEYWORDS.some(keyword => lowerCaseItem.includes(keyword));
};

export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};
