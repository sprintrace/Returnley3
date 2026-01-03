import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { UserProfile } from '../types';

interface OnboardingModalProps {
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [income, setIncome] = useState('');
  const [weakness, setWeakness] = useState('');
  const [goal, setGoal] = useState('');

  const handleSubmit = () => {
    if (income && weakness && goal) {
      onComplete({
        monthlyIncome: parseFloat(income),
        financialWeakness: weakness,
        savingsGoal: goal,
        // Default values for other UserProfile properties if any, or ensure they are optional.
      });
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={() => {}} // Handle back button press for Android
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <View style={styles.headerContainer}>
            <Text style={styles.welcomeTitle}>
              Welcome to Returnley
            </Text>
            <Text style={styles.welcomeSubtitle}>
              To be your financial conscience, I need to know who I'm dealing with.
            </Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>
                What is your approximate monthly income?
              </Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  keyboardType="numeric"
                  required
                  value={income}
                  onChangeText={setIncome}
                  style={styles.input}
                  placeholder="3000"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>
                What is your biggest spending weakness?
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  required
                  value={weakness}
                  onChangeText={setWeakness}
                  style={styles.input}
                  placeholder="e.g., Late night snacks, Tech gadgets, Shoes"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>
                What is your main financial goal right now?
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  required
                  value={goal}
                  onChangeText={setGoal}
                  style={styles.input}
                  placeholder="e.g., Save for a house, Pay off debt, Vacation"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>
                Start My Transformation
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // bg-black bg-opacity-90
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16, // px-4
  },
  modalContent: {
    backgroundColor: '#1F2937', // bg-gray-800
    borderRadius: 8, // rounded-lg
    shadowColor: '#000', // shadow-2xl
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5.46,
    elevation: 10,
    padding: 32, // p-8
    width: '100%',
    maxWidth: 500, // max-w-lg
    borderColor: 'rgba(126, 34, 206, 0.3)', // border border-purple-500/30
    borderWidth: 1,
  },
  headerContainer: {
    alignItems: 'center', // text-center
    marginBottom: 32, // mb-8
  },
  welcomeTitle: {
    fontSize: 28, // text-3xl
    fontWeight: 'bold', // font-bold
    // For gradient text: this is an approximation. Actual gradients require special components/libraries.
    color: '#A78BFA', // from-purple-400
    marginBottom: 8, // mb-2
  },
  welcomeSubtitle: {
    color: '#9CA3AF', // text-gray-400
    textAlign: 'center',
  },
  form: {
    // space-y-6 (simulated by margins)
  },
  label: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
    color: '#D1D5DB', // text-gray-300
    marginBottom: 4, // mb-1
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827', // bg-gray-900
    borderColor: '#374151', // border border-gray-700
    borderWidth: 1,
    borderRadius: 8, // rounded-lg
    paddingLeft: 8, // pl-8 due to currency symbol
    marginBottom: 24, // space-y-6
  },
  currencySymbol: {
    color: '#9CA3AF', // text-gray-500
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 8, // py-2
    paddingRight: 16, // pr-4
    color: 'white', // text-white
    fontSize: 16,
    // focus:ring-2 focus:ring-purple-500 focus:border-transparent (focus styles are different in RN)
  },
  submitButton: {
    // approximated gradient with solid color
    backgroundColor: '#7C3AED', // from-purple-600
    paddingVertical: 12, // py-3
    paddingHorizontal: 24, // px-6
    borderRadius: 8, // rounded-lg
    shadowColor: '#000', // shadow-lg
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
    marginTop: 24, // space-y-6
  },
  submitButtonText: {
    color: 'white', // text-white
    fontWeight: 'bold', // font-bold
    fontSize: 16,
  },
});
