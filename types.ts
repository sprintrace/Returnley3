
/**
 * Defines the possible states a transaction can be in.
 */
export enum TransactionStatus {
  /** The purchase was reviewed by the AI and deemed necessary. */
  Approved = 'Approved',
  /** The purchase was flagged as unnecessary but the user decided to keep it (may be subject to nagging). */
  Flagged = 'Flagged',
  /** The user has committed to returning the item. */
  Returned = 'Returned',
  /** The purchase is flagged as unnecessary and is awaiting the user's decision from the incoming call. */
  Pending = 'Pending Review',
  /** The user kept the item after all nagging attempts were exhausted. */
  Kept = 'Kept',
  /** The user wants to buy this item but is waiting (24-hour rule). */
  Urge = 'Urge',
}

/**
 * Represents a single user purchase record.
 */
export interface Transaction {
  /** Indicates if this transaction is a sample/example entry and should be excluded from statistics. */
  isExample?: boolean;
  /** A unique identifier for the transaction. */
  id: string;
  /** A description of the item purchased. */
  item: string;
  /** The monetary value of the purchase. */
  amount: number;
  /** The spending category for the purchase. */
  category: string;
  /** The current status of the transaction. */
  status: TransactionStatus;
  /** The date of the purchase in 'YYYY-MM-DD' format. */
  date: string;
  /** A boolean indicating if the item is eligible for return. */
  isReturnable: boolean;
  /** An optional return-by date in 'YYYY-MM-DD' format. */
  returnBy?: string;
  /** A counter for how many times the user has been "nagged" about this item. */
  nagCount: number;
  /** A field to store any per-transaction errors, e.g., from a failed API call. */
  error?: string;
  /** A timestamp indicating when the next nag call should be triggered for this item. */
  nextNagTimestamp?: number;
  /** An optional justification provided by the user if they marked the item as an investment. */
  justification?: string;
  /** The emotional state of the user when they logged the transaction. */
  emotionalContext?: string;
  /** A short AI reaction for 'Urge' items. */
  hotTake?: string;
}

/**
 * Represents the structured analysis of a purchase returned by the Gemini API.
 */
export interface PurchaseAnalysis {
  /** The AI's decision on whether the purchase was necessary. */
  isNecessary: boolean;
  /** A brief text explanation for the AI's decision. */
  reasoning: string;
  /** The script for the AI to read during the simulated call if the purchase is unnecessary. */
  callScript: string;
  /** An estimated return-by date calculated by the AI if one wasn't provided. */
  estimatedReturnBy?: string;
  /** A short, punchy reaction if this is an urge analysis. */
  hotTake?: string;
}

/**
 * User profile information for context-aware AI analysis.
 */
export interface UserProfile {
  monthlyIncome: number;
  financialWeakness: string;
  savingsGoal: string;
}
