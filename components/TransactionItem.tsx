import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { Transaction, TransactionStatus } from '../types';
import { Ionicons } from '@expo/vector-icons';

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
 * A mapping of transaction statuses to their corresponding React Native styles and icon.
 */
const statusStyles: { [key in TransactionStatus]: { bg: object; text: object; border: object; iconName: string } } = {
  [TransactionStatus.Approved]: {
    bg: { backgroundColor: 'rgba(4, 120, 87, 0.5)' }, // bg-green-900/50
    text: { color: '#6EE7B7' }, // text-green-300
    border: { borderColor: '#047857' }, // border-green-700
    iconName: 'checkmark-circle-outline'
  },
  [TransactionStatus.Flagged]: {
    bg: { backgroundColor: 'rgba(146, 64, 14, 0.5)' }, // bg-yellow-900/50
    text: { color: '#FCD34D' }, // text-yellow-300
    border: { borderColor: '#B45309' }, // border-yellow-700
    iconName: 'flag-outline'
  },
  [TransactionStatus.Returned]: {
    bg: { backgroundColor: 'rgba(29, 78, 216, 0.5)' }, // bg-blue-900/50
    text: { color: '#93C5FD' }, // text-blue-300
    border: { borderColor: '#1D4ED8' }, // border-blue-700
    iconName: 'arrow-undo-outline'
  },
  [TransactionStatus.Pending]: {
    bg: { backgroundColor: 'rgba(55, 65, 81, 0.5)' }, // bg-gray-700/50
    text: { color: '#D1D5DB' }, // text-gray-300
    border: { borderColor: '#4B5563' }, // border-gray-600
    iconName: 'hourglass-outline'
  },
  [TransactionStatus.Kept]: {
    bg: { backgroundColor: 'rgba(185, 28, 28, 0.5)' }, // bg-red-900/50
    text: { color: '#F87171' }, // text-red-300
    border: { borderColor: '#DC2626' }, // border-red-700
    iconName: 'close-circle-outline'
  },
  [TransactionStatus.Urge]: {
    bg: { backgroundColor: 'rgba(79, 70, 229, 0.5)' }, // bg-indigo-900/50
    text: { color: '#A5B4FC' }, // text-indigo-300
    border: { borderColor: '#6366F1' }, // border-indigo-500
    iconName: 'flash-outline'
  },
};

/**
 * A component that displays a single transaction with status-specific styling and actions.
 */
