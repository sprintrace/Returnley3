import React, { useState, useCallback, useEffect } from 'react';
import { getFinancialTip } from '../services/geminiService';
import { LightbulbIcon } from './icons/LightbulbIcon';

const TIP_CATEGORIES = ['Saving', 'Budgeting', 'Investing', 'Debt Management'];

/**
 * A component that provides a "Financial Wellness Hub".
 * Users can select a financial topic and get a quick, AI-generated tip.
 */
export const FinancialLiteracy: React.FC = () => {
    // State to store the current tip, selected category, loading status, and any errors.
    const [tip, setTip] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState(TIP_CATEGORIES[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetches a new financial tip from the Gemini service based on the selected category.
     * Wrapped in `useCallback` to ensure the function reference is stable unless `selectedCategory` changes.
     */
    const fetchTip = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const newTip = await getFinancialTip(selectedCategory);
            setTip(newTip);
        } catch (err) {
            console.error(err);
            setError('Could not fetch a tip. The AI might be busy. Please try again.');
            setTip(null); // Clear any previous tip if an error occurs.
        } finally {
            setIsLoading(false);
        }
    }, [selectedCategory]);

    /**
     * Effect to fetch a tip when the component first loads.
     * The empty dependency array `[]` ensures this runs only once on mount.
     */
    useEffect(() => {
        fetchTip();
    }, []); // Note: `fetchTip` is not in the dependency array because it's stable due to `useCallback`.
             // However, modern linting rules might suggest adding it, which is also safe.

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg shadow-xl p-6 text-center">
                <h2 className="text-2xl font-bold text-gray-100">Financial Wellness Hub</h2>
                <p className="text-md text-gray-400 mt-1">Get quick, actionable tips to improve your financial literacy.</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg shadow-xl p-6">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Choose a topic:</label>
                    <div className="flex flex-wrap gap-2">
                        {/* Render category selection buttons */}
                        {TIP_CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                                    selectedCategory === category
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tip display area */}
                <div className="bg-gray-900/70 rounded-lg p-6 min-h-[150px] flex flex-col justify-center items-center border border-gray-700 shadow-inner">
                    {isLoading ? (
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-green-500"></div>
                            <span className="text-gray-400">Thinking of a good tip...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-400">
                            <p className="font-semibold">Oh no!</p>
                            <p>{error}</p>
                        </div>
                    ) : tip ? (
                        <div className="flex items-start space-x-4">
                            <LightbulbIcon className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
                            <p className="text-gray-200 leading-relaxed">{tip}</p>
                        </div>
                    ) : null}
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={fetchTip}
                        disabled={isLoading}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105"
                    >
                        {isLoading ? 'Loading...' : 'Get a New Tip'}
                    </button>
                </div>
            </div>
        </div>
    );
};
