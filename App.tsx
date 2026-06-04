import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

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

import { 
  MAX_NAGS, 
  LOCAL_STORAGE_KEY, 
  AI_TONE_KEY, 
  USER_PROFILE_KEY, 
  AiTone, 
} from './lib/constants';
import { isConsumablePurchase, isShamefulConsumable } from './lib/utils';
import { styles } from './App.styles';

// Configure notifications to show alerts even when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface CallState {
  isActive: boolean;
  transaction: Transaction | null;
  analysis: PurchaseAnalysis | null;
  audioUrl: string | null;
}

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [aiTone, setAiTone] = useState<AiTone>('encouraging');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Returnley is thinking...');
  const [error, setError] = useState<string | null>(null);
  const [callState, setCallState] = useState<CallState>({ isActive: false, transaction: null, analysis: null, audioUrl: null });
  const [activeTab, setActiveTab] = useState<'recent' | 'shameful' | 'wins' | 'leaderboard' | 'learn'>('recent');
  const [prefilledData, setPrefilledData] = useState<Partial<Transaction> | null>(null);

  // --- Persistence & Initialization ---

  useEffect(() => {
    async function requestPermissions() {
      if (Device.isDevice) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') console.warn('Notification permission not granted');
      }
    }
    requestPermissions();

    async function loadData() {
      try {
        const [storedTx, storedProfile, storedTone] = await Promise.all([
          AsyncStorage.getItem(LOCAL_STORAGE_KEY),
          AsyncStorage.getItem(USER_PROFILE_KEY),
          AsyncStorage.getItem(AI_TONE_KEY),
        ]);

        if (storedTx) setTransactions(JSON.parse(storedTx));
        else setTransactions([]);

        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          setUserProfile({ ...parsed, minCallAmount: parsed.minCallAmount ?? 20, nagFrequency: parsed.nagFrequency ?? 2 });
        }
        if (storedTone) setAiTone(storedTone as AiTone);
      } catch (e) { console.error("Load failed", e); }
      finally { setIsLoading(false); }
    }
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
        if (userProfile) await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
        await AsyncStorage.setItem(AI_TONE_KEY, aiTone);
      } catch (e) { console.error("Save failed", e); }
    };
    if (!isLoading) saveData();
  }, [transactions, userProfile, aiTone, isLoading]);

  // --- Logic Handlers ---

  const updateTransactionStatus = useCallback((id: string, status: TransactionStatus) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }, []);

  const handleNag = useCallback(async (transaction: Transaction) => {
      if (transaction.status === TransactionStatus.Returned || transaction.status === TransactionStatus.Kept) return;

      setIsLoading(true);
      setLoadingMessage('Preparing follow-up...');
      try {
        const result = await generateNagAudio(transaction.item, transaction.amount, transaction.category, transaction.nagCount, aiTone);
        setCallState({ isActive: true, transaction, analysis: { isNecessary: false, reasoning: `Follow-up #${transaction.nagCount + 1}`, callScript: result.nagScript }, audioUrl: result.audioUrl });
        await Notifications.dismissAllNotificationsAsync();
      } catch (err) {
        setTransactions(prev => prev.map(t => t.id === transaction.id ? { ...t, error: 'Failed to generate follow-up call.' } : t));
      } finally { setIsLoading(false); }
  }, [aiTone]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      const transactionId = data?.transactionId as string | undefined;
      const type = data?.type as string | undefined;

      if (transactionId) {
        const tx = transactions.find(t => t.id === transactionId);
        if (tx && type && ['nag', 'initial_nag_backup', 'urge_purchase_nag_backup'].includes(type)) {
          handleNag(tx);
        }
      }
    });
    return () => sub.remove();
  }, [transactions, handleNag]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isLoading || callState.isActive) return;
      const now = Date.now();
      const tx = transactions.find(t => t.nextNagTimestamp && now >= t.nextNagTimestamp);
      if (tx) {
        setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, nextNagTimestamp: undefined } : t));
        handleNag(tx);
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [transactions, isLoading, callState.isActive, handleNag]);

  const scheduleNotification = useCallback(async (title: string, body: string, triggerTime: number, data: any = {}) => {
    try {
      const delay = Math.max(1, (triggerTime - Date.now()) / 1000);
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data, sound: true, priority: Notifications.AndroidNotificationPriority.HIGH },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.floor(delay) },
      });
    } catch (err) { console.error('Schedule failed', err); }
  }, []);

  const handleAddPurchase = async (item: string, amount: number, category: string, isReturnable: boolean, returnBy?: string, justification?: string, emotionalContext?: string, isUrge?: boolean) => {
    setIsModalOpen(false);
    setPrefilledData(null);
    if (!item || !category) return setError('Missing item or category.');

    if (isShamefulConsumable(item, category) && !isReturnable && !isUrge) {
      return setTransactions(prev => [{ id: Date.now().toString(), item, amount, category, status: TransactionStatus.Kept, date: new Date().toISOString().split('T')[0], isReturnable: false, nagCount: MAX_NAGS, justification, emotionalContext }, ...prev]);
    }

    setIsLoading(true);
    setLoadingMessage(isUrge ? 'Analyzing your urge...' : 'Returnley is thinking...');
    setError(null);

    try {
      const { analysis, audioUrl } = await analyzePurchaseAndGenerateAudio(item, amount, category, isReturnable, returnBy, justification, aiTone, userProfile || undefined, emotionalContext, !!isUrge);

      console.log('Gemini Analysis:', JSON.stringify(analysis, null, 2));
      console.log('Audio URL Generated:', !!audioUrl);

      const isFlagged = !analysis.isNecessary;
      const isBelowThreshold = userProfile ? amount < userProfile.minCallAmount : false;
      const shouldCall = isFlagged && !isUrge && !isBelowThreshold;

      let nextNagTimestamp: number | undefined;
      if (shouldCall && isReturnable) {
          nextNagTimestamp = Date.now() + 60000;
      }

      const status = isUrge 
        ? TransactionStatus.Urge 
        : (isFlagged && !isBelowThreshold ? TransactionStatus.Pending : TransactionStatus.Approved);

      const newTx: Transaction = { 
        id: Date.now().toString(), 
        item, 
        amount, 
        category, 
        status, 
        date: new Date().toISOString().split('T')[0], 
        isReturnable, 
        returnBy: analysis.estimatedReturnBy || returnBy, 
        justification, 
        nagCount: 0, 
        nextNagTimestamp, 
        emotionalContext, 
        hotTake: analysis.hotTake 
      };

      setTransactions(prev => [newTx, ...prev]);

      console.log('Should trigger call overlay:', shouldCall);

      if (shouldCall) {
        setCallState({ isActive: true, transaction: newTx, analysis, audioUrl });
        if (nextNagTimestamp) scheduleNotification("Returnley Calling...", `I'm waiting for your answer about that ${item}.`, nextNagTimestamp, { transactionId: newTx.id, type: 'initial_nag_backup' });
      }
    } catch (err) {
      setError('Analysis failed. Flagged for review.');
      setTransactions(prev => [{ id: Date.now().toString(), item, amount, category, status: isUrge ? TransactionStatus.Urge : TransactionStatus.Flagged, date: new Date().toISOString().split('T')[0], isReturnable, returnBy, justification, nagCount: 0, emotionalContext, error: 'Analysis failed.' }, ...prev]);
    } finally { setIsLoading(false); }
  };

  const handleCallResolve = useCallback(async (decision: 'return' | 'keep') => {
    if (!callState.transaction) return;
    const { id, item, amount, isReturnable, returnBy } = callState.transaction;
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.cancelAllScheduledNotificationsAsync();

    let nextTimestamp: number | undefined;
    setTransactions(prev => prev.map(t => {
      if (t.id !== id) return t;
      let newStatus = decision === 'return' ? TransactionStatus.Returned : TransactionStatus.Flagged;
      let newNagCount = t.nagCount;
      if (decision === 'keep' && amount >= (userProfile?.minCallAmount ?? 0) && isReturnable && (userProfile?.nagFrequency ?? 0) > 0) {
          newNagCount = t.nagCount + 1;
          if (newNagCount >= MAX_NAGS) newStatus = TransactionStatus.Kept;
          else nextTimestamp = Date.now() + (userProfile!.nagFrequency * 3600000);
      }
      return { ...t, status: newStatus, nagCount: newNagCount, nextNagTimestamp: nextTimestamp };
    }));

    if (decision === 'keep' && nextTimestamp) scheduleNotification("Returnley Calling...", `I'm not finished with you about that ${item}.`, nextTimestamp, { transactionId: id, type: 'nag' });
    else if (decision === 'return' && returnBy) scheduleNotification("Return Reminder", `Don't forget to return the ${item}!`, Math.max(Date.now() + 10000, new Date(returnBy).getTime() - 86400000), { transactionId: id, type: 'return_reminder' });
    
    setCallState({ isActive: false, transaction: null, analysis: null, audioUrl: null });
  }, [callState, scheduleNotification, userProfile]);

  const handleQuickAction = useCallback(async (id: string, action: 'return' | 'keep' | 'buy') => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    await Notifications.dismissAllNotificationsAsync();

    if (action === 'buy') {
        // For urges, moving to Pending triggers the "Return/Keep" cycle after a real purchase
        // In a real app, this might trigger a new AI analysis.
        setTransactions(prev => prev.map(t => 
            t.id === id ? { ...t, status: TransactionStatus.Pending, date: new Date().toISOString().split('T')[0] } : t
        ));
        return;
    }

    const newStatus = action === 'return' ? TransactionStatus.Returned : TransactionStatus.Kept;
    
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, status: newStatus, nextNagTimestamp: undefined } : t
    ));

    if (action === 'return' && transaction.returnBy) {
        scheduleNotification(
            "Return Reminder", 
            `Don't forget to return the ${transaction.item}!`, 
            Math.max(Date.now() + 10000, new Date(transaction.returnBy).getTime() - 86400000), 
            { transactionId: id, type: 'return_reminder' }
        );
    }
  }, [transactions, scheduleNotification]);

  // --- Derived State (Memoized) ---

  const stats = useMemo(() => {
    const returned = transactions.filter(t => t.status === TransactionStatus.Returned);
    const shameful = transactions.filter(t => t.status === TransactionStatus.Kept);
    const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalSaved = returned.reduce((s, t) => s + t.amount, 0);

    return { returned, shameful, recent, totalSaved };
  }, [transactions]);

  // --- Render Helpers ---

  const renderTabs = () => (
    <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabNav}>
          {[
            { id: 'recent', label: 'Journal', active: styles.tabButtonActive, text: styles.tabTextActive },
            { id: 'wins', label: 'Returns', active: styles.tabButtonActiveWins, text: styles.tabTextActiveWins, count: stats.returned.length, badge: styles.badgeContainer },
            { id: 'shameful', label: 'Shame', active: styles.tabButtonActiveShame, text: styles.tabTextActiveShame, count: stats.shameful.length, badge: styles.badgeContainerShame },
            { id: 'leaderboard', label: 'Leaderboard', active: styles.tabButtonActiveLeaderboard, text: styles.tabTextActiveLeaderboard },
            { id: 'learn', label: 'Learn', active: styles.tabButtonActiveLearn, text: styles.tabTextActiveLearn },
          ].map(tab => (
            <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id as any)} style={[styles.tabButton, activeTab === tab.id && tab.active]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.tabText, activeTab === tab.id && tab.text]}>{tab.label}</Text>
                {tab.count !== undefined && tab.count > 0 && (
                  <View style={tab.badge}><Text style={styles.badgeText}>{tab.count}</Text></View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topTitleContainer}><Text style={styles.topTitleText}>Returnley</Text></View>
        <ScrollView style={styles.scrollView}>
          <View style={styles.mainContainer}>
            {!userProfile && <OnboardingModal onComplete={setUserProfile} />}
            {isLoading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#A78BFA" /><Text style={styles.loadingMessage}>{loadingMessage}</Text></View>}
            {error && <View style={styles.errorContainer}><Text style={styles.errorTitle}>Error:</Text><Text style={styles.errorMessage}>{error}</Text></View>}
            
            {renderTabs()}

            {activeTab === 'recent' && (
              <TransactionList 
                title="Activity Journal" 
                transactions={stats.recent} 
                emptyBlurb="The activity journal is used to keep track of all the transactions you've made. It shows pending, approved, or transactions flagged for manual review (which happens if Returnley gets confused)."
                onQuickAction={handleQuickAction}
              />
            )}
            {activeTab === 'shameful' && (
              <TransactionList 
                title="Shameful Purchases" 
                transactions={stats.shameful} 
                emptyBlurb="This is where your shameful purchases live—the things you kept even though you probably shouldn't have. Own your mistakes."
                onStatusToggle={id => updateTransactionStatus(id, TransactionStatus.Returned)} 
              />
            )}
            {activeTab === 'wins' && (
              <View>
                <View style={styles.totalSavedCard}><Text style={styles.totalSavedTitle}>Total Money Saved</Text><Text style={styles.totalSavedAmount}>${stats.totalSaved.toFixed(2)}</Text></View>
                <GoalProgress currentSaved={stats.totalSaved * 0.4} totalReturned={stats.totalSaved} goalName={userProfile?.savingsGoal || 'Savings'} goalAmount={userProfile?.goalAmount || 1000} onUpdateGoal={(n, a) => setUserProfile(p => p ? { ...p, savingsGoal: n, goalAmount: a } : null)} />
                <TransactionList 
                  title="Return Wins" 
                  transactions={stats.returned} 
                  emptyBlurb="These are your wins! Every item here is money back in your pocket because you chose to return it instead of keeping it."
                  onStatusToggle={id => updateTransactionStatus(id, TransactionStatus.Kept)} 
                />
              </View>
            )}
            {activeTab === 'leaderboard' && <Leaderboard userOverallSavings={stats.totalSaved} userMonthlySavings={0} />}
            {activeTab === 'learn' && <FinancialLiteracy />}
          </View>
        </ScrollView>
        <View style={styles.bottomNavBar}>
          {[ { icon: 'camera-outline', label: 'Scan', action: () => setIsScannerOpen(true) }, { icon: 'add-circle-outline', label: 'Add', action: () => setIsModalOpen(true) }, { icon: 'settings-outline', label: 'Settings', action: () => setIsSettingsModalOpen(true) } ].map((btn, i) => (
            <TouchableOpacity key={i} onPress={btn.action} style={styles.bottomNavButton}><Ionicons name={btn.icon as any} size={24} color="white" /><Text style={styles.bottomNavButtonText}>{btn.label}</Text></TouchableOpacity>
          ))}
        </View>
        {isScannerOpen && <ReceiptScannerModal onClose={() => setIsScannerOpen(false)} onConfirm={async (uri) => { setIsScannerOpen(false); setIsLoading(true); try { const r = await analyzeReceipt(uri); setPrefilledData(r); setIsModalOpen(true); } catch(e: any) { console.error('SCAN FAILED ERROR:', e.message || e); if (e.stack) console.error('SCAN FAILED STACK:', e.stack); setError(`Scan failed: ${e.message || 'Unknown error'}`); } finally { setIsLoading(false); } }} />}
        {isModalOpen && <AddPurchaseModal onClose={() => { setIsModalOpen(false); setPrefilledData(null); }} onSubmit={handleAddPurchase} initialData={prefilledData} />}
        {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} aiTone={aiTone} onSetAiTone={setAiTone} onClearHistory={() => { setTransactions([]); setIsSettingsModalOpen(false); }} userProfile={userProfile} onUpdateProfile={setUserProfile} />}
        {callState.isActive && callState.transaction && callState.analysis && callState.audioUrl && <IncomingCall transaction={callState.transaction} analysis={callState.analysis} audioUrl={callState.audioUrl} onResolve={handleCallResolve} onAnswer={() => Notifications.dismissAllNotificationsAsync()} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
