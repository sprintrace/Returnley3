import React from 'react';

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
    // Modal backdrop
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40" onClick={onClose}>
      {/* Modal content */}
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="space-y-6">
          {/* AI Tone Setting */}
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">AI Tone</h3>
            <p className="text-sm text-gray-400 mb-3">Choose the personality of your financial conscience.</p>
            <div className="bg-gray-700 p-1 rounded-lg flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1">
              <button
                onClick={() => onSetAiTone('encouraging')}
                className={`flex-1 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                  aiTone === 'encouraging' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'
                }`}
              >
                Encouraging
              </button>
              <button
                onClick={() => onSetAiTone('stern')}
                className={`flex-1 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                  aiTone === 'stern' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-600'
                }`}
              >
                Stern
              </button>
              <button
                onClick={() => onSetAiTone('ruthless')}
                className={`flex-1 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                  aiTone === 'ruthless' ? 'bg-red-800 text-white' : 'text-gray-300 hover:bg-gray-600'
                }`}
              >
                Ruthless
              </button>
            </div>
          </div>

          {/* Danger Zone for destructive actions */}
          <div className="border-t border-gray-700 pt-6">
             <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
             <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 flex justify-between items-center">
                <div>
                    <p className="font-semibold text-gray-200">Clear All Transactions</p>
                    <p className="text-sm text-gray-400">This will permanently delete all your data.</p>
                </div>
                <button
                    onClick={onClearHistory}
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-md transition-colors"
                >
                    Clear History
                </button>
             </div>
          </div>
        </div>
         <div className="mt-8 text-right">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md"
            >
              Done
            </button>
          </div>
      </div>
    </div>
  );
};
