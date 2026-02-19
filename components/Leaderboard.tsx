import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * Props for the Leaderboard component.
 */
interface LeaderboardProps {
  /** The user's total savings from all returned items. */
  userOverallSavings: number;
  /** The user's total savings for the current month. */
  userMonthlySavings: number;
}

interface LeaderboardEntry {
  name: string;
  savings: number;
  isUser: boolean;
}

// --- Static Data Generation ---
// For demo purposes, we generate static, fictional user data to populate the leaderboards.
// This makes the feature feel more alive without a real backend.

const createOverallFakeEntries = (): Omit<LeaderboardEntry, 'isUser'>[] => [
  { name: 'FinancialChampion', savings: 2150.75 },
  { name: 'ThriftyFox', savings: 1890.20 },
  { name: 'BudgetMaster_01', savings: 1520.50 },
  { name: 'Saver_734', savings: 1180.00 },
  { name: 'ReturnNinja', savings: 855.99 },
  { name: 'CurbSpender', savings: 410.45 },
  { name: 'NewbieSaver', savings: 125.30 },
];

const createMonthlyFakeEntries = (): Omit<LeaderboardEntry, 'isUser'>[] => [
    { name: 'MonthlyMogul', savings: 580.50 },
    { name: 'QuickReturner', savings: 410.00 },
    { name: 'JuneSaver', savings: 355.25 },
    { name: 'ThisMonthPro', savings: 220.80 },
    { name: 'FreshStart', savings: 150.00 },
    { name: 'WeekWarrior', savings: 95.50 },
];

/**
 * Determines a user's rank title and color based on their savings amount.
 * @param savings The amount of money saved.
 * @returns An object with the rank title and a hex color string.
 */
const getSavingsRank = (savings: number): { title: string, color: string } => {
  if (savings > 2000) return { title: 'Financial Champion', color: '#FCD34D' }; // text-yellow-400
  if (savings > 1200) return { title: 'Savings Sensei', color: '#A78BFA' }; // text-purple-400
  if (savings > 600) return { title: 'Return Pro', color: '#60A5FA' }; // text-blue-400
  if (savings > 200) return { title: 'Mindful Spender', color: '#34D399' }; // text-green-400
  if (savings > 0) return { title: 'Return Rookie', color: '#2DD4BF' }; // text-teal-400
  return { title: 'Getting Started', color: '#9CA3AF' }; // text-gray-400
};

/**
 * A component that displays a gamified leaderboard of savings.
 * It shows the user's rank compared to fictional users.
 */
