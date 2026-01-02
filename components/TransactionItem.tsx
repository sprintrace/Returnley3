
import React from 'react';
import { Transaction, TransactionStatus } from '../types';

/**
 * Props for the TransactionItem component.
 */
interface TransactionItemProps {
  /** The transaction object to display. */
  transaction: Transaction;
  /** Optional callback for handling quick actions like "Return", "Keep", or "Buy" (for urges). */
  onQuickAction?: (transactionId: string, decision: 'return' | 'keep' | 'buy') => void;
  /** Optional callback for toggling status between Kept and Returned. */
  onStatusToggle?: (transactionId: string) => void;
}

/**
 * A mapping of transaction statuses to their corresponding Tailwind CSS classes and icon.
 */
const statusStyles: { [key in TransactionStatus]: { bg: string; text: string; border: string; icon: string } } = {
  [TransactionStatus.Approved]: { bg: 'bg-green-900/50', text: 'text-green-300', border: 'border-green-700', icon: '✓' },
  [TransactionStatus.Flagged]: { bg: 'bg-yellow-900/50', text: 'text-yellow-300', border: 'border-yellow-700', icon: '!' },
  [TransactionStatus.Returned]: { bg: 'bg-blue-900/50', text: 'text-blue-300', border: 'border-blue-700', icon: '⮌' },
  [TransactionStatus.Pending]: { bg: 'bg-gray-700/50', text: 'text-gray-300', border: 'border-gray-600', icon: '…' },
  [TransactionStatus.Kept]: { bg: 'bg-red-900/50', text: 'text-red-300', border: 'border-red-700', icon: '✕' },
  [TransactionStatus.Urge]: { bg: 'bg-indigo-900/50', text: 'text-indigo-300', border: 'border-indigo-500', icon: '⚡' },
};

/**
 * A component that displays a single transaction with status-specific styling and actions.
 */
export const TransactionItem: React.FC<TransactionItemProps> = React.memo(({ transaction, onQuickAction, onStatusToggle }) => {
  // Get the appropriate styles based on the transaction's current status.
  const styles = statusStyles[transaction.status];
  
  // A boolean to determine if the item is currently in the "nag cycle".
  const isBeingNagged = transaction.nagCount > 0 && transaction.status === TransactionStatus.Flagged;
  
  // Determines if the quick action buttons should be shown.
  // We now include 'Urge' so users can resolve the urge.
  const canManuallyAct = onQuickAction && (
      transaction.status === TransactionStatus.Flagged || 
      transaction.status === TransactionStatus.Approved ||
      transaction.status === TransactionStatus.Urge
  );
  
  // Determines if the status toggle switch should be shown (for "Kept" or "Returned" items).
  const canToggleStatus = onStatusToggle && (transaction.status === TransactionStatus.Kept || transaction.status === TransactionStatus.Returned);

  return (
    <li className={`relative flex flex-col p-3 rounded-lg border-l-4 ${styles.bg} ${styles.border} transition-all duration-300 hover:bg-gray-700/50`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center flex-grow min-w-0">
          <div className={`mr-4 text-xl font-bold ${styles.text}`}>{styles.icon}</div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{transaction.item}</p>
            <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-400">
              <span>{transaction.category} - {transaction.date}</span>
              {!transaction.isReturnable && transaction.status !== TransactionStatus.Urge && (
                <span className="px-2 py-0.5 bg-gray-600 text-gray-200 text-xs font-semibold rounded-full">
                  Final Sale
                </span>
              )}
              {transaction.status === TransactionStatus.Urge && (
                <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-semibold rounded-full animate-pulse">
                  24h Cooldown
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center ml-4 flex-shrink-0">
          <div className="text-right">
             <p className="font-bold text-lg text-white">${transaction.amount.toFixed(2)}</p>
             
             {/* Conditionally render action buttons or status text */}
             {canManuallyAct ? (
                <div className="flex items-center justify-end space-x-2 mt-1">
                   {/* Specific Buttons for Urges */}
                   {transaction.status === TransactionStatus.Urge ? (
                        <>
                             <button 
                                onClick={() => onQuickAction(transaction.id, 'buy')}
                                className="px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
                                title="I succumbed to the urge and bought it"
                            >Bought It</button>
                        </>
                   ) : (
                        /* Standard Buttons for Flagged/Approved */
                       <>
                        <button 
                            onClick={() => onQuickAction(transaction.id, 'return')}
                            className="px-2 py-1 text-xs font-semibold text-blue-200 bg-blue-600/50 hover:bg-blue-600/80 rounded-md"
                        >Return</button>
                        {transaction.status === TransactionStatus.Flagged && (
                            <button 
                            onClick={() => onQuickAction(transaction.id, 'keep')}
                            className="px-2 py-1 text-xs font-semibold text-red-200 bg-red-600/50 hover:bg-red-600/80 rounded-md"
                            >Keep</button>
                        )}
                       </>
                   )}
                </div>
              ) : (
                <div className="flex items-center justify-end space-x-2">
                  {/* Visual indicator for items in the nag cycle */}
                  {isBeingNagged && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="This item is under review"></div>
                  )}
                  {/* Error icon with a tooltip for per-transaction errors */}
                  {transaction.error && (
                      <div className="relative group">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              {transaction.error}
                          </div>
                      </div>
                  )}
                  
                  {/* Render the toggle switch for Kept/Returned items */}
                  {canToggleStatus ? (
                     <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs font-medium ${styles.text}`}>{transaction.status}</span>
                        <button
                          onClick={() => onStatusToggle(transaction.id)}
                          className={`relative inline-flex flex-shrink-0 h-5 w-9 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                              transaction.status === TransactionStatus.Returned 
                                  ? 'bg-blue-600 focus:ring-blue-500' 
                                  : 'bg-red-600 focus:ring-red-500'
                          }`}
                        >
                          <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                              transaction.status === TransactionStatus.Returned ? 'translate-x-4' : 'translate-x-0'
                          }`}/>
                        </button>
                      </div>
                  ) : (
                    <p className={`text-sm font-medium ${styles.text}`}>{transaction.status}</p>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
      
      {/* Footer info: Emotion and Hot Take */}
      {(transaction.emotionalContext || transaction.hotTake) && (
        <div className="mt-2 pt-2 border-t border-gray-700/50 w-full text-sm">
            {transaction.emotionalContext && transaction.emotionalContext !== 'Neutral / Normal' && (
                <div className="flex items-center space-x-2 text-gray-400 mb-1">
                    <span className="text-xs uppercase font-bold tracking-wider">Feeling:</span>
                    <span className="text-purple-300">{transaction.emotionalContext}</span>
                </div>
            )}
            {transaction.hotTake && (
                <div className="bg-indigo-900/30 p-2 rounded text-indigo-200 italic border-l-2 border-indigo-500">
                    "{transaction.hotTake}"
                </div>
            )}
        </div>
      )}
    </li>
  );
});
