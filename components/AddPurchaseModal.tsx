
import React, { useState, useEffect, useMemo } from 'react';
import { CATEGORIES } from '../lib/categories';
import { Transaction } from '../types';
import { FAST_FOOD_KEYWORDS } from '../lib/keywords';
import { EMOTIONS } from '../lib/emotions';

/**
 * Props for the AddPurchaseModal component.
 */
interface AddPurchaseModalProps {
  /** Function to call when the modal should be closed. */
  onClose: () => void;
  /** Function to call when the form is submitted with valid data. */
  onSubmit: (item: string, amount: number, category: string, isReturnable: boolean, returnBy?: string, justification?: string, emotionalContext?: string, isUrge?: boolean) => void;
  /** Optional initial data to pre-fill the form fields (e.g., from a receipt scan). */
  initialData?: Partial<Transaction> | null;
}

const defaultCategory = CATEGORIES['Discretionary Spending'][2]; // 'Shopping'

/**
 * A modal form for adding a new purchase manually.
 * It can also be pre-filled with data from a receipt scan.
 */
export const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({ onClose, onSubmit, initialData }) => {
  // Mode Selection: Purchase (Default) vs Urge (24h rule)
  const [isUrgeMode, setIsUrgeMode] = useState(false);

  // State for each form field
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [isFinalSale, setIsFinalSale] = useState(false);
  const [returnBy, setReturnBy] = useState('');
  const [isInvestment, setIsInvestment] = useState(false);
  const [justification, setJustification] = useState('');
  const [emotionalContext, setEmotionalContext] = useState(EMOTIONS[0]);
  const [error, setError] = useState('');

  // Automatically detect if the item is potentially fast food based on category or keywords.
  const isFastFood = useMemo(() => {
    if (category === 'Fast Food') {
      return true;
    }
    const lowerCaseItem = item.toLowerCase();
    // Check if the item name contains any of the defined fast food keywords.
    return FAST_FOOD_KEYWORDS.some(keyword => lowerCaseItem.includes(keyword));
  }, [item, category]);


  /**
   * Effect to populate the form fields when `initialData` is provided.
   * This runs whenever the `initialData` prop changes.
   */
  useEffect(() => {
    if (initialData) {
      setItem(initialData.item || '');
      setAmount(initialData.amount?.toString() || '');
      // Ensure the pre-filled category is a valid one from our list; otherwise, use the default.
      const allCategories = Object.values(CATEGORIES).flat();
      setCategory(initialData.category && allCategories.includes(initialData.category) ? initialData.category : defaultCategory);
    }
  }, [initialData]);

  /**
   * Effect to enforce non-returnable status for the 'Fast Food' category.
   */
  useEffect(() => {
    // Only force the checkbox to be checked if the category is explicitly 'Fast Food'.
    if (category === 'Fast Food') {
      setIsFinalSale(true);
    }
  }, [category]);

  /**
   * Handles the form submission event.
   * Performs validation and calls the `onSubmit` prop with the form data.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!item || !amount || !category) {
      setError('All fields are required.');
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid, positive amount.');
      return;
    }
    // Call the parent component's submit handler
    onSubmit(
        item, 
        numericAmount, 
        category, 
        isUrgeMode ? true : !isFinalSale, // Urges are theoretically returnable since they aren't bought yet
        (isFinalSale && !isUrgeMode) ? undefined : returnBy, 
        isInvestment ? justification : undefined,
        emotionalContext,
        isUrgeMode
    );
  };

  return (
    // Modal backdrop
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40" onClick={onClose}>
      {/* Modal content container */}
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4 border border-gray-700" onClick={e => e.stopPropagation()}>
        
        {/* Toggle between Purchase and Urge */}
        <div className="flex bg-gray-700 rounded-lg p-1 mb-6">
            <button
                type="button"
                onClick={() => setIsUrgeMode(false)}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${!isUrgeMode ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                I Bought This
            </button>
            <button
                type="button"
                onClick={() => setIsUrgeMode(true)}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${isUrgeMode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                I Want This (Urge)
            </button>
        </div>

        <h2 className="text-2xl font-bold mb-4">{isUrgeMode ? 'Log a Purchase Urge' : (initialData ? 'Confirm Your Purchase' : 'Log a New Purchase')}</h2>
        
        {isUrgeMode && (
            <p className="text-sm text-indigo-300 mb-4 bg-indigo-900/40 p-2 rounded">
                The 24-hour rule: Log it now, wait a day. Returnley will analyze if it's worth it.
            </p>
        )}

        {error && <p className="text-red-400 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Informational message for fast food items */}
          {isFastFood && !isUrgeMode && (
            <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm px-3 py-2 rounded-md">
              <p><span className="font-bold">Note:</span> Fast food items are often non-refundable.</p>
            </div>
          )}
          
          <div>
            <label htmlFor="item" className="block text-sm font-medium text-gray-300">Item Name</label>
            <input
              type="text"
              id="item"
              value={item}
              onChange={e => setItem(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder={isUrgeMode ? "e.g., That cool jacket I saw" : "e.g., New Gaming Laptop"}
              required
            />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Amount ($)</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., 1599.99"
              step="0.01"
              min="0.01"
              required
            />
          </div>
          
          {/* Emotional Context - Priority 1 Feature */}
          <div>
            <label htmlFor="emotion" className="block text-sm font-medium text-gray-300">How are you feeling?</label>
            <select
                id="emotion"
                value={emotionalContext}
                onChange={e => setEmotionalContext(e.target.value)}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
                {EMOTIONS.map(e => (
                    <option key={e} value={e}>{e}</option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Being honest helps the AI understand your triggers.</p>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300">Category</label>
            <select
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              required
            >
              <option value="" disabled>Select a category</option>
              {Object.entries(CATEGORIES).map(([group, options]) => (
                <optgroup key={group} label={group}>
                  {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Hide Final Sale toggle in Urge Mode (assumed returnable/not bought) */}
          {!isUrgeMode && (
              <div className="flex items-center">
               <input
                id="final-sale"
                name="final-sale"
                type="checkbox"
                checked={isFinalSale}
                onChange={e => setIsFinalSale(e.target.checked)}
                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                disabled={category === 'Fast Food'}
              />
              <label htmlFor="final-sale" className={`ml-2 block text-sm ${category === 'Fast Food' ? 'text-gray-500' : 'text-gray-300'}`}>
                This is a final sale item (cannot be returned)
              </label>
            </div>
          )}

             <div className="flex items-center">
               <input
                id="is-investment"
                name="is-investment"
                type="checkbox"
                checked={isInvestment}
                onChange={e => setIsInvestment(e.target.checked)}
                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="is-investment" className="ml-2 block text-sm text-gray-300">
                Justify as an investment (education/monetization)
              </label>
            </div>

           {isInvestment && (
              <div>
                <label htmlFor="justification" className="block text-sm font-medium text-gray-300">Justification</label>
                <textarea
                  id="justification"
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., This camera will help my YouTube channel."
                  rows={2}
                  required
                />
              </div>
           )}

          {!isUrgeMode && (
              <div>
                <label htmlFor="return-by" className={`block text-sm font-medium ${isFinalSale ? 'text-gray-500' : 'text-gray-300'}`}>Return By Date (Optional)</label>
                <input
                  type="date"
                  id="return-by"
                  value={returnBy}
                  onChange={e => setReturnBy(e.target.value)}
                  className={`mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${isFinalSale ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isFinalSale}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`py-2 px-4 text-white font-semibold rounded-lg shadow-md ${isUrgeMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {isUrgeMode ? 'Log Urge' : 'Submit Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
