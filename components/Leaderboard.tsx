import React, { useMemo, useState } from 'react';

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
 * @returns An object with the rank title and a Tailwind CSS color class.
 */
const getSavingsRank = (savings: number): { title: string, color: string } => {
  if (savings > 2000) return { title: 'Financial Champion', color: 'text-yellow-400' };
  if (savings > 1200) return { title: 'Savings Sensei', color: 'text-purple-400' };
  if (savings > 600) return { title: 'Return Pro', color: 'text-blue-400' };
  if (savings > 200) return { title: 'Mindful Spender', color: 'text-green-400' };
  if (savings > 0) return { title: 'Return Rookie', color: 'text-teal-400' };
  return { title: 'Getting Started', color: 'text-gray-400' };
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
    <div className="space-y-6">
       {/* User's Rank Card */}
       <div className="bg-gray-800/50 rounded-lg shadow-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-300">Your Current Rank {view === 'monthly' && '(This Month)'}</h3>
            <p className={`text-4xl font-bold mt-2 ${userRank.color}`}>
                {userRank.title}
            </p>
            <p className="text-sm text-gray-400 mt-1">Keep returning to climb the ranks!</p>
        </div>

      {/* Leaderboard Table */}
      <div className="bg-gray-800/50 rounded-lg shadow-xl">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Savings Leaderboard</h2>
          {/* View Toggle (Monthly/Overall) */}
          <div className="bg-gray-700 p-1 rounded-lg flex space-x-1">
            <button
              onClick={() => setView('monthly')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                view === 'monthly' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setView('overall')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                view === 'overall' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              Overall
            </button>
          </div>
        </div>
        <ul className="divide-y divide-gray-700">
          {currentLeaderboard.map((entry, index) => (
            <li
              key={entry.name + view} // Key includes `view` to ensure React re-renders the list on toggle.
              className={`flex items-center justify-between p-4 ${
                entry.isUser ? 'bg-purple-900/40' : '' // Highlight the user's row.
              }`}
            >
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-400 w-8">{index + 1}</span>
                <span className={`font-semibold ${entry.isUser ? 'text-purple-300' : 'text-white'}`}>
                  {entry.name}
                </span>
              </div>
              <span className={`font-bold text-lg ${entry.isUser ? 'text-white' : 'text-green-400'}`}>
                ${entry.savings.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
