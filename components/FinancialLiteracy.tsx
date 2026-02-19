import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { getFinancialTip } from '../services/geminiService';
import { Ionicons } from '@expo/vector-icons'; // Using Ionicons for the lightbulb icon

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
        <View style={styles.container}>
            <View style={styles.headerCard}>
                <Text style={styles.headerTitle}>Financial Wellness Hub</Text>
                <Text style={styles.headerSubtitle}>Get quick, actionable tips to improve your financial literacy.</Text>
            </View>

            <View style={styles.tipSectionCard}>
                <View style={styles.categorySelection}>
                    <Text style={styles.categoryLabel}>Choose a topic:</Text>
                    <View style={styles.categoryButtonsContainer}>
                        {/* Render category selection buttons */}
                        {TIP_CATEGORIES.map(category => (
                            <TouchableOpacity
                                key={category}
                                onPress={() => setSelectedCategory(category)}
                                style={[
                                    styles.categoryButton,
                                    selectedCategory === category
                                        ? styles.categoryButtonActive
                                        : styles.categoryButtonInactive
                                ]}
                            >
                                <Text style={[
                                    styles.categoryButtonText,
                                    selectedCategory === category
                                        ? styles.categoryButtonTextActive
                                        : styles.categoryButtonTextInactive
                                ]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Tip display area */}
                <View style={styles.tipDisplayArea}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#10B981" />
                            <Text style={styles.loadingText}>Thinking of a good tip...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorTitle}>Oh no!</Text>
                            <Text style={styles.errorMessage}>{error}</Text>
                        </View>
                    ) : tip ? (
                        <View style={styles.tipContent}>
                            <Ionicons name="bulb-outline" size={32} color="#FBBF24" style={styles.tipIcon} />
                            <Text style={styles.tipText}>{tip}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.newTipButtonContainer}>
                    <TouchableOpacity
                        onPress={fetchTip}
                        disabled={isLoading}
                        style={[
                            styles.newTipButton,
                            isLoading && styles.newTipButtonDisabled
                        ]}
                    >
                        <Text style={styles.newTipButtonText}>
                            {isLoading ? 'Loading...' : 'Get a New Tip'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24, // space-y-6 roughly translated to padding on parent and margins on children
    },
    headerCard: {
        backgroundColor: 'rgba(31, 41, 55, 0.5)', // bg-gray-800/50
        borderRadius: 8, // rounded-lg
        shadowColor: '#000', // shadow-xl
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        padding: 24, // p-6
        alignItems: 'center', // text-center
        marginBottom: 24, // space-y-6
    },
    headerTitle: {
        fontSize: 24, // text-2xl
        fontWeight: 'bold', // font-bold
        color: '#F9FAFB', // text-gray-100
    },
    headerSubtitle: {
        fontSize: 16, // text-md
        color: '#9CA3AF', // text-gray-400
        marginTop: 4, // mt-1
    },
    tipSectionCard: {
        backgroundColor: 'rgba(31, 41, 55, 0.5)', // bg-gray-800/50
        borderRadius: 8, // rounded-lg
        shadowColor: '#000', // shadow-xl
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        padding: 24, // p-6
    },
    categorySelection: {
        marginBottom: 24, // mb-6
    },
    categoryLabel: {
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
        color: '#D1D5DB', // text-gray-300
        marginBottom: 8, // mb-2
    },
    categoryButtonsContainer: {
        flexDirection: 'row', // flex
        flexWrap: 'wrap', // flex-wrap
        gap: 8, // gap-2 (approximate)
    },
    categoryButton: {
        paddingHorizontal: 16, // px-4
        paddingVertical: 8, // py-2
        borderRadius: 9999, // rounded-full
        transitionDuration: 200, // duration-200
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8, // for gap simulation
        marginBottom: 8, // for gap simulation
    },
    categoryButtonActive: {
        backgroundColor: '#059669', // bg-green-600
        shadowColor: '#000', // shadow-md
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    categoryButtonInactive: {
        backgroundColor: '#4B5563', // bg-gray-700
    },
    categoryButtonText: {
        fontSize: 14, // text-sm
        fontWeight: '600', // font-semibold
    },
    categoryButtonTextActive: {
        color: 'white', // text-white
    },
    categoryButtonTextInactive: {
        color: '#D1D5DB', // text-gray-300
    },
    tipDisplayArea: {
        backgroundColor: 'rgba(17, 24, 39, 0.7)', // bg-gray-900/70
        borderRadius: 8, // rounded-lg
        padding: 24, // p-6
        minHeight: 150, // min-h-[150px]
        justifyContent: 'center', // flex flex-col justify-center items-center
        alignItems: 'center',
        borderColor: '#374151', // border border-gray-700
        borderWidth: 1,
        shadowColor: '#000', // shadow-inner (approximation)
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#9CA3AF', // text-gray-400
        marginLeft: 12, // space-x-3 (ActivityIndicator has no fixed width, adjust margin)
    },
    errorContainer: {
        alignItems: 'center', // text-center
    },
    errorTitle: {
        fontWeight: '600', // font-semibold
        color: '#EF4444', // text-red-400
    },
    errorMessage: {
        color: '#EF4444', // text-red-400
        textAlign: 'center',
    },
    tipContent: {
        flexDirection: 'row',
        alignItems: 'flex-start', // items-start
        // space-x-4 (margin on icon)
    },
    tipIcon: {
        marginRight: 16, // space-x-4
        marginTop: 4, // mt-1
    },
    tipText: {
        color: '#E5E7EB', // text-gray-200
        lineHeight: 24, // leading-relaxed (assuming 1.5 * font-size of 16)
        flexShrink: 1,
    },
    newTipButtonContainer: {
        marginTop: 24, // mt-6
        alignItems: 'center', // text-center
    },
    newTipButton: {
        backgroundColor: '#7C3AED', // bg-purple-600
        paddingVertical: 12, // py-3
        paddingHorizontal: 24, // px-6
        borderRadius: 8, // rounded-lg
        shadowColor: '#000', // shadow-md
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
        // transition-transform transform hover:scale-105 (handled by TouchableOpacity feedback)
    },
    newTipButtonDisabled: {
        backgroundColor: '#4B5563', // disabled:bg-gray-600
        // disabled:cursor-not-allowed
    },
    newTipButtonText: {
        color: 'white', // text-white
        fontWeight: 'bold', // font-bold
        fontSize: 16,
    },
});
