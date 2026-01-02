
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { FAST_FOOD_KEYWORDS } from './lib/keywords';

/**
 * Provides a set of sample transactions for initial state or when history is cleared.
 * @returns An array of sample Transaction objects.
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
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
        const storedTransactions = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedTransactions) {
            const parsed = JSON.parse(storedTransactions) as Transaction[];
             if (Array.isArray(parsed) && parsed.length > 0) {
                 return parsed;
            }
        }
    } catch (error) {
        console.error("Error reading transactions from localStorage", error);
    }
    return getSampleTransactions();
  });

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
      try {
          const stored = window.localStorage.getItem(USER_PROFILE_KEY);
          return stored ? JSON.parse(stored) : null;
      } catch (e) { return null; }
  });

  // Manages the selected AI tone.
  const [aiTone, setAiTone] = useState<AiTone>(() => {
    const storedTone = window.localStorage.getItem(AI_TONE_KEY);
    return (storedTone === 'stern' || storedTone === 'encouraging' || storedTone === 'ruthless') ? storedTone : 'encouraging';
  });

  // State for controlling modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Global loading and error states
  const [isLoading, setIsLoading] = useState(false);
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
    try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
        console.error("Error writing to localStorage", error);
    }
  }, [transactions]);
  
  useEffect(() => {
    window.localStorage.setItem(AI_TONE_KEY, aiTone);
  }, [aiTone]);

  useEffect(() => {
      if (userProfile) {
          window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
      }
  }, [userProfile]);


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
    const intervalId = window.setInterval(tick, 5000); 
    return () => window.clearInterval(intervalId);
  }, [transactions, isLoading, callState.isActive, aiTone]);


  // --- Event Handlers ---
  
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
                // We construct a temporary object for the call state to ensure it has the latest status
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
    
    if (callState.audioUrl) {
      URL.revokeObjectURL(callState.audioUrl);
    }
    setCallState({ isActive: false, transaction: null, analysis: null, audioUrl: null });
  }, [callState]);
  
  const openAddPurchaseModal = useCallback(() => setIsModalOpen(true), []);
  const openScannerModal = useCallback(() => setIsScannerOpen(true), []);
  const openSettingsModal = useCallback(() => setIsSettingsModalOpen(true), []);
  const closeSettingsModal = useCallback(() => setIsSettingsModalOpen(false), []);
  
  const handleClearHistory = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all transaction history?')) {
      setTransactions(getSampleTransactions());
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      closeSettingsModal();
    }
  }, [closeSettingsModal]);


  // Filtered Lists
  const returnedTransactions = useMemo(() => transactions.filter(t => t.status === TransactionStatus.Returned), [transactions]);
  const shamefulTransactions = useMemo(() => transactions.filter(t => t.status === TransactionStatus.Kept), [transactions]);
  // Includes pending, approved, flagged, and urges
  const recentTransactions = useMemo(() => transactions.filter(t => t.status !== TransactionStatus.Kept && t.status !== TransactionStatus.Returned), [transactions]);
  const totalSaved = useMemo(() => returnedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0), [returnedTransactions]);

  const monthlySaved = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthlyReturns = returnedTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });
    return monthlyReturns.reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [returnedTransactions]);


  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header 
        onAddPurchase={openAddPurchaseModal} 
        onScanReceipt={openScannerModal}
        onOpenSettings={openSettingsModal}
       />
      <main className="container mx-auto p-4 md:p-6 flex-grow">
        
        {/* Onboarding Modal - Show if no user profile exists */}
        {!userProfile && (
            <OnboardingModal onComplete={(profile) => setUserProfile(profile)} />
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500 mx-auto"></div>
              <p className="text-lg mt-4 font-semibold">{loadingMessage}</p>
            </div>
          </div>
        )}

        {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 overflow-x-auto">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('recent')}
                className={`${
                  activeTab === 'recent'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Journal (Recent & Urges)
              </button>
              <button
                onClick={() => setActiveTab('wins')}
                className={`${
                  activeTab === 'wins'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                Returns
                {returnedTransactions.length > 0 && (
                  <span className="ml-2 bg-blue-800 text-blue-200 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {returnedTransactions.length}
                  </span>
                )}
              </button>
              <button
                 onClick={() => setActiveTab('shameful')}
                 className={`${
                   activeTab === 'shameful'
                     ? 'border-red-500 text-red-400'
                     : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                 } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                Shame
                {shamefulTransactions.length > 0 && (
                  <span className="ml-2 bg-red-800 text-red-200 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {shamefulTransactions.length}
                  </span>
                )}
              </button>
               <button
                 onClick={() => setActiveTab('leaderboard')}
                 className={`${
                   activeTab === 'leaderboard'
                     ? 'border-yellow-500 text-yellow-400'
                     : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                 } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                Leaderboard
              </button>
              <button
                onClick={() => setActiveTab('learn')}
                className={`${
                  activeTab === 'learn'
                    ? 'border-green-500 text-green-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                Learn
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'recent' && <TransactionList title="Activity Journal" transactions={recentTransactions} onQuickAction={handleQuickAction}/>}
        {activeTab === 'shameful' && <TransactionList title="Shameful Purchases" transactions={shamefulTransactions} onStatusToggle={handleStatusToggle} />}
        {activeTab === 'wins' && (
          <div>
            <div className="bg-gray-800/50 rounded-lg shadow-xl p-6 mb-6 text-center">
              <h3 className="text-lg font-semibold text-gray-300">Total Money Saved</h3>
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mt-2">
                ${totalSaved.toFixed(2)}
              </p>
              {returnedTransactions.length > 0 && (
                <p className="text-sm text-gray-400 mt-1">from {returnedTransactions.length} successful return{returnedTransactions.length === 1 ? '' : 's'}.</p>
              )}
            </div>
            <TransactionList title="Return Wins" transactions={returnedTransactions} onStatusToggle={handleStatusToggle} />
          </div>
        )}
        {activeTab === 'leaderboard' && <Leaderboard userOverallSavings={totalSaved} userMonthlySavings={monthlySaved} />}
        {activeTab === 'learn' && <FinancialLiteracy />}
      </main>

      <footer className="w-full py-6 text-center border-t border-gray-800 mt-auto bg-gray-900">
        <p className="text-gray-500 text-sm">Returnley Web Preview</p>
        <p className="text-gray-600 text-xs mt-1">Coming soon to Android</p>
      </footer>

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
    </div>
  );
}
