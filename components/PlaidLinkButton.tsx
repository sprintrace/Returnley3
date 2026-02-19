import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

/**
 * Props for the PlaidLinkButton component.
 */
interface PlaidLinkButtonProps {
  /** Callback function executed on successful connection. */
  onSuccess: (public_token: string, metadata: any) => void;
}

/**
 * MOCK IMPLEMENTATION: PlaidLinkButton
 * This component simulates the Plaid Link flow for frontend development and demo purposes.
 * It does NOT connect to a real backend or the Plaid API.
 * Clicking the button will trigger the `onSuccess` callback after a short delay
 * to mimic the time it takes for a real connection.
 */
export const PlaidLinkButton: React.FC<PlaidLinkButtonProps> = ({ onSuccess }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleClick = useCallback(() => {
    setIsConnecting(true);
    // Simulate the Plaid flow and backend token exchange with a timeout.
    // In a real application, this would open the Plaid Link modal.
    setTimeout(() => {
      console.log("Simulating Plaid connection success...");
      // Pass mock data back to the parent component via the onSuccess handler.
      const mockPublicToken = 'mock_public_token';
      const mockMetadata = { institution: { name: 'Mock Bank', institution_id: 'ins_mock' } };
      onSuccess(mockPublicToken, mockMetadata);
      setIsConnecting(false);
    }, 1500); // 1.5 second delay to simulate loading.
  }, [onSuccess]);

  return (
    <TouchableOpacity
      onPress={handleClick}
      disabled={isConnecting}
      style={[styles.button, isConnecting && styles.buttonDisabled]}
    >
      {isConnecting ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>Connect Your Bank</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#059669', // bg-green-600
    paddingVertical: 8, // py-2
    paddingHorizontal: 16, // px-4
    borderRadius: 8, // rounded-lg
    shadowColor: '#000', // shadow-md
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#4B5563', // disabled:bg-gray-600
    opacity: 0.7, // disabled:opacity-50 (added for visual feedback)
  },
  buttonText: {
    color: 'white', // text-white
    fontWeight: 'bold', // font-bold
    fontSize: 16,
  },
});
