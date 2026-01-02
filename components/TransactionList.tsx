
import React from 'react';
import { Transaction, TransactionStatus } from '../types';
import { TransactionItem } from './TransactionItem';

/**
 * Props for the TransactionList component.
 */
interface TransactionListProps {
  /** The array of transactions to display. */
  transactions: Transaction[];
  /** The title to be displayed above the list. */
  title: string;
  /** Optional callback for handling quick actions. */
  onQuickAction?: (transactionId: string, decision: 'return' | 'keep' | 'buy') => void;
  /** Optional callback for handling the status toggle between "Kept" and "Returned". */
  onStatusToggle?: (transactionId:string) => void;
}

/**
 * A component that renders a list of TransactionItem components.
 * It's memoized to avoid re-rendering if the props haven't changed.
 */
export const TransactionList: React.FC<TransactionListProps> = React.memo(({ transactions, title, onQuickAction, onStatusToggle }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg shadow-xl p-4 md:p-6">
      <h2 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">{title}</h2>
      {transactions.length === 0 ? (
        <p className="text-gray-400">No transactions in this category.</p>
      ) : (
        <ul className="space-y-3">
          {/* Map through the transactions and render a TransactionItem for each one */}
          {transactions.map(transaction => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction}
              onQuickAction={onQuickAction}
              onStatusToggle={onStatusToggle}
            />
          ))}
        </ul>
      )}
    </div>
  );
});
