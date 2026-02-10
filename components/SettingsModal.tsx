import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
}

/**
 * A modal for configuring application settings, such as AI tone and data management.
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  aiTone,
  onSetAiTone,
  onClearHistory,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPressOut={onClose} // Close when tapping outside
      >
        {/* Modal content */}
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsSection}>
            {/* AI Tone Setting */}
            <View>
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
                      <Text style={styles.clearHistoryButtonText}>Clear History</Text>
                  </TouchableOpacity>
               </View>
            </View>
          </View>
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
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)', // bg-black bg-opacity-75
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937', // bg-gray-800
    borderRadius: 8, // rounded-lg
    shadowColor: '#000', // shadow-xl
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    padding: 24, // p-6
    width: '90%', // w-full
    maxWidth: 400, // max-w-md
    margin: 16, // m-4
  },
  header: {
    flexDirection: 'row', // flex
    justifyContent: 'space-between', // justify-between
    alignItems: 'center', // items-center
    marginBottom: 24, // mb-6
  },
  title: {
    fontSize: 24, // text-2xl
    fontWeight: 'bold', // font-bold
    color: 'white', // Default text color, assuming it was implied or inherited
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: '#9CA3AF', // text-gray-400
    fontSize: 24, // text-2xl
    fontWeight: 'bold',
  },
  settingsSection: {
    // space-y-6
  },
  sectionTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#E5E7EB', // text-gray-200
    marginBottom: 8, // mb-2
  },
  sectionDescription: {
    fontSize: 14, // text-sm
    color: '#9CA3AF', // text-gray-400
    marginBottom: 12, // mb-3
  },
  toneButtonsContainer: {
    backgroundColor: '#4B5563', // bg-gray-700
    padding: 4, // p-1
    borderRadius: 8, // rounded-lg
    flexDirection: 'row', // flex
    flexWrap: 'nowrap', // Prevent buttons from wrapping
    // sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 (responsive layout handled by flex-direction and margins)
  },
  toneButton: {
    flex: 1,
    paddingHorizontal: 12, // px-3
    paddingVertical: 8, // py-2
    borderRadius: 6, // rounded-md
    transitionDuration: 200, // transition-colors (handled by TouchableOpacity feedback)
    alignItems: 'center',
    marginHorizontal: 2, // simulating space-x-1
    flexShrink: 1, // Allow the button to shrink
  },
  toneButtonPurple: {
    backgroundColor: '#7C3AED', // bg-purple-600
  },
  toneButtonRed: {
    backgroundColor: '#DC2626', // bg-red-600
  },
  toneButtonDarkRed: {
    backgroundColor: '#B91C1C', // bg-red-800
  },
  toneButtonInactive: {
    // hover:bg-gray-600 (handled by TouchableOpacity feedback)
  },
  toneButtonText: {
    fontSize: 14, // text-sm
    fontWeight: '600', // font-semibold
    color: '#D1D5DB', // text-gray-300
  },
  toneButtonTextActive: {
    color: 'white', // text-white
  },
  dangerZoneBorder: {
    borderTopWidth: 1, // border-t
    borderColor: '#374151', // border-gray-700
    paddingTop: 24, // pt-6
    marginTop: 24, // space-y-6
  },
  dangerZoneTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#F87171', // text-red-400
    marginBottom: 8, // mb-2
  },
  clearTransactionsContainer: {
    backgroundColor: 'rgba(185, 28, 28, 0.3)', // bg-red-900/30
    borderColor: 'rgba(220, 38, 38, 0.5)', // border border-red-700/50
    borderWidth: 1,
    borderRadius: 8, // rounded-lg
    padding: 16, // p-4
    flexDirection: 'row', // flex
    flexWrap: 'wrap', // Allow content to wrap
    justifyContent: 'space-between', // justify-between
    alignItems: 'center', // items-center
    flexShrink: 1, // Allow the container to shrink
  },
  clearTransactionsText: {
    fontWeight: '600', // font-semibold
    color: '#E5E7EB', // text-gray-200
  },
  clearTransactionsDescription: {
    fontSize: 14, // text-sm
    color: '#9CA3AF', // text-gray-400
  },
  clearHistoryButton: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    backgroundColor: '#B91C1C', // bg-red-700
    borderRadius: 8, // rounded-lg
    shadowColor: '#000', // shadow-md
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  clearHistoryButtonText: {
    color: 'white', // text-white
    fontWeight: 'bold', // font-bold
  },
  doneButtonContainer: {
    marginTop: 32, // mt-8
    alignItems: 'flex-end', // text-right
  },
  doneButton: {
    paddingVertical: 8, // py-2
    paddingHorizontal: 24, // px-6
    backgroundColor: '#7C3AED', // bg-purple-600
    borderRadius: 8, // rounded-lg
    shadowColor: '#000', // shadow-md
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  doneButtonText: {
    color: 'white', // text-white
    fontWeight: '600', // font-semibold
    fontSize: 16,
  },
});
