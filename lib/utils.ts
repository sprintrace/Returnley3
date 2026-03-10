import { FAST_FOOD_KEYWORDS } from './keywords';

export const isFastFoodPurchase = (item: string, category: string): boolean => {
  if (category === 'Fast Food') {
    return true;
  }
  const lowerCaseItem = item.toLowerCase();
  return FAST_FOOD_KEYWORDS.some(keyword => lowerCaseItem.includes(keyword));
};

export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};
