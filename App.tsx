import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from './components/Header';
import { TransactionList } from './components/TransactionList';
import { AddPurchaseModal } from './components/AddPurchaseModal';
import { IncomingCall } from './components/IncomingCall';
import { Transaction, TransactionStatus, PurchaseAnalysis, UserProfile } from './types';
import { analyzePurchaseAndGenerateAudio, generateNagAudio, analyzeReceipt } from './services/geminiService';
import { Leaderboard } from './components/Leaderboard';
import { ReceiptScannerModal } from './components/ReceiptScannerModal';
import { FinancialLiteracy } from './components/FinancialLiteracy';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { GoalProgress } from './components/GoalProgress';
import { FAST_FOOD_KEYWORDS } from './lib/keywords';

/**
 * Provides a set of sample transactions for initial state or when history is cleared.
 */
const getSampleTransactions = (): Transaction[] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const returnByDate = new Date(today);
  returnByDate.setDate(returnByDate.getDate() + 20);

  return [
    {
      id: 'sample-1',
      item: 'Vintage Leather Jacket',
      amount: 375.00,
      category: 'Shopping',
      status: TransactionStatus.Returned,
      date: lastWeek.toISOString().split('T')[0],
      isReturnable: true,
      nagCount: 0,
      emotionalContext: 'Neutral / Normal',
      isExample: true,
    },
    {
      id: 'sample-2',
      item: 'Seven-Course Tasting Menu',
      amount: 220.00,
      category: 'Dining & Entertainment',
      status: TransactionStatus.Kept,
      date: fiveDaysAgo.toISOString().split('T')[0],
      isReturnable: false,
      nagCount: 7,
      emotionalContext: 'Celebrating',
      isExample: true,
    },
    {
      id: 'sample-3',
      item: 'Monthly Subway Pass',
      amount: 127.50,
      category: 'Transportation',
      status: TransactionStatus.Approved,
      date: yesterday.toISOString().split('T')[0],
      isReturnable: false,
      nagCount: 0,
      isExample: true,
    },
    {
      id: 'sample-4',
      item: 'Professional-Grade Camera Lens',
      amount: 1250.00,
      category: 'Shopping',
      status: TransactionStatus.Flagged,
      date: yesterday.toISOString().split('T')[0],
      isReturnable: true,
      returnBy: returnByDate.toISOString().split('T')[0],
      nagCount: 2,
      emotionalContext: 'Excited',
      isExample: true,
    },
    {
      id: 'sample-5',
      item: 'Concert Tickets (Front Row)',
      amount: 450.00,
      category: 'Dining & Entertainment',
      status: TransactionStatus.Pending,
      date: today.toISOString().split('T')[0],
      isReturnable: true,
      nagCount: 0,
      emotionalContext: 'Peer Pressured',
      isExample: true,
    }
  ];
};

/**
 * Represents the state of the simulated incoming call modal.
 */
interface CallState {
  isActive: boolean;
  transaction: Transaction | null;
  analysis: PurchaseAnalysis | null;
  audioUrl: string | null;
}

// --- Constants ---
const MAX_NAGS = 7; // Maximum number of follow-up calls for a single item.
const NAG_INTERVAL_MS = 20000; // 20 seconds between nag attempts for demo purposes.
const LOCAL_STORAGE_KEY = 'returnley-transactions';
const AI_TONE_KEY = 'returnley-ai-tone';
const USER_PROFILE_KEY = 'returnley-user-profile';

/** The available AI personalities for generating call scripts. */
type AiTone = 'encouraging' | 'stern' | 'ruthless';

/**
 * The main application component. Manages all application state and renders UI components.
 */
