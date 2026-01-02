import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  /** Optional callback for handling quick actions like "Return", "Keep", or "Buy" (for urges). */
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
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {transactions.length === 0 ? (
        <Text style={styles.noTransactionsText}>No transactions in this category.</Text>
      ) : (
        <View style={styles.list}>
          {/* Map through the transactions and render a TransactionItem for each one */}
          {transactions.map(transaction => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction}
              onQuickAction={onQuickAction}
              onStatusToggle={onStatusToggle}
            />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)', // bg-gray-800/50
    borderRadius: 8, // rounded-lg
    shadowColor: '#000', // shadow-xl
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    padding: 16, // p-4 md:p-6 (using p-4 for simplicity, responsive logic for md:p-6 would be more complex)
    marginBottom: 16, // to simulate vertical spacing between sections if multiple lists
  },
  title: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    marginBottom: 16, // mb-4
    borderBottomWidth: 1, // border-b
    borderColor: '#374151', // border-gray-700
    paddingBottom: 8, // pb-2
    color: 'white', // Assuming default text color
  },
  noTransactionsText: {
    color: '#9CA3AF', // text-gray-400
  },
  list: {
    // space-y-3 handled by margin on TransactionItem
  },
});