export const TransactionItem: React.FC<TransactionItemProps> = React.memo(({ transaction, onQuickAction, onStatusToggle }) => {
  // Get the appropriate styles based on the transaction's current status.
  const currentStyles = statusStyles[transaction.status];
  
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

  const handleShowError = () => {
    if (transaction.error) {
      Alert.alert('Transaction Error', transaction.error);
    }
  };

  return (
    <View style={[itemStyles.listItem, currentStyles.bg, currentStyles.border]}>
      <View style={itemStyles.contentWrapper}>
        <View style={itemStyles.mainInfo}>
          <View style={itemStyles.iconContainer}>
            {!transaction.isExample && (
              <Ionicons name={currentStyles.iconName} size={24} color={currentStyles.text.color} />
            )}
            </View>
          <View style={itemStyles.textInfo}>
            <Text style={itemStyles.itemText}>
            {transaction.item}
            {transaction.isExample && " (Example)"}
          </Text>
            <View style={itemStyles.categoryDateContainer}>
              <Text style={itemStyles.categoryDateText}>{transaction.category} - {transaction.date}</Text>
              {!transaction.isReturnable && transaction.status !== TransactionStatus.Urge && !transaction.isExample &&(
                <View style={itemStyles.finalSaleBadge}>
                  <Text style={itemStyles.finalSaleBadgeText}>Final Sale</Text>
                </View>
              )}
              {transaction.status === TransactionStatus.Urge && !transaction.isExample &&(
                <View style={itemStyles.cooldownBadge}>
                  <Text style={itemStyles.cooldownBadgeText}>24h Cooldown</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={itemStyles.amountAndActions}>
          <Text style={itemStyles.amountText}>${transaction.amount.toFixed(2)}</Text>
          
          {/* Conditionally render action buttons or status text */}
          {!transaction.isExample && canManuallyAct ? (
            <View style={itemStyles.actionButtonsContainer}>
                {transaction.status === TransactionStatus.Urge ? (
                    <>
                        <TouchableOpacity 
                            onPress={() => onQuickAction && onQuickAction(transaction.id, 'buy')}
                            style={itemStyles.buyButton}
                        >
                            <Text style={itemStyles.buyButtonText}>Bought It</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity 
                            onPress={() => onQuickAction && onQuickAction(transaction.id, 'return')}
                            style={itemStyles.returnButton}
                        >
                            <Text style={itemStyles.returnButtonText}>Return</Text>
                        </TouchableOpacity>
                        {transaction.status === TransactionStatus.Flagged && (
                            <TouchableOpacity 
                                onPress={() => onQuickAction && onQuickAction(transaction.id, 'keep')}
                                style={itemStyles.keepButton}
                            >
                                <Text style={itemStyles.keepButtonText}>Keep</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
          ) : (
            <View style={itemStyles.statusInfoContainer}>
              {/* Visual indicator for items in the nag cycle */}
              {isBeingNagged && !transaction.isExample &&(
                <View style={itemStyles.naggedIndicator} />
              )}
              {/* Error icon with a tooltip for per-transaction errors */}
              {transaction.error && (
                  <TouchableOpacity onPress={handleShowError}>
                      <Ionicons name="alert-circle-outline" size={20} color="#F87171" />
                  </TouchableOpacity>
              )}
              
              {/* Render the toggle switch for Kept/Returned items */}
              {canToggleStatus && !transaction.isExample ? (
                 <View style={itemStyles.statusToggleContainer}>
                    <Text style={[itemStyles.statusToggleText, currentStyles.text]}>{transaction.status}</Text>
                    <Switch
                      onValueChange={() => onStatusToggle && onStatusToggle(transaction.id)}
                      value={transaction.status === TransactionStatus.Returned}
                      trackColor={{ false: '#DC2626', true: '#1D4ED8' }} // red-600 and blue-600
                      thumbColor={transaction.status === TransactionStatus.Returned ? '#93C5FD' : '#F87171'} // blue-300 and red-300
                      style={itemStyles.statusToggleSwitch}
                    />
                  </View>
              ) : (
                <Text style={[itemStyles.statusText, currentStyles.text]}>{transaction.status}</Text>
              )}
            </View>
          )}
        </View>
      </View>
      
      {/* Footer info: Emotion and Hot Take */}
      {(transaction.emotionalContext || transaction.hotTake) && (
        <View style={itemStyles.footerInfoContainer}>
            {transaction.emotionalContext && transaction.emotionalContext !== 'Neutral / Normal' && (
                <View style={itemStyles.emotionalContextContainer}>
                    <Text style={itemStyles.emotionalContextLabel}>Feeling:</Text>
                    <Text style={itemStyles.emotionalContextText}>{transaction.emotionalContext}</Text>
                </View>
            )}
            {transaction.hotTake && (
                <View style={itemStyles.hotTakeContainer}>
                    <Text style={itemStyles.hotTakeText}>"{transaction.hotTake}"</Text>
                </View>
            )}
        </View>
      )}
    </View>
  );
});

const itemStyles = StyleSheet.create({
  listItem: {
    flexDirection: 'column', // flex flex-col
    padding: 12, // p-3
    borderRadius: 8, // rounded-lg
    borderLeftWidth: 4, // border-l-4
    marginBottom: 8, // simulating margin for list items
    transitionDuration: 300, // transition-all duration-300 (not directly translatable)
    // hover:bg-gray-700/50 (handled by TouchableOpacity feedback if item itself was Touchable)
  },
  contentWrapper: {
    flexDirection: 'row', // flex
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    width: '100%', // w-full
  },
  mainInfo: {
    flexDirection: 'row', // flex
    alignItems: 'center', // items-center
    flex: 1, // flex-grow
    minWidth: 0, // min-w-0
  },
  iconContainer: {
    marginRight: 16, // mr-4
    width: 24, // Assuming icon takes up 24px space
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInfo: {
    flex: 1, // min-w-0
  },
  itemText: {
    fontWeight: 'bold', // font-semibold
    color: 'white', // text-white
    flexShrink: 1,
  },
  categoryDateContainer: {
    flexDirection: 'row', // flex
    flexWrap: 'wrap', // flex-wrap
    alignItems: 'center', // items-center
    // gap-x-2 (marginRight on items)
    fontSize: 14, // text-sm
    color: '#9CA3AF', // text-gray-400
  },
  categoryDateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginRight: 8, // gap-x-2
  },
  finalSaleBadge: {
    paddingHorizontal: 8, // px-2
    paddingVertical: 2, // py-0.5
    backgroundColor: '#4B5563', // bg-gray-600
    borderRadius: 9999, // rounded-full
    marginRight: 8,
    marginTop: 4,
  },
  finalSaleBadgeText: {
    color: '#E5E7EB', // text-gray-200
    fontSize: 10, // text-xs
    fontWeight: 'bold', // font-semibold
  },
  cooldownBadge: {
    paddingHorizontal: 8, // px-2
    paddingVertical: 2, // py-0.5
    backgroundColor: '#4F46E5', // bg-indigo-600
    borderRadius: 9999, // rounded-full
    // animate-pulse (will need Animated API if desired)
    marginRight: 8,
    marginTop: 4,
  },
  cooldownBadgeText: {
    color: 'white', // text-white
    fontSize: 10, // text-xs
    fontWeight: 'bold', // font-semibold
  },
  amountAndActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginLeft: 16, // ml-4
    flexShrink: 0, // flex-shrink-0
  },
  amountText: {
    fontWeight: 'bold', // font-bold
    fontSize: 18, // text-lg
    color: 'white', // text-white
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // justify-end
    // space-x-2
    marginTop: 4, // mt-1
  },
  buyButton: {
    paddingHorizontal: 12, // px-3
    paddingVertical: 4, // py-1
    fontSize: 12, // text-xs
    fontWeight: 'bold', // font-bold
    backgroundColor: '#4F46E5', // bg-indigo-600
    borderRadius: 6, // rounded-md
    shadowColor: '#000', // shadow-sm
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    marginLeft: 8, // space-x-2
  },
  buyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  returnButton: {
    paddingHorizontal: 8, // px-2
    paddingVertical: 4, // py-1
    backgroundColor: 'rgba(29, 78, 216, 0.5)', // bg-blue-600/50
    borderRadius: 6, // rounded-md
    // hover:bg-blue-600/80
  },
  returnButtonText: {
    fontSize: 12, // text-xs
    fontWeight: '600', // font-semibold
    color: '#DBEAFE', // text-blue-200
  },
  keepButton: {
    paddingHorizontal: 8, // px-2
    paddingVertical: 4, // py-1
    backgroundColor: 'rgba(185, 28, 28, 0.5)', // bg-red-600/50
    borderRadius: 6, // rounded-md
    // hover:bg-red-600/80
    marginLeft: 8, // space-x-2
  },
  keepButtonText: {
    fontSize: 12, // text-xs
    fontWeight: '600', // font-semibold
    color: '#FECACA', // text-red-200
  },
  statusInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // justify-end
    // space-x-2
  },
  naggedIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#EF4444', // bg-red-500
    borderRadius: 4, // rounded-full
    // animate-pulse (will need Animated API)
    marginRight: 8, // space-x-2
  },
  statusToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4, // mt-1
  },
  statusToggleText: {
    fontSize: 12, // text-xs
    fontWeight: '500', // font-medium
    marginRight: 8, // space-x-2
  },
  statusToggleSwitch: {
    // Styling handled by Switch props directly
  },
  statusText: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
  },
  footerInfoContainer: {
    marginTop: 8, // mt-2
    paddingTop: 8, // pt-2
    borderTopWidth: 1, // border-t
    borderColor: 'rgba(55, 65, 81, 0.5)', // border-gray-700/50
    width: '100%', // w-full
  },
  emotionalContextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // space-x-2
    color: '#9CA3AF', // text-gray-400
    marginBottom: 4, // mb-1
  },
  emotionalContextLabel: {
    fontSize: 10, // text-xs
    textTransform: 'uppercase', // uppercase
    fontWeight: 'bold', // font-bold
    letterSpacing: 0.5, // tracking-wider
    color: '#9CA3AF',
    marginRight: 8,
  },
  emotionalContextText: {
    color: '#D8B4FE', // text-purple-300
  },
  hotTakeContainer: {
    backgroundColor: 'rgba(79, 70, 229, 0.3)', // bg-indigo-900/30
    padding: 8, // p-2
    borderRadius: 4, // rounded
    fontStyle: 'italic', // italic
    borderLeftWidth: 2, // border-l-2
    borderColor: '#6366F1', // border-indigo-500
  },
  hotTakeText: {
    color: '#BFDBFE', // text-indigo-200
  },
});
