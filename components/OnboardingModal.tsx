import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { UserProfile } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingModalProps {
  onComplete: (profile: UserProfile) => void;
}

const { width } = Dimensions.get('window');

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState('');
  const [weakness, setWeakness] = useState('');
  const [goal, setGoal] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [minCallAmount, setMinCallAmount] = useState('20');
  const [nagFrequency, setNagFrequency] = useState('2');

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    if (income && weakness && goal && goalAmount && minCallAmount && nagFrequency) {
      onComplete({
        monthlyIncome: parseFloat(income),
        financialWeakness: weakness,
        savingsGoal: goal,
        goalAmount: parseFloat(goalAmount),
        minCallAmount: parseFloat(minCallAmount),
        nagFrequency: parseFloat(nagFrequency),
      });
    }
  };

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((s) => (
        <View 
          key={s} 
          style={[
            styles.progressDot, 
            s <= step ? styles.progressDotActive : styles.progressDotInactive
          ]} 
        />
      ))}
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={() => {}}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <View style={styles.headerContainer}>
            <Text style={styles.welcomeTitle}>
              {step === 1 ? "Your Profile" : step === 2 ? "Your Goal" : "Your Boundaries"}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {step === 1 
                ? "First, let's understand your financial situation." 
                : step === 2 
                ? "What are we saving for? Give me a target." 
                : "How strict should I be with you?"}
            </Text>
            {renderProgress()}
          </View>

          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            {step === 1 && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Approximate monthly income?</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={income}
                      onChangeText={setIncome}
                      style={styles.input}
                      placeholder="3000"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Biggest spending weakness?</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      value={weakness}
                      onChangeText={setWeakness}
                      style={styles.input}
                      placeholder="e.g., Late night snacks, Tech"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Financial Goal</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      value={goal}
                      onChangeText={setGoal}
                      style={styles.input}
                      placeholder="e.g., Vacation, Debt"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Target Amount</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={goalAmount}
                      onChangeText={setGoalAmount}
                      style={styles.input}
                      placeholder="5000"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Minimum amount to trigger a call?</Text>
                  <Text style={styles.helperText}>I won't ring you for small stuff.</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={minCallAmount}
                      onChangeText={setMinCallAmount}
                      style={styles.input}
                      placeholder="20"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nagging frequency (hours)</Text>
                  <Text style={styles.helperText}>0 means I'll only call you once.</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      keyboardType="numeric"
                      value={nagFrequency}
                      onChangeText={setNagFrequency}
                      style={styles.input}
                      placeholder="2"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {step > 1 ? (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            ) : <View />}

            <TouchableOpacity 
              onPress={handleNext} 
              style={[
                styles.nextButton,
                (step === 1 && (!income || !weakness)) || 
                (step === 2 && (!goal || !goalAmount)) ||
                (step === 3 && (!minCallAmount || !nagFrequency)) 
                  ? styles.nextButtonDisabled : {}
              ]}
              disabled={
                (step === 1 && (!income || !weakness)) || 
                (step === 2 && (!goal || !goalAmount)) ||
                (step === 3 && (!minCallAmount || !nagFrequency))
              }
            >
              <Text style={styles.nextButtonText}>
                {step === totalSteps ? "Finish" : "Next"}
              </Text>
              {step < totalSteps && <Ionicons name="arrow-forward" size={20} color="white" />}
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#1F2937', 
    borderRadius: 24, 
    padding: 24, 
    width: '100%',
    maxWidth: 400, 
    maxHeight: '80%',
    borderColor: 'rgba(126, 34, 206, 0.3)', 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  headerContainer: {
    alignItems: 'center', 
    marginBottom: 20, 
  },
  welcomeTitle: {
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#A78BFA', 
    marginBottom: 8, 
  },
  welcomeSubtitle: {
    color: '#9CA3AF', 
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#7C3AED',
  },
  progressDotInactive: {
    width: 12,
    backgroundColor: '#374151',
  },
  stepContainer: {
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14, 
    fontWeight: '600', 
    color: '#D1D5DB', 
    marginBottom: 8, 
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827', 
    borderColor: '#374151', 
    borderWidth: 1,
    borderRadius: 12, 
    paddingLeft: 16,
  },
  currencySymbol: {
    color: '#9CA3AF', 
    marginRight: 4,
    fontSize: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 12, 
    paddingRight: 16, 
    color: 'white', 
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#7C3AED', 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 12, 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#4B5563',
    opacity: 0.5,
  },
  nextButtonText: {
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16,
  },
});