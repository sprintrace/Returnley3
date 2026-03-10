import { Transaction, TransactionStatus } from '../types';

export const MAX_NAGS = 7;
export const LOCAL_STORAGE_KEY = 'returnley-transactions';
export const AI_TONE_KEY = 'returnley-ai-tone';
export const USER_PROFILE_KEY = 'returnley-user-profile';

export type AiTone = 'encouraging' | 'stern' | 'ruthless';

export const getSampleTransactions = (): Transaction[] => {
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