export default function App() {
  // --- State Management ---

  // Manages the list of all transactions.
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Manages the selected AI tone.
  const [aiTone, setAiTone] = useState<AiTone>('encouraging');

  // State for controlling modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Global loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Returnley is thinking...');
  const [error, setError] = useState<string | null>(null);

  // Manages the state of the "Incoming Call" feature.
  const [callState, setCallState] = useState<CallState>({ isActive: false, transaction: null, analysis: null, audioUrl: null });

  // Manages the currently active tab in the main UI.
  const [activeTab, setActiveTab] = useState<'recent' | 'shameful' | 'wins' | 'leaderboard' | 'learn'>('recent');
  
  // Holds data extracted from a receipt scan.
  const [prefilledData, setPrefilledData] = useState<Partial<Transaction> | null>(null);


  // --- Side Effects (useEffect) ---

  useEffect(() => {
    async function loadData() {
      try {
        const storedTransactions = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedTransactions) {
          const parsed = JSON.parse(storedTransactions) as Transaction[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTransactions(parsed);
          }
        } else {
          setTransactions(getSampleTransactions());
        }

        const storedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (storedProfile) {
          setUserProfile(JSON.parse(storedProfile));
        }

        const storedTone = await AsyncStorage.getItem(AI_TONE_KEY);
        if (storedTone) {
          setAiTone(storedTone as AiTone);
        }
      } catch (error) {
        console.error("Error loading data from AsyncStorage", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function saveData() {
      try {
        await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
        if (userProfile) {
          await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
        }
        await AsyncStorage.setItem(AI_TONE_KEY, aiTone);
      } catch (error) {
        console.error("Error saving data to AsyncStorage", error);
      }
    }
    saveData();
  }, [transactions, userProfile, aiTone]);

  const updateTransactionStatus = useCallback((id: string, status: TransactionStatus) => {
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updatedTransaction = { ...t, status };
          if (status === TransactionStatus.Returned || status === TransactionStatus.Kept) {
            delete updatedTransaction.nextNagTimestamp;
            delete updatedTransaction.error;
          }
          return updatedTransaction;
        }
        return t;
      })
    );
  }, []);

  // Persistent nagging effect
  useEffect(() => {
    const handleNag = async (transaction: Transaction) => {
        setIsLoading(true);
        setLoadingMessage('Preparing follow-up...');
        setTransactions(prev => prev.map(t => t.id === transaction.id ? { ...t, error: undefined } : t));

        try {
          const result = await generateNagAudio(transaction.item, transaction.amount, transaction.category, transaction.nagCount, aiTone);
          const nagAnalysis: PurchaseAnalysis = {
            isNecessary: false,
            reasoning: `This is follow-up #${transaction.nagCount + 1} about the ${transaction.item}.`,
            callScript: result.nagScript,
          };
          setCallState({
            isActive: true,
            transaction,
            analysis: nagAnalysis,
            audioUrl: result.audioUrl,
          });
        } catch (err) {
          console.error(err);
          setTransactions(prev => prev.map(t =>
            t.id === transaction.id ? { ...t, error: 'Failed to generate follow-up call.' } : t
          ));
        } finally {
          setIsLoading(false);
        }
    };
      
    const tick = () => {
      if (isLoading || callState.isActive) return;

      const now = Date.now();
      const transactionToNag = transactions.find(
        t => t.nextNagTimestamp && now >= t.nextNagTimestamp
      );

      if (transactionToNag) {
        setTransactions(prev =>
          prev.map(t => t.id === transactionToNag.id ? { ...t, nextNagTimestamp: undefined } : t)
        );
        handleNag(transactionToNag);
      }
    };
    const intervalId = setInterval(tick, 5000); 
    return () => clearInterval(intervalId);
  }, [transactions, isLoading, callState.isActive, aiTone]);


  // --- Event Handlers ---
  
  const handleDebugReset = useCallback(() => {
    // Instant reset for dev/debugging speed
    // 1. Clear User Profile (Triggers Onboarding)
    setUserProfile(null);
    if (Platform.OS === 'web') {
        window.localStorage.removeItem(USER_PROFILE_KEY);
    } else {
        AsyncStorage.removeItem(USER_PROFILE_KEY);
    }
    
    // 2. Reset Transactions to Sample Data
    setTransactions(getSampleTransactions());
    if (Platform.OS === 'web') {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    } else {
        AsyncStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    
    // 3. Reset AI Tone
    setAiTone('encouraging');
    if (Platform.OS === 'web') {
        window.localStorage.removeItem(AI_TONE_KEY);
    } else {
        AsyncStorage.removeItem(AI_TONE_KEY);
    }

    // 4. Reset View
    setActiveTab('recent');
    console.log("App reset to initial state.");
  }, []);

  const isFastFoodPurchase = (item: string, category: string): boolean => {
    if (category === 'Fast Food') {
      return true;
    }
    const lowerCaseItem = item.toLowerCase();
    return FAST_FOOD_KEYWORDS.some(keyword => lowerCaseItem.includes(keyword));
  };


  const handleAddPurchase = async (
      item: string, 
      amount: number, 
      category: string, 
      isReturnable: boolean, 
      returnBy?: string, 
      justification?: string,
      emotionalContext?: string,
      isUrge?: boolean
    ) => {
    setIsModalOpen(false);
    setPrefilledData(null);

    // If it's Fast Food and NOT an Urge, immediate shame.
    if (isFastFoodPurchase(item, category) && !isReturnable && !isUrge) {
      const shamefulTransaction: Transaction = {
        id: Date.now().toString(),
        item,
        amount,
        category: 'Fast Food',
        status: TransactionStatus.Kept,
        date: new Date().toISOString().split('T')[0],
        isReturnable: false,
        nagCount: MAX_NAGS,
        justification,
        emotionalContext
      };
      setTransactions(prev => [shamefulTransaction, ...prev]);
      return;
    }

    setIsLoading(true);
    setLoadingMessage(isUrge ? 'Analyzing your urge...' : 'Returnley is thinking...');
    setError(null);

    try {
      const result = await analyzePurchaseAndGenerateAudio(
          item, 
          amount, 
          category, 
          isReturnable, 
          returnBy, 
          justification, 
          aiTone, 
          userProfile || undefined, // Pass user profile
          emotionalContext,
          isUrge
        );
      
      let status = TransactionStatus.Pending;
      if (isUrge) {
          status = TransactionStatus.Urge;
      } else if (result.analysis.isNecessary) {
          status = TransactionStatus.Approved;
      }

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        item,
        amount,
        category,
        status: status,
        date: new Date().toISOString().split('T')[0],
        isReturnable: isReturnable,
        returnBy: result.analysis.estimatedReturnBy || returnBy,
        justification,
        nagCount: 0,
        emotionalContext: emotionalContext,
        hotTake: result.analysis.hotTake // Store the hot take if it exists
      };

      setTransactions(prev => [newTransaction, ...prev]);

      // Only trigger the call if it's Unnecessary AND NOT an Urge.
      if (!result.analysis.isNecessary && !isUrge) {
        setCallState({
          isActive: true,
          transaction: newTransaction,
          analysis: result.analysis,
          audioUrl: result.audioUrl,
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze purchase. Flagged for manual review.');
      const failedTransaction: Transaction = {
        id: Date.now().toString(),
        item,
        amount,
        category,
        status: isUrge ? TransactionStatus.Urge : TransactionStatus.Flagged,
        date: new Date().toISOString().split('T')[0],
        isReturnable: isReturnable,
        returnBy,
        justification,
        nagCount: 0,
        emotionalContext,
        error: 'Analysis failed.'
      };
      setTransactions(prev => [failedTransaction, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReceiptScanConfirm = async (imageData: string) => {
    setIsScannerOpen(false);
    setIsLoading(true);
    setLoadingMessage('Returnley is analyzing...');
    setError(null);
    try {
      const result = await analyzeReceipt(imageData);
      setPrefilledData({
        item: result.item,
        amount: result.amount,
        category: result.category,
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      setError('Could not read the receipt. Please enter the details manually.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleQuickAction = useCallback(async (transactionId: string, decision: 'return' | 'keep' | 'buy') => {
    if (decision === 'return') {
        updateTransactionStatus(transactionId, TransactionStatus.Returned);
    } else if (decision === 'keep') {
        updateTransactionStatus(transactionId, TransactionStatus.Kept);
    } else if (decision === 'buy') {
        // "Buy" action for Urges: Promotes Urge to Real Purchase and triggers analysis/call.
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        // 1. Check Fast Food Trap logic (Immediate Shame)
        if (isFastFoodPurchase(transaction.item, transaction.category) && !transaction.isReturnable) {
             setTransactions(prev => prev.map(t => {
                 if (t.id === transactionId) {
                     return {
                         ...t,
                         status: TransactionStatus.Kept,
                         nagCount: MAX_NAGS, // Max shame
                         hotTake: undefined
                     };
                 }
                 return t;
             }));
             return; // Stop here, no call.
        }

        // 2. Full AI Analysis (as if it's a new purchase)
        setIsLoading(true);
        setLoadingMessage('Analyzing your purchase...');
        setError(null);

        try {
            const result = await analyzePurchaseAndGenerateAudio(
                transaction.item,
                transaction.amount,
                transaction.category,
                transaction.isReturnable,
                transaction.returnBy,
                transaction.justification,
                aiTone,
                userProfile || undefined,
                transaction.emotionalContext,
                false // isUrge is FALSE now
            );

            let newStatus = TransactionStatus.Pending;
            if (result.analysis.isNecessary) {
                newStatus = TransactionStatus.Approved;
            }

            // Update the transaction in the list
            setTransactions(prev => prev.map(t => {
                if (t.id === transactionId) {
                    return {
                        ...t,
                        status: newStatus,
                        hotTake: undefined, // Remove the hot take
                        // Update returnBy if the AI estimated one
                        returnBy: result.analysis.estimatedReturnBy || t.returnBy
                    };
                }
                return t;
            }));

            // Trigger the call if unnecessary
            if (!result.analysis.isNecessary) {
                setCallState({
                    isActive: true,
                    transaction: { ...transaction, status: newStatus },
                    analysis: result.analysis,
                    audioUrl: result.audioUrl,
                });
            }

        } catch (err) {
            console.error(err);
            setError('Failed to analyze purchase.');
            // Move to flagged if analysis fails
            updateTransactionStatus(transactionId, TransactionStatus.Flagged);
        } finally {
            setIsLoading(false);
        }
    }
  }, [transactions, updateTransactionStatus, aiTone, userProfile]);
  
  const handleStatusToggle = useCallback((transactionId: string) => {
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === transactionId) {
          if (t.status === TransactionStatus.Kept) {
            return { ...t, status: TransactionStatus.Returned };
          }
          if (t.status === TransactionStatus.Returned) {
            return { ...t, status: TransactionStatus.Kept };
          }
        }
        return t;
      })
    );
  }, []);

  const handleCallResolve = useCallback((decision: 'return' | 'keep') => {
    if (!callState.transaction) return;
    const { id, amount, isReturnable } = callState.transaction;

    setTransactions(prev => prev.map(t => {
      if (t.id !== id) return t;

      let newStatus = t.status;
      let newNagCount = t.nagCount;
      let newTimestamp = t.nextNagTimestamp;

      if (decision === 'return') {
        newStatus = TransactionStatus.Returned;
        newTimestamp = undefined;
      } else { 
        newStatus = TransactionStatus.Flagged;
        const isFirstTimeFlagged = t.nagCount === 0;

        if (amount > 250 && isReturnable) {
            if (isFirstTimeFlagged) {
                newNagCount = 1;
                newTimestamp = Date.now() + NAG_INTERVAL_MS;
            } else {
                newNagCount = t.nagCount + 1;
                if (newNagCount >= MAX_NAGS) {
                    newStatus = TransactionStatus.Kept;
                    newTimestamp = undefined;
                } else {
                    newTimestamp = Date.now() + NAG_INTERVAL_MS;
                }
            }
        }
      }
      return { ...t, status: newStatus, nagCount: newNagCount, nextNagTimestamp: newTimestamp };
    }));
    
    // No need for URL.revokeObjectURL
    setCallState({ isActive: false, transaction: null, analysis: null, audioUrl: null });
  }, [callState]);
  
  const handleUpdateGoal = useCallback((name: string, amount: number) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, savingsGoal: name, goalAmount: amount });
    }
  }, [userProfile]);
  
  const openAddPurchaseModal = useCallback(() => setIsModalOpen(true), []);
  const openScannerModal = useCallback(() => setIsScannerOpen(true), []);
  const openSettingsModal = useCallback(() => setIsSettingsModalOpen(true), []);
  const closeSettingsModal = useCallback(() => setIsSettingsModalOpen(false), []);
  
  const handleClearHistory = useCallback(() => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all transaction history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setTransactions(getSampleTransactions());
            try {
              if (Platform.OS === 'web') {
                window.localStorage.removeItem(LOCAL_STORAGE_KEY);
              } else {
                AsyncStorage.removeItem(LOCAL_STORAGE_KEY);
              }
            } catch (error) {
              console.error("Error clearing history from AsyncStorage", error);
            }
            closeSettingsModal();
          },
        },
      ]
    );
  }, [closeSettingsModal]);


  // Filtered Lists ("Demo" Mode)

  // A flag to determine if the user has any real transactions.
  const hasRealTransactions = useMemo(() => transactions.some(t => !t.isExample), [transactions]);

  // The master list of transactions to display. If the user has read transactions, we show those.
  // Otherwise we show the sample transactions.
  const displayedTransactions = useMemo(() => {
    return hasRealTransactions ? transactions.filter(t => !t.isExample) : transactions;
  }, [transactions, hasRealTransactions]);

  // Derived lists of different tabs, based on the master displayedTransactions list/
  const returnedTransactions = useMemo(() => displayedTransactions.filter(t => t.status === TransactionStatus.Returned), [displayedTransactions]);
  const shamefulTransactions = useMemo(() => displayedTransactions.filter(t => t.status === TransactionStatus.Kept), [displayedTransactions]);
  const recentTransactions = useMemo(() => displayedTransactions.filter(t => t.status !== TransactionStatus.Kept && t.status !== TransactionStatus.Returned), [displayedTransactions]);

  // For stat calculations (like Total Saved), we ALWAYS filter out examples.
  const realReturnedTransactionsForStats = useMemo(() => transactions.filter(t => t.status === TransactionStatus.Returned && !t.isExample), [transactions]);
  const realShamefulTransactionsForStats = useMemo(() => transactions.filter(t => t.status === TransactionStatus.Kept && !t.isExample), [transactions]);

  const totalSaved = useMemo(() => realReturnedTransactionsForStats.reduce((sum, transaction) => sum + transaction.amount, 0), [realReturnedTransactionsForStats]);

  // For displayed Total Money Saved, we include examples ONLY if there are no real transactions.
  const displayedTotalSaved = useMemo(() => {
    return hasRealTransactions
      ? totalSaved // Use real total if real transactions exist
      : transactions.filter(t => t.status === TransactionStatus.Returned && t.isExample).reduce((sum, transaction) => sum + transaction.amount, 0); // Use example total if only examples
  }, [hasRealTransactions, transactions, totalSaved]);


  const monthlySaved = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthlyReturns = realReturnedTransactionsForStats.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });
    return monthlyReturns.reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [realReturnedTransactionsForStats]);

  // For badge counts, we include examples ONLY if there are no real transactions.
  const displayedReturnedTransactionsForBadges = useMemo(() => {
    return hasRealTransactions
      ? realReturnedTransactionsForStats
      : transactions.filter(t => t.status === TransactionStatus.Returned && t.isExample);
  }, [hasRealTransactions, transactions, realReturnedTransactionsForStats]);

  const displayedShamefulTransactionsForBadges = useMemo(() => {
    return hasRealTransactions
      ? realShamefulTransactionsForStats
      : transactions.filter(t => t.status === TransactionStatus.Kept && t.isExample);
  }, [hasRealTransactions, transactions, realShamefulTransactionsForStats]);

  // Calculate the amount allocated to the goal (40% of returns)
  const goalSaved = useMemo(() => totalSaved * 0.40, [totalSaved]);


  // --- Render ---
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        {/* Top Title */}
        <View style={styles.topTitleContainer}>
          <Text style={styles.topTitleText}>Returnley</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.mainContainer}>
            
            {/* Onboarding Modal - Show if no user profile exists */}
            {!userProfile && (
                <OnboardingModal onComplete={(profile) => setUserProfile(profile)} />
            )}

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#A78BFA" />
                <Text style={styles.loadingMessage}>{loadingMessage}</Text>
              </View>
            )}

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Error: </Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                </View>
            )}

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabNav}>
                  <TouchableOpacity
                    onPress={() => setActiveTab('recent')}
                    style={[styles.tabButton, activeTab === 'recent' && styles.tabButtonActive]}
                  >
                    <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>Journal (Recent & Urges)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setActiveTab('wins')}
                    style={[styles.tabButton, activeTab === 'wins' && styles.tabButtonActiveWins]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.tabText, activeTab === 'wins' && styles.tabTextActiveWins]}>
                        Returns
                      </Text>
                      {displayedReturnedTransactionsForBadges.length > 0 && (
                        <View style={styles.badgeContainer}>
                          <Text style={styles.badgeText}>{displayedReturnedTransactionsForBadges.length}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setActiveTab('shameful')}
                    style={[styles.tabButton, activeTab === 'shameful' && styles.tabButtonActiveShame]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.tabText, activeTab === 'shameful' && styles.tabTextActiveShame]}>
                        Shame
                      </Text>
                      {displayedShamefulTransactionsForBadges.length > 0 && (
                        <View style={styles.badgeContainerShame}>
                          <Text style={styles.badgeText}>{displayedShamefulTransactionsForBadges.length}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setActiveTab('leaderboard')}
                    style={[styles.tabButton, activeTab === 'leaderboard' && styles.tabButtonActiveLeaderboard]}
                  >
                    <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActiveLeaderboard]}>
                      Leaderboard
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setActiveTab('learn')}
                    style={[styles.tabButton, activeTab === 'learn' && styles.tabButtonActiveLearn]}
                  >
                    <Text style={[styles.tabText, activeTab === 'learn' && styles.tabTextActiveLearn]}>
                      Learn
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
            </View>

            {activeTab === 'recent' && <TransactionList title="Activity Journal" transactions={recentTransactions} onQuickAction={handleQuickAction}/>}
            {activeTab === 'shameful' && <TransactionList title="Shameful Purchases" transactions={shamefulTransactions} onStatusToggle={handleStatusToggle} />}
            {activeTab === 'wins' && (
              <View>
                <View style={styles.totalSavedCard}>
                  <Text style={styles.totalSavedTitle}>Total Money Saved</Text>
                  <Text style={styles.totalSavedAmount}>
                    ${displayedTotalSaved.toFixed(2)}
                  </Text>
                  {returnedTransactions.length > 0 && (
                    <Text style={styles.totalSavedSubtitle}>from {returnedTransactions.length} successful return{returnedTransactions.length === 1 ? '' : 's'}.</Text>
                  )}
                </View>
                 <GoalProgress 
                   currentSaved={goalSaved}
                   totalReturned={totalSaved} 
                   goalName={userProfile?.savingsGoal || 'General Savings'} 
                   goalAmount={userProfile?.goalAmount || 1000}
                   onUpdateGoal={handleUpdateGoal}
                />
                <TransactionList title="Return Wins" transactions={returnedTransactions} onStatusToggle={handleStatusToggle} />
              </View>
            )}
            {activeTab === 'leaderboard' && <Leaderboard userOverallSavings={totalSaved} userMonthlySavings={monthlySaved} />}
            {activeTab === 'learn' && <FinancialLiteracy />}
          </View>
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNavBar}>
          <TouchableOpacity
            onPress={openScannerModal}
            style={styles.bottomNavButton}
          >
            <Ionicons name="camera-outline" size={24} color="white" />
            <Text style={styles.bottomNavButtonText}>Scan Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openAddPurchaseModal}
            style={styles.bottomNavButton}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text style={styles.bottomNavButtonText}>Add Manually</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openSettingsModal}
            style={styles.bottomNavButton}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
            <Text style={styles.bottomNavButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {isScannerOpen && (
          <ReceiptScannerModal
            onClose={() => setIsScannerOpen(false)}
            onConfirm={handleReceiptScanConfirm}
          />
        )}

        {isModalOpen && (
          <AddPurchaseModal
            onClose={() => {
              setIsModalOpen(false);
              setPrefilledData(null);
            }}
            onSubmit={handleAddPurchase}
            initialData={prefilledData}
          />
        )}
        
        {isSettingsModalOpen && (
          <SettingsModal
            onClose={closeSettingsModal}
            aiTone={aiTone}
            onSetAiTone={setAiTone}
            onClearHistory={handleClearHistory}
          />
        )}

        {callState.isActive && callState.transaction && callState.analysis && callState.audioUrl && (
          <IncomingCall
            transaction={callState.transaction}
            analysis={callState.analysis}
            audioUrl={callState.audioUrl}
            onResolve={handleCallResolve}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    flexDirection: 'column', // Stack children vertically
    backgroundColor: '#111827', // bg-gray-900
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  scrollView: {
    flex: 1, // Take up all available vertical space
  },
  mainContainer: {
    padding: 16, // p-4 md:p-6
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingMessage: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(127, 29, 29, 0.4)', // bg-red-900
    borderColor: '#DC2626', // border-red-700
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#FECACA', // text-red-200
    fontWeight: 'bold',
  },
  errorMessage: {
    color: '#FECACA',
  },
  tabContainer: {
    marginBottom: 24, // mb-6
  },
  tabNav: {
    borderBottomWidth: 1,
    borderColor: '#374151', // border-gray-700
    // flex space-x-6 (marginRight on buttons)
  },
  tabButton: {
    paddingVertical: 12, // py-3
    paddingHorizontal: 4, // px-1
    borderBottomWidth: 2, // border-b-2
    borderColor: 'transparent',
    marginRight: 24, // space-x-6
  },
  tabButtonActive: {
    borderColor: '#A78BFA', // border-purple-500
  },
  tabButtonActiveWins: {
    borderColor: '#60A5FA', // border-blue-500
  },
  tabButtonActiveShame: {
    borderColor: '#F87171', // border-red-500
  },
  tabButtonActiveLeaderboard: {
    borderColor: '#FBBF24', // border-yellow-500
  },
  tabButtonActiveLearn: {
    borderColor: '#34D399', // border-green-500
  },
  tabText: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
    color: '#9CA3AF', // text-gray-400
  },
  tabTextActive: {
    color: '#A78BFA', // text-purple-400
  },
  tabTextActiveWins: {
    color: '#60A5FA', // text-blue-400
  },
  tabTextActiveShame: {
    color: '#F87171', // text-red-400
  },
  tabTextActiveLeaderboard: {
    color: '#FBBF24', // text-yellow-400
  },
  tabTextActiveLearn: {
    color: '#34D399', // text-green-400
  },
  badgeContainer: {
    marginLeft: 8, // ml-2
    backgroundColor: '#1E40AF', // bg-blue-800
    width: 20, // w-5
    height: 20, // h-5
    borderRadius: 10, // rounded-full
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainerShame: {
    marginLeft: 8,
    backgroundColor: '#991B1B', // bg-red-800
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#DBEAFE', // text-blue-200
    fontSize: 10, // text-xs
    fontWeight: 'bold', // font-bold
  },
  totalSavedCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)', // bg-gray-800/50
    borderRadius: 8, // rounded-lg
    padding: 24, // p-6
    marginBottom: 24, // mb-6
    alignItems: 'center', // text-center
  },
  totalSavedTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#D1D5DB', // text-gray-300
  },
  totalSavedAmount: {
    fontSize: 36, // text-4xl
    fontWeight: 'bold', // font-bold
    // text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 (approximated with a solid color)
    color: '#34D399', // green-400
    marginTop: 8, // mt-2
  },
  totalSavedSubtitle: {
    fontSize: 14, // text-sm
    color: '#9CA3AF', // text-gray-400
    marginTop: 4, // mt-1
  },
  topTitleContainer: {
    backgroundColor: '#1F2937', // bg-gray-800
    paddingVertical: 16, // py-4
    alignItems: 'center', // Center title horizontally
    shadowColor: '#000', // shadow-lg
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  topTitleText: {
    fontSize: 28, // Larger font size for main title
    fontWeight: 'bold',
    color: '#A78BFA', // Purple color
  },
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1F2937', // bg-gray-800
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#374151', // border-gray-700
    shadowColor: '#000', // shadow-lg
    shadowOffset: { width: 0, height: -2 }, // Shadow at the top
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomNavButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  bottomNavButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
});