import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ProgressBarAndroid } from 'react-native';

interface GoalProgressProps {
  currentSaved: number; // This is now the 40% allocation
  totalReturned: number; // This is the total value of returned items
  goalName: string;
  goalAmount: number;
  onUpdateGoal: (name: string, amount: number) => void;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ currentSaved, totalReturned, goalName, goalAmount, onUpdateGoal }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(goalName);
  const [editAmount, setEditAmount] = useState(goalAmount.toString());

  const progressPercentage = Math.min((currentSaved / goalAmount) * 100, 100);
  const bankRefund = totalReturned * 0.60;

  const handleSave = () => {
    const amount = parseFloat(editAmount);
    if (editName && !isNaN(amount) && amount > 0) {
      onUpdateGoal(editName, amount);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(goalName);
    setEditAmount(goalAmount.toString());
    setIsEditing(false);
  };

  return (
    <View style={styles.cardContainer}>
      {isEditing ? (
        <View style={styles.editingContainer}>
          <View style={styles.editHeader}>
            <Text style={styles.editTitle}>Update Your Goal</Text>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formColumn}>
              <Text style={styles.label}>Goal Name</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={styles.textInput}
              />
            </View>
            <View style={styles.formColumn}>
              <Text style={styles.label}>Target Amount ($)</Text>
              <TextInput
                keyboardType="numeric"
                value={editAmount}
                onChangeText={setEditAmount}
                style={styles.textInput}
              />
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.displayHeader}>
            <View>
              <Text style={styles.goalFundTitle}>Goal Fund (40% of Returns)</Text>
              <Text style={styles.currentSavedAmount}>
                ${currentSaved.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.editGoalButton}
            >
              <Text style={styles.editGoalButtonText}>Edit Goal</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.goalDetails}>
              <Text style={styles.goalText}>Goal: <Text style={styles.goalNameText}>{goalName}</Text></Text>
              <Text style={styles.goalAmountText}>${goalAmount.toLocaleString()}</Text>
            </View>
            
            {/* Using View with width for progress bar approximation */}
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>
            
            <View style={styles.progressPercentageContainer}>
              <Text style={styles.progressPercentageText}>
                {progressPercentage.toFixed(1)}% Completed
              </Text>
            </View>
          </View>

          {/* New Breakdown Section */}
          <View style={styles.breakdownContainer}>
             <View style={styles.breakdownItem}>
                <Text style={styles.breakdownTitle}>Back to Bank (60%)</Text>
                <Text style={styles.breakdownValueGreen}>${bankRefund.toFixed(2)}</Text>
             </View>
             <View style={styles.breakdownItemNoBorder}>
                <Text style={styles.breakdownTitle}>Total Returned</Text>
                <Text style={styles.breakdownValue}>${totalReturned.toFixed(2)}</Text>
             </View>
          </View>

          {progressPercentage >= 100 && (
             <View style={styles.goalAchievedMessage}>
                <Text style={styles.goalAchievedText}>🎉 Goal Achieved! You are amazing!</Text>
                <Text style={styles.goalAchievedSubText}>Time to set a bigger target?</Text>
             </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)', // bg-gray-800/50
    borderRadius: 8, // rounded-lg
    shadowColor: '#000', // shadow-xl (approximated)
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    padding: 24, // p-6
    marginBottom: 24, // mb-6
  },
  editingContainer: {
    // space-y-4 (simulated by margins)
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // mb-2
  },
  editTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#E5E7EB', // text-gray-200
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16, // gap-4 (approx)
  },
  formColumn: {
    width: '48%', // grid-cols-2 (approx)
  },
  label: {
    fontSize: 12, // text-xs
    fontWeight: '500', // font-medium
    color: '#9CA3AF', // text-gray-400
    marginBottom: 4, // mb-1
  },
  textInput: {
    width: '100%', // w-full
    backgroundColor: '#111827', // bg-gray-900
    borderColor: '#374151', // border border-gray-700
    borderWidth: 1,
    borderRadius: 6, // rounded-md
    paddingVertical: 8, // py-2
    paddingHorizontal: 12, // px-3
    color: 'white', // text-white
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16, // mt-4
  },
  cancelButton: {
    paddingHorizontal: 12, // px-3
    paddingVertical: 8, // py-1.5
    marginRight: 8, // space-x-2
  },
  cancelButtonText: {
    fontSize: 14, // text-sm
    color: '#9CA3AF', // text-gray-400
  },
  saveButton: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-1.5
    backgroundColor: '#7C3AED', // bg-purple-600
    borderRadius: 6, // rounded-md
    shadowColor: '#000', // shadow-md
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2.62,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 14, // text-sm
    color: 'white', // text-white
    fontWeight: '600', // font-semibold
  },
  displayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16, // mb-4
  },
  goalFundTitle: {
    fontSize: 12, // text-sm
    fontWeight: '500', // font-medium
    color: '#9CA3AF', // text-gray-400
    textTransform: 'uppercase', // uppercase
    letterSpacing: 0.5, // tracking-wider
  },
  currentSavedAmount: {
    fontSize: 36, // text-4xl
    fontWeight: 'bold', // font-bold
    color: '#A78BFA', // approximated gradient from-purple-400 to-pink-500
    marginTop: 4, // mt-1
  },
  editGoalButton: {
    // No specific styling needed for the touchable opacity, just its text
  },
  editGoalButtonText: {
    fontSize: 12, // text-xs
    color: '#A78BFA', // text-purple-400
    textDecorationLine: 'underline', // underline
  },
  progressSection: {
    marginBottom: 24, // mb-6
  },
  goalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8, // space-y-2 (top part)
  },
  goalText: {
    fontSize: 14, // text-sm
    color: '#D1D5DB', // text-gray-300
  },
  goalNameText: {
    fontWeight: '600', // font-semibold
    color: 'white', // text-white
  },
  goalAmountText: {
    fontSize: 14, // text-sm
    color: '#9CA3AF', // text-gray-400
  },
  progressBarBackground: {
    width: '100%', // w-full
    backgroundColor: '#4B5563', // bg-gray-700
    borderRadius: 20, // rounded-full (approx h-4)
    height: 16, // h-4
    overflow: 'hidden', // overflow-hidden
    shadowColor: '#000', // shadow-inner (approximated)
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  progressBarFill: {
    height: '100%', // h-4
    backgroundColor: '#A78BFA', // approximated gradient from-purple-600 to-pink-500
    borderRadius: 20,
    // transition-all duration-1000 ease-out (React Native animations would be needed for this)
    // relative + inset-0 bg-white/20 animate-pulse (React Native animations needed)
  },
  progressPercentageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  progressPercentageText: {
    fontSize: 12, // text-xs
    color: '#9CA3AF', // text-gray-400
  },
  breakdownContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(17, 24, 39, 0.5)', // bg-gray-900/50
    borderRadius: 8, // rounded-lg
    padding: 12, // p-3
    borderWidth: 1, // border
    borderColor: 'rgba(55, 65, 81, 0.5)', // border-gray-700/50
    // gap-4 (simulated by margin or padding in items)
  },
  breakdownItem: {
    flex: 1, // grid-cols-2
    alignItems: 'center', // text-center
    borderRightWidth: 1, // border-r
    borderColor: '#4B5563', // border-gray-700
    paddingHorizontal: 8,
  },
  breakdownItemNoBorder: {
    flex: 1, // grid-cols-2
    alignItems: 'center', // text-center
    paddingHorizontal: 8,
  },
  breakdownTitle: {
    fontSize: 12, // text-xs
    color: '#9CA3AF', // text-gray-500
    textTransform: 'uppercase',
  },
  breakdownValueGreen: {
    fontSize: 20, // text-xl
    fontWeight: 'bold', // font-bold
    color: '#34D399', // text-green-400
  },
  breakdownValue: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#D1D5DB', // text-gray-300
  },
  goalAchievedMessage: {
    marginTop: 16, // mt-4
    padding: 12, // p-3
    backgroundColor: 'rgba(4, 120, 87, 0.3)', // bg-green-900/30
    borderWidth: 1, // border
    borderColor: 'rgba(52, 211, 153, 0.5)', // border-green-700/50
    borderRadius: 8, // rounded-lg
    alignItems: 'center', // text-center
    // animate-bounce (React Native animations needed)
  },
  goalAchievedText: {
    color: '#6EE7B7', // text-green-300
    fontWeight: 'bold', // font-bold
  },
  goalAchievedSubText: {
    fontSize: 12, // text-xs
    color: '#34D399', // text-green-400
  },
});