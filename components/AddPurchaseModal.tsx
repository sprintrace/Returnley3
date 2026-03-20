import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Platform, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CATEGORIES } from '../lib/categories';
import { Transaction } from '../types';
import { FAST_FOOD_KEYWORDS } from '../lib/keywords';
import { EMOTIONS } from '../lib/emotions';

interface AddPurchaseModalProps {
  onClose: () => void;
  onSubmit: (item: string, amount: number, category: string, isReturnable: boolean, returnBy?: string, justification?: string, emotionalContext?: string, isUrge?: boolean) => void;
  initialData?: Partial<Transaction> | null;
}

const defaultCategory = CATEGORIES['Discretionary Spending'][2];

export const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({ onClose, onSubmit, initialData }) => {
  const [isUrgeMode, setIsUrgeMode] = useState(false);
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [isFinalSale, setIsFinalSale] = useState(false);
  const [returnBy, setReturnBy] = useState('');
  const [isInvestment, setIsInvestment] = useState(false);
  const [justification, setJustification] = useState('');
  const [emotionalContext, setEmotionalContext] = useState(EMOTIONS[0]);
  const [error, setError] = useState('');

  const isConsumable = useMemo(() => {
    const consumableCategories = ['Fast Food', 'Dining & Entertainment', 'Groceries'];
    if (consumableCategories.includes(category)) return true;
    const lowerCaseItem = item.toLowerCase();
    return FAST_FOOD_KEYWORDS.some(keyword => lowerCaseItem.includes(keyword));
  }, [item, category]);

  useEffect(() => {
    if (initialData) {
      setItem(initialData.item || '');
      setAmount(initialData.amount?.toString() || '');
      const allCategories = Object.values(CATEGORIES).flat();
      setCategory(initialData.category && allCategories.includes(initialData.category) ? initialData.category : defaultCategory);
    }
  }, [initialData]);

  useEffect(() => {
    if (isConsumable) setIsFinalSale(true);
  }, [isConsumable]);

  const handleSubmit = () => {
    if (!item || !amount || !category) {
      setError('All fields are required.');
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid, positive amount.');
      return;
    }
    onSubmit(item, numericAmount, category, isUrgeMode ? true : !isFinalSale, (isFinalSale && !isUrgeMode) ? undefined : returnBy, isInvestment ? justification : undefined, emotionalContext, isUrgeMode);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity onPress={() => setIsUrgeMode(false)} style={[styles.toggleButton, !isUrgeMode && styles.toggleButtonActivePurple]}>
                    <Text style={[styles.toggleButtonText, !isUrgeMode && styles.toggleButtonTextActive]}>I Bought This</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsUrgeMode(true)} style={[styles.toggleButton, isUrgeMode && styles.toggleButtonActiveIndigo]}>
                    <Text style={[styles.toggleButtonText, isUrgeMode && styles.toggleButtonTextActive]}>I Want This (Urge)</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTitle}>{isUrgeMode ? 'Log a Purchase Urge' : (initialData ? 'Confirm Your Purchase' : 'Log a New Purchase')}</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.contentScrollView}>
                {isUrgeMode && <Text style={styles.urgeMessage}>The 24-hour rule: Log it now, wait a day. Returnley will analyze if it&apos;s worth it.</Text>}
                {error && <Text style={styles.errorMessage}>{error}</Text>}
                {isConsumable && !isUrgeMode && (
                  <View style={styles.fastFoodMessageContainer}>
                    <Text style={styles.fastFoodMessageText}><Text style={styles.fastFoodMessageTextBold}>Note:</Text> This is a consumable item and cannot be returned once consumed.</Text>
                  </View>
                )}
                <Text style={styles.label}>Item Name</Text>
                <TextInput value={item} onChangeText={setItem} style={styles.input} placeholder={isUrgeMode ? "e.g., That cool jacket I saw" : "e.g., New Gaming Laptop"} placeholderTextColor="#9CA3AF" />
                <Text style={styles.label}>Amount ($)</Text>
                <TextInput value={amount} onChangeText={setAmount} style={styles.input} placeholder="e.g., 1599.99" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
                <Text style={styles.label}>How are you feeling?</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={emotionalContext} onValueChange={(itemValue) => setEmotionalContext(itemValue)} style={styles.picker} itemStyle={styles.pickerItem}>
                    {EMOTIONS.map(e => <Picker.Item key={e} label={String(e)} value={e} />)}
                  </Picker>
                </View>
                <Text style={styles.hintText}>Being honest helps the AI understand your triggers.</Text>
                <Text style={styles.label}>Category</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={category} onValueChange={(itemValue) => setCategory(itemValue)} style={styles.picker} itemStyle={styles.pickerItem}>
                    <Picker.Item label="Select a category" value="" enabled={false} />
                    {Object.values(CATEGORIES).flat().map(option => <Picker.Item key={option} label={String(option)} value={option} />)}
                  </Picker>
                </View>
                {!isUrgeMode && (
                  <View style={styles.switchContainer}>
                    <Switch onValueChange={setIsFinalSale} value={isFinalSale} disabled={isConsumable} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={isFinalSale ? "#f5dd4b" : "#f4f3f4"} ios_backgroundColor="#3e3e3e" />
                    <Text style={[styles.switchLabel, isConsumable && styles.disabledText]}>This is a final sale item (cannot be returned)</Text>
                  </View>
                )}
                <View style={styles.switchContainer}>
                  <Switch onValueChange={setIsInvestment} value={isInvestment} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={isInvestment ? "#f5dd4b" : "#f4f3f4"} ios_backgroundColor="#3e3e3e" />
                  <Text style={styles.switchLabel}>Justify as an investment (education/monetization)</Text>
                </View>
                {isInvestment && (
                  <View>
                    <Text style={styles.label}>Justification</Text>
                    <TextInput value={justification} onChangeText={setJustification} style={[styles.input, styles.textarea, { minHeight: Platform.OS === 'ios' ? 60 : undefined }]} placeholder="e.g., This camera will help my YouTube channel." placeholderTextColor="#9CA3AF" multiline={true} numberOfLines={Platform.OS === 'ios' ? undefined : 2} />
                  </View>
                )}
                {!isUrgeMode && (
                  <View>
                    <Text style={[styles.label, isFinalSale && styles.disabledText]}>Return By Date (Optional)</Text>
                    <TextInput value={returnBy} onChangeText={setReturnBy} style={[styles.input, isFinalSale && styles.disabledInput]} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" editable={!isFinalSale} />
                  </View>
                )}
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit} style={[styles.submitButton, isUrgeMode ? styles.submitButtonUrge : styles.submitButtonPurchase]}>
                  <Text style={styles.buttonText}>{isUrgeMode ? 'Log Urge' : 'Submit Purchase'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    borderColor: '#374151',
    borderWidth: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  contentScrollView: {
    paddingHorizontal: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  toggleButtonActivePurple: { backgroundColor: '#7C3AED' },
  toggleButtonActiveIndigo: { backgroundColor: '#4F46E5' },
  toggleButtonText: { fontSize: 14, fontWeight: 'bold', color: '#9CA3AF' },
  toggleButtonTextActive: { color: 'white' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#F9FAFB' },
  urgeMessage: { fontSize: 14, color: '#A5B4FC', marginBottom: 16, backgroundColor: 'rgba(55, 65, 81, 0.4)', padding: 8, borderRadius: 4 },
  errorMessage: { color: '#F87171', marginBottom: 16 },
  fastFoodMessageContainer: { backgroundColor: 'rgba(127, 29, 29, 0.4)', borderColor: '#DC2626', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginBottom: 16 },
  fastFoodMessageText: { fontSize: 14, color: '#FECACA' },
  fastFoodMessageTextBold: { fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '500', color: '#D1D5DB', marginBottom: 4 },
  input: { backgroundColor: '#374151', borderColor: '#4B5563', borderWidth: 1, borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 2, paddingVertical: 8, paddingHorizontal: 12, color: 'white', fontSize: 16, marginBottom: 16 },
  pickerContainer: { backgroundColor: '#374151', borderColor: '#4B5563', borderWidth: 1, borderRadius: 6, marginBottom: 16 },
  picker: { color: 'white' },
  pickerItem: { color: 'white', backgroundColor: '#374151' },
  hintText: { fontSize: 12, color: '#6B7280', marginTop: -10, marginBottom: 16 },
  switchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  switchLabel: { marginLeft: 8, fontSize: 14, color: '#D1D5DB' },
  disabledText: { color: '#6B7280' },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  disabledInput: { opacity: 0.5 },
  cancelButton: { backgroundColor: '#4B5563', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 2.22, elevation: 3, marginRight: 16 },
  submitButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 2.22, elevation: 3 },
  submitButtonUrge: { backgroundColor: '#4F46E5' },
  submitButtonPurchase: { backgroundColor: '#7C3AED' },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});