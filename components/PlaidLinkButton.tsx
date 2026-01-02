import React, { useCallback, useState } from 'react';

// Plaid is typically loaded from a script tag in index.html.
// This global declaration allows TypeScript to know about the `window.Plaid` object.
// It's kept here for context, even though the implementation is currently a mock.
declare global {
  interface Window {
    Plaid: any;
  }
}

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
    <button
      onClick={handleClick}
      disabled={isConnecting}
      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
    >
      {isConnecting ? 'Connecting...' : 'Connect Your Bank'}
    </button>
  );
};