export const Leaderboard: React.FC<LeaderboardProps> = React.memo(({ userOverallSavings, userMonthlySavings }) => {
  const [view, setView] = useState<'monthly' | 'overall'>('monthly');

  /**
   * Memoized calculation for the sorted monthly leaderboard.
   * It combines the fake entries with the current user's entry and sorts them.
   * `useMemo` prevents this expensive sorting operation from running on every render.
   */
  const sortedMonthlyLeaderboard = useMemo(() => {
    const userEntry: LeaderboardEntry = { name: 'You', savings: userMonthlySavings, isUser: true };
    const fakeEntries: LeaderboardEntry[] = createMonthlyFakeEntries().map(e => ({ ...e, isUser: false }));
    
    const combined = [...fakeEntries, userEntry];
    return combined.sort((a, b) => b.savings - a.savings);
  }, [userMonthlySavings]);

  /**
   * Memoized calculation for the sorted overall leaderboard.
   */
  const sortedOverallLeaderboard = useMemo(() => {
    const userEntry: LeaderboardEntry = { name: 'You', savings: userOverallSavings, isUser: true };
    const fakeEntries: LeaderboardEntry[] = createOverallFakeEntries().map(e => ({ ...e, isUser: false }));
    
    const combined = [...fakeEntries, userEntry];
    return combined.sort((a, b) => b.savings - a.savings);
  }, [userOverallSavings]);

  const currentLeaderboard = view === 'monthly' ? sortedMonthlyLeaderboard : sortedOverallLeaderboard;
  const userRank = getSavingsRank(view === 'monthly' ? userMonthlySavings : userOverallSavings);

  return (
    <View style={styles.container}>
       {/* User's Rank Card */}
       <View style={styles.rankCard}>
            <Text style={styles.rankCardTitle}>Your Current Rank {view === 'monthly' && '(This Month)'}</Text>
            <Text style={[styles.rankCardRank, { color: userRank.color }]}>
                {userRank.title}
            </Text>
            <Text style={styles.rankCardSubtitle}>Keep returning to climb the ranks!</Text>
        </View>

      {/* Leaderboard Table */}
      <View style={styles.leaderboardTable}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>Savings Leaderboard</Text>
          {/* View Toggle (Monthly/Overall) */}
          <View style={styles.toggleButtonGroup}>
            <TouchableOpacity
              onPress={() => setView('monthly')}
              style={[
                styles.toggleButton,
                view === 'monthly' ? styles.toggleButtonActive : styles.toggleButtonInactive
              ]}
            >
              <Text style={[
                styles.toggleButtonText,
                view === 'monthly' ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive
              ]}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setView('overall')}
              style={[
                styles.toggleButton,
                view === 'overall' ? styles.toggleButtonActive : styles.toggleButtonInactive
              ]}
            >
              <Text style={[
                styles.toggleButtonText,
                view === 'overall' ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive
              ]}>
                Overall
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.listContainer}>
          {currentLeaderboard.map((entry, index) => (
            <View
              key={entry.name + view} // Key includes `view` to ensure React re-renders the list on toggle.
              style={[
                styles.listItem,
                entry.isUser && styles.userListItem
              ]}
            >
              <View style={styles.listItemLeft}>
                <Text style={styles.listItemRank}>{index + 1}</Text>
                <Text style={[styles.listItemName, entry.isUser ? styles.userListItemName : styles.otherListItemName]}>
                  {entry.name}
                </Text>
              </View>
              <Text style={[styles.listItemSavings, entry.isUser ? styles.userListItemSavings : styles.otherListItemSavings]}>
                ${entry.savings.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    // space-y-6 roughly translated to padding on parent and margins on children
    flex: 1,
    padding: 24,
  },
  rankCard: {
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
  rankCardTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#D1D5DB', // text-gray-300
  },
  rankCardRank: {
    fontSize: 36, // text-4xl
    fontWeight: 'bold', // font-bold
    marginTop: 8, // mt-2
  },
  rankCardSubtitle: {
    fontSize: 14, // text-sm
    color: '#9CA3AF', // text-gray-400
    marginTop: 4, // mt-1
  },
  leaderboardTable: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)', // bg-gray-800/50
    borderRadius: 8, // rounded-lg
    shadowColor: '#000', // shadow-xl
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  tableHeader: {
    flexDirection: 'row', // flex
    justifyContent: 'space-between', // justify-between
    alignItems: 'center', // items-center
    padding: 16, // p-4
    borderBottomWidth: 1, // border-b
    borderColor: '#374151', // border-gray-700
  },
  tableTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: 'white',
  },
  toggleButtonGroup: {
    backgroundColor: '#4B5563', // bg-gray-700
    padding: 4, // p-1
    borderRadius: 8, // rounded-lg
    flexDirection: 'row', // flex
    // space-x-1 (marginRight on buttons)
  },
  toggleButton: {
    paddingHorizontal: 12, // px-3
    paddingVertical: 4, // py-1
    borderRadius: 6, // rounded-md
    // transition-colors (handled by TouchableOpacity feedback)
  },
  toggleButtonActive: {
    backgroundColor: '#7C3AED', // bg-purple-600
  },
  toggleButtonInactive: {
    // hover:bg-gray-600 (handled by TouchableOpacity feedback)
  },
  toggleButtonText: {
    fontSize: 12, // text-xs
    fontWeight: '600', // font-semibold
  },
  toggleButtonTextActive: {
    color: 'white', // text-white
  },
  toggleButtonTextInactive: {
    color: '#D1D5DB', // text-gray-300
  },
  listContainer: {
    // divide-y divide-gray-700 (borderBottomWidth on list items)
  },
  listItem: {
    flexDirection: 'row', // flex
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    padding: 16, // p-4
    borderBottomWidth: 1, // divide-y
    borderColor: '#374151', // divide-gray-700
  },
  userListItem: {
    backgroundColor: 'rgba(126, 34, 206, 0.4)', // bg-purple-900/40
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemRank: {
    fontSize: 18, // text-lg
    fontWeight: 'bold', // font-bold
    color: '#9CA3AF', // text-gray-400
    width: 32, // w-8
    marginRight: 8,
  },
  listItemName: {
    fontWeight: '600', // font-semibold
  },
  userListItemName: {
    color: '#D8B4FE', // text-purple-300
  },
  otherListItemName: {
    color: 'white', // text-white
  },
  listItemSavings: {
    fontWeight: 'bold', // font-bold
    fontSize: 18, // text-lg
  },
  userListItemSavings: {
    color: 'white', // text-white
  },
  otherListItemSavings: {
    color: '#34D399', // text-green-400
  },
});
