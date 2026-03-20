import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { UserProfile } from '../types';

type AiTone = 'encouraging' | 'stern' | 'ruthless';

/**
 * Props for the SettingsModal component.
 */
interface SettingsModalProps {
  /** Function to call when the modal should be closed. */
  onClose: () => void;
  /** The current AI tone setting. */
  aiTone: AiTone;
  /** Callback to update the AI tone. */
  onSetAiTone: (tone: AiTone) => void;
  /** Callback to clear all transaction history. */
  onClearHistory: () => void;
  /** The current user profile. */
  userProfile: UserProfile | null;
  /** Callback to update the user profile. */
  onUpdateProfile: (profile: UserProfile) => void;
}

/**
 * A modal for configuring application settings, such as AI tone and data management.
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  aiTone,
  onSetAiTone,
  onClearHistory,
  userProfile,
  onUpdateProfile,
}) => {
  const [minAmount, setMinAmount] = useState(userProfile?.minCallAmount.toString() || '20');
  const [frequency, setFrequency] = useState(userProfile?.nagFrequency.toString() || '2');

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Settings</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.settingsSection}>
              {/* AI Tone Setting */}
              <View style={styles.sectionItem}>
                <Text style={styles.sectionTitle}>AI Tone</Text>
                <Text style={styles.sectionDescription}>Choose the personality of your financial conscience.</Text>
                <View style={styles.toneButtonsContainer}>
                  <TouchableOpacity
                    onPress={() => onSetAiTone('encouraging')}
                    style={[
                      styles.toneButton,
                      aiTone === 'encouraging' ? styles.toneButtonPurple : styles.toneButtonInactive
                    ]}
                  >
                    <Text
                      style={[styles.toneButtonText, aiTone === 'encouraging' && styles.toneButtonTextActive]}
                      adjustsFontSizeToFit
                      numberOfLines={1}
                    >
                      Encouraging
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onSetAiTone('stern')}
                    style={[
                      styles.toneButton,
                      aiTone === 'stern' ? styles.toneButtonRed : styles.toneButtonInactive
                    ]}
                  >
                    <Text
                      style={[styles.toneButtonText, aiTone === 'stern' && styles.toneButtonTextActive]}
                      adjustsFontSizeToFit
                      numberOfLines={1}
                    >
                      Stern
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onSetAiTone('ruthless')}
                    style={[
                      styles.toneButton,
                      aiTone === 'ruthless' ? styles.toneButtonDarkRed : styles.toneButtonInactive
                    ]}
                  >
                    <Text
                      style={[styles.toneButtonText, aiTone === 'ruthless' && styles.toneButtonTextActive]}
                      adjustsFontSizeToFit
                      numberOfLines={1}
                    >
                      Ruthless
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Threshold Setting */}
              <View style={styles.sectionItem}>
                <Text style={styles.sectionTitle}>Alert Threshold</Text>
                <Text style={styles.sectionDescription}>Minimum purchase amount for an alert.</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.input}
                    value={minAmount}
                    onChangeText={(val) => {
                      setMinAmount(val);
                      if (userProfile) {
                        onUpdateProfile({ ...userProfile, minCallAmount: parseFloat(val) || 0 });
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="20"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              {/* Nagging Frequency Setting */}
              <View style={styles.sectionItem}>
                <Text style={styles.sectionTitle}>Follow-up Frequency</Text>
                <Text style={styles.sectionDescription}>How often to check in after an alert (in hours). Use 0 for just one.</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={frequency}
                    onChangeText={(val) => {
                      setFrequency(val);
                      if (userProfile) {
                        onUpdateProfile({ ...userProfile, nagFrequency: parseFloat(val) || 0 });
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="2"
                    placeholderTextColor="#6B7280"
                  />
                  <Text style={styles.inputSuffix}>hours</Text>
                </View>
              </View>

              {/* Danger Zone for destructive actions */}
              <View style={styles.dangerZoneBorder}>
                 <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
                 <View style={styles.clearTransactionsContainer}>
                    <View style={{ flexShrink: 1 }}>
                        <Text style={styles.clearTransactionsText}>Clear All Transactions</Text>
                        <Text style={styles.clearTransactionsDescription}>This will permanently delete all your data.</Text>
                    </View>
                    <TouchableOpacity
                        onPress={onClearHistory}
                        style={styles.clearHistoryButton}
                    >
                        <Text style={styles.clearHistoryButtonText}>Clear</Text>
                    </TouchableOpacity>
                 </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.doneButtonContainer}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </View>
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
  keyboardAvoidingView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: '#9CA3AF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsSection: {
    gap: 20,
  },
  sectionItem: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  toneButtonsContainer: {
    backgroundColor: '#111827',
    padding: 4,
    borderRadius: 8,
    flexDirection: 'row',
  },
  toneButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  toneButtonPurple: {
    backgroundColor: '#7C3AED',
  },
  toneButtonRed: {
    backgroundColor: '#DC2626',
  },
  toneButtonDarkRed: {
    backgroundColor: '#B91C1C',
  },
  toneButtonInactive: {
  },
  toneButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  toneButtonTextActive: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    color: 'white',
    fontSize: 16,
  },
  currencySymbol: {
    color: '#9CA3AF',
    marginRight: 4,
    fontSize: 16,
  },
  inputSuffix: {
    color: '#9CA3AF',
    marginLeft: 4,
    fontSize: 14,
  },
  dangerZoneBorder: {
    borderTopWidth: 1,
    borderColor: '#374151',
    paddingTop: 20,
    marginTop: 12,
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F87171',
    marginBottom: 12,
  },
  clearTransactionsContainer: {
    backgroundColor: 'rgba(185, 28, 28, 0.1)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearTransactionsText: {
    fontWeight: '600',
    color: '#E5E7EB',
    fontSize: 14,
  },
  clearTransactionsDescription: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  clearHistoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#B91C1C',
    borderRadius: 8,
  },
  clearHistoryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  doneButtonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  doneButton: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
