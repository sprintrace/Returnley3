
import React, { useState } from 'react';

interface GoalProgressProps {
  currentSaved: number; // This is now the 40% allocation
  totalReturned: number; // This is the total value of returned items
  goalName: string;
  goalAmount: number;
  onUpdateGoal: (name: string, amount: number) => void;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ currentSaved, totalReturned, goalName, goalAmount, onUpdateGoal }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(goalName);
  const [editAmount, setEditAmount] = useState(goalAmount.toString());

  const progressPercentage = Math.min((currentSaved / goalAmount) * 100, 100);
  const bankRefund = totalReturned * 0.60;

  const handleSave = () => {
    const amount = parseFloat(editAmount);
    if (editName && !isNaN(amount) && amount > 0) {
      onUpdateGoal(editName, amount);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(goalName);
    setEditAmount(goalAmount.toString());
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-800/50 rounded-lg shadow-xl p-6 mb-6">
      {isEditing ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-200">Update Your Goal</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Goal Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Target Amount ($)</label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button 
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md font-semibold shadow-md transition-colors"
            >
              Save Goal
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Goal Fund (40% of Returns)</h3>
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mt-1">
                ${currentSaved.toFixed(2)}
              </p>
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-xs text-purple-400 hover:text-purple-300 underline"
            >
              Edit Goal
            </button>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Goal: <span className="font-semibold text-white">{goalName}</span></span>
              <span className="text-gray-400">${goalAmount.toLocaleString()}</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-500 h-4 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${progressPercentage}%` }}
              >
                 {progressPercentage > 5 && (
                   <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                 )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <span className="text-xs text-gray-400">
                {progressPercentage.toFixed(1)}% Completed
              </span>
            </div>
          </div>

          {/* New Breakdown Section */}
          <div className="grid grid-cols-2 gap-4 bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
             <div className="text-center border-r border-gray-700">
                <p className="text-xs text-gray-500 uppercase">Back to Bank (60%)</p>
                <p className="text-xl font-bold text-green-400">${bankRefund.toFixed(2)}</p>
             </div>
             <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Total Returned</p>
                <p className="text-lg font-semibold text-gray-300">${totalReturned.toFixed(2)}</p>
             </div>
          </div>

          {progressPercentage >= 100 && (
             <div className="mt-4 p-3 bg-green-900/30 border border-green-700/50 rounded-lg text-center animate-bounce">
                <p className="text-green-300 font-bold">🎉 Goal Achieved! You are amazing!</p>
                <p className="text-xs text-green-400">Time to set a bigger target?</p>
             </div>
          )}
        </>
      )}
    </div>
  );
};
