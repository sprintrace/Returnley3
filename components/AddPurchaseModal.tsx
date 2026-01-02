import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
  const handleSubmit = () => {
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
    <Modal
      animationType="slide"
      transparent={true}
      visible={true} // Modal is always visible when rendered
      onRequestClose={onClose} // For Android back button
    >
      <TouchableOpacity 
        style={styles.modalBackdrop} 
        activeOpacity={1} 
        onPressOut={onClose} // Close when tapping outside
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}> {/* Prevent propagation */}
        
          {/* Toggle between Purchase and Urge */}
          <View style={styles.toggleContainer}>
              <TouchableOpacity
                  onPress={() => setIsUrgeMode(false)}
                  style={[styles.toggleButton, !isUrgeMode && styles.toggleButtonActivePurple]}
              >
                  <Text style={[styles.toggleButtonText, !isUrgeMode && styles.toggleButtonTextActive]}>
                      I Bought This
                  </Text>
              </TouchableOpacity>
              <TouchableOpacity
                  onPress={() => setIsUrgeMode(true)}
                  style={[styles.toggleButton, isUrgeMode && styles.toggleButtonActiveIndigo]}
              >
                  <Text style={[styles.toggleButtonText, isUrgeMode && styles.toggleButtonTextActive]}>
                      I Want This (Urge)
                  </Text>
              </TouchableOpacity>
          </View>

          <Text style={styles.modalTitle}>
              {isUrgeMode ? 'Log a Purchase Urge' : (initialData ? 'Confirm Your Purchase' : 'Log a New Purchase')}
          </Text>
          
          {isUrgeMode && (
              <Text style={styles.urgeMessage}>
                  The 24-hour rule: Log it now, wait a day. Returnley will analyze if it's worth it.
              </Text>
          )}

          {error && <Text style={styles.errorMessage}>{error}</Text>}
          <View style={styles.form}>
            
            {/* Informational message for fast food items */}
            {isFastFood && !isUrgeMode && (
              <View style={styles.fastFoodMessageContainer}>
                <Text style={styles.fastFoodMessageText}>
                  <Text style={styles.fastFoodMessageTextBold}>Note:</Text> Fast food items are often non-refundable.
                </Text>
              </View>
            )}
            
            <View>
              <Text style={styles.label}>Item Name</Text>
              <TextInput
                id="item"
                value={item}
                onChangeText={setItem}
                style={styles.input}
                placeholder={isUrgeMode ? "e.g., That cool jacket I saw" : "e.g., New Gaming Laptop"}
                placeholderTextColor="#9CA3AF" // gray-400
                required
              />
            </View>
            <View>
              <Text style={styles.label}>Amount ($)</Text>
              <TextInput
                id="amount"
                value={amount}
                onChangeText={setAmount}
                style={styles.input}
                placeholder="e.g., 1599.99"
                placeholderTextColor="#9CA3AF" // gray-400
                keyboardType="numeric"
                required
              />
            </View>
            
            {/* Emotional Context */}
            <View>
              <Text style={styles.label}>How are you feeling?</Text>
              <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={emotionalContext}
                    onValueChange={(itemValue) => setEmotionalContext(itemValue)}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                >
                    {EMOTIONS.map(e => (
                        <Picker.Item key={e} label={e} value={e} />
                    ))}
                </Picker>
              </View>
              <Text style={styles.hintText}>Being honest helps the AI understand your triggers.</Text>
            </View>

            <View>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => setCategory(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select a category" value="" enabled={false} />
                  {Object.entries(CATEGORIES).flatMap(([group, options]) => [
                    <Picker.Item key={group} label={group} value={group} enabled={false} style={styles.pickerGroupLabel} />, // Optgroup label
                    ...options.map(option => (
                      <Picker.Item key={option} label={option} value={option} />
                    ))
                  ])}
                </Picker>
              </View>
            </View>

            {/* Hide Final Sale toggle in Urge Mode (assumed returnable/not bought) */}
            {!isUrgeMode && (
                <View style={styles.switchContainer}>
                  <Switch
                    onValueChange={setIsFinalSale}
                    value={isFinalSale}
                    disabled={category === 'Fast Food'}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={isFinalSale ? "#f5dd4b" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                  />
                  <Text style={[styles.switchLabel, category === 'Fast Food' && styles.disabledText]}>
                    This is a final sale item (cannot be returned)
                  </Text>
                </View>
            )}

            <View style={styles.switchContainer}>
              <Switch
                onValueChange={setIsInvestment}
                value={isInvestment}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={isInvestment ? "#f5dd4b" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
              />
              <Text style={styles.switchLabel}>
                Justify as an investment (education/monetization)
              </Text>
            </View>

             {isInvestment && (
                <View>
                  <Text style={styles.label}>Justification</Text>
                  <TextInput
                    id="justification"
                    value={justification}
                    onChangeText={setJustification}
                    style={[styles.input, styles.textarea]}
                    placeholder="e.g., This camera will help my YouTube channel."
                    placeholderTextColor="#9CA3AF" // gray-400
                    multiline={true}
                    numberOfLines={Platform.OS === 'ios' ? undefined : 2}
                    minHeight={Platform.OS === 'ios' ? 60 : undefined}
                    required
                  />
                </View>
             )}

            {!isUrgeMode && (
                <View>
                  <Text style={[styles.label, isFinalSale && styles.disabledText]}>Return By Date (Optional)</Text>
                  <TextInput
                    id="return-by"
                    value={returnBy}
                    onChangeText={setReturnBy}
                    style={[styles.input, isFinalSale && styles.disabledInput]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF" // gray-400
                    editable={!isFinalSale}
                    // A proper date picker component would be integrated here
                  />
                </View>
            )}

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.cancelButton}
              >
                <Text style={styles.buttonText}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                style={[styles.submitButton, isUrgeMode ? styles.submitButtonUrge : styles.submitButtonPurchase]}
              >
                <Text style={styles.buttonText}>
                  {isUrgeMode ? 'Log Urge' : 'Submit Purchase'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937', // bg-gray-800
    borderRadius: 8, // rounded-lg
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 24, // p-6
    width: '90%', // w-full max-w-md
    maxWidth: 400,
    borderColor: '#374151', // border border-gray-700
    borderWidth: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#374151', // bg-gray-700
    borderRadius: 8, // rounded-lg
    padding: 4, // p-1
    marginBottom: 24, // mb-6
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8, // py-2
    borderRadius: 6, // rounded-md
    alignItems: 'center',
  },
  toggleButtonActivePurple: {
    backgroundColor: '#7C3AED', // bg-purple-600
  },
  toggleButtonActiveIndigo: {
    backgroundColor: '#4F46E5', // bg-indigo-600
  },
  toggleButtonText: {
    fontSize: 14, // text-sm
    fontWeight: 'bold', // font-bold
    color: '#9CA3AF', // text-gray-400
  },
  toggleButtonTextActive: {
    color: 'white', // text-white
  },
  modalTitle: {
    fontSize: 24, // text-2xl
    fontWeight: 'bold', // font-bold
    marginBottom: 16, // mb-4
    color: '#F9FAFB', // text-gray-50
  },
  urgeMessage: {
    fontSize: 14, // text-sm
    color: '#A5B4FC', // text-indigo-300
    marginBottom: 16, // mb-4
    backgroundColor: 'rgba(55, 65, 81, 0.4)', // bg-indigo-900/40
    padding: 8, // p-2
    borderRadius: 4, // rounded
  },
  errorMessage: {
    color: '#F87171', // text-red-400
    marginBottom: 16, // mb-4
  },
  form: {
    // space-y-4 -> marginVertical on children
  },
  fastFoodMessageContainer: {
    backgroundColor: 'rgba(127, 29, 29, 0.4)', // bg-red-900/40
    borderColor: '#DC2626', // border border-red-700
    borderWidth: 1,
    paddingHorizontal: 12, // px-3
    paddingVertical: 8, // py-2
    borderRadius: 6, // rounded-md
    marginBottom: 16, // Assuming space-y-4 for this item means a margin-bottom
  },
  fastFoodMessageText: {
    fontSize: 14, // text-sm
    color: '#FECACA', // text-red-200
  },
  fastFoodMessageTextBold: {
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
    color: '#D1D5DB', // text-gray-300
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#374151', // bg-gray-700
    borderColor: '#4B5563', // border border-gray-600
    borderWidth: 1,
    borderRadius: 6, // rounded-md
    shadowColor: '#000', // shadow-sm
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
    paddingVertical: 8, // py-2
    paddingHorizontal: 12, // px-3
    color: 'white', // text-white
    fontSize: 16,
    // focus:outline-none focus:ring-purple-500 focus:border-purple-500 - focus styles need separate handling in RN
    marginBottom: 16, // Simulating space-y-4
  },
  pickerContainer: {
    backgroundColor: '#374151', // bg-gray-700
    borderColor: '#4B5563', // border border-gray-600
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 16, // Simulating space-y-4
  },
  picker: {
    color: 'white', // text-white
  },
  pickerItem: {
    color: 'white',
    backgroundColor: '#374151',
  },
  pickerGroupLabel: {
    fontWeight: 'bold',
    color: '#D1D5DB', // text-gray-300
    backgroundColor: '#1F2937',
  },
  hintText: {
    fontSize: 12, // text-xs
    color: '#6B7280', // text-gray-500
    marginTop: -10, // Adjust as needed to align with input
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16, // Simulating space-y-4
  },
  switchLabel: {
    marginLeft: 8, // ml-2
    fontSize: 14, // text-sm
    color: '#D1D5DB', // text-gray-300
  },
  disabledText: {
    color: '#6B7280', // text-gray-500
  },
  textarea: {
    minHeight: 60, // rows-2 (approximate)
    textAlignVertical: 'top', // For Android
  },
  disabledInput: {
    opacity: 0.5,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // justify-end
    marginTop: 16, // pt-4
  },
  cancelButton: {
    backgroundColor: '#4B5563', // bg-gray-600
    paddingVertical: 8, // py-2
    paddingHorizontal: 16, // px-4
    borderRadius: 6, // rounded-lg
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    marginRight: 16, // space-x-4
  },
  submitButton: {
    paddingVertical: 8, // py-2
    paddingHorizontal: 16, // px-4
    borderRadius: 6, // rounded-lg
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  submitButtonUrge: {
    backgroundColor: '#4F46E5', // bg-indigo-600
  },
  submitButtonPurchase: {
    backgroundColor: '#7C3AED', // bg-purple-600
  },
  buttonText: {
    color: 'white', // text-white
    fontWeight: '600', // font-semibold
    fontSize: 16,
  },
});
