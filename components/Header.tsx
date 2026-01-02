import React from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { SettingsIcon } from './icons/SettingsIcon';

/**
 * Props for the Header component.
 */
interface HeaderProps {
  /** Function to call when the "Add Manually" button is clicked. */
  onAddPurchase: () => void;
  /** Function to call when the "Scan" button is clicked. */
  onScanReceipt: () => void;
  /** Function to call when the "Settings" icon is clicked. */
  onOpenSettings: () => void;
}

/**
 * The main application header component.
 * Displays the app title and primary action buttons.
 * This is a memoized component to prevent re-renders if props don't change.
 */
export const Header: React.FC<HeaderProps> = React.memo(({ onAddPurchase, onScanReceipt, onOpenSettings }) => {
  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Returnley
        </h1>
        <div className="flex items-center space-x-2">
           <div className="flex items-center space-x-2">
              <button
                onClick={onScanReceipt}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center space-x-2"
              >
                <CameraIcon className="w-5 h-5" />
                <span>Scan</span>
              </button>
               <button
                onClick={onAddPurchase}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
              >
                Add Manually
              </button>
           </div>
          
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Open settings"
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
});
