
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface OnboardingModalProps {
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [income, setIncome] = useState('');
  const [weakness, setWeakness] = useState('');
  const [goal, setGoal] = useState('');
  const [goalAmount, setGoalAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (income && weakness && goal && goalAmount) {
      onComplete({
        monthlyIncome: parseFloat(income),
        financialWeakness: weakness,
        savingsGoal: goal,
        goalAmount: parseFloat(goalAmount),
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg border border-purple-500/30">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
            Welcome to Returnley
          </h2>
          <p className="text-gray-400">
            To be your financial conscience, I need to know who I'm dealing with.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              What is your approximate monthly income?
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                required
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-8 pr-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="3000"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              What is your biggest spending weakness?
            </label>
            <input
              type="text"
              required
              value={weakness}
              onChange={(e) => setWeakness(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Late night snacks, Tech gadgets, Shoes"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Main Financial Goal
              </label>
              <input
                type="text"
                required
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Vacation, Debt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Target Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  required
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-8 pr-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="5000"
                  min="0"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition hover:scale-105"
          >
            Start My Transformation
          </button>
        </form>
      </div>
    </div>
  );
};
