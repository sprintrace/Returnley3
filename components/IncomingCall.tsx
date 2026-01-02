import React, { useState, useEffect, useRef } from 'react';
import { Transaction, PurchaseAnalysis } from '../types';
import { PhoneIcon } from './icons/PhoneIcon';

/**
 * Props for the IncomingCall component.
 */
interface IncomingCallProps {
  /** The transaction that triggered the call. */
  transaction: Transaction;
  /** The AI analysis of the transaction. */
  analysis: PurchaseAnalysis;
  /** A blob URL for the audio to be played. */
  audioUrl: string;
  /** Callback function to resolve the call with the user's decision. */
  onResolve: (decision: 'return' | 'keep') => void;
}

/**
 * A full-screen modal that simulates an incoming phone call to the user.
 * It manages its own internal state for the call flow (ringing, answered).
 */
export const IncomingCall: React.FC<IncomingCallProps> = ({ transaction, analysis, audioUrl, onResolve }) => {
  // Internal state machine for the call UI: 'ringing' -> 'answered' -> 'ended'
  const [callState, setCallState] = useState<'ringing' | 'answered' | 'ended'>('ringing');
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Effect to manage the audio lifecycle.
   * It creates an Audio object, sets up event listeners, and cleans up when the component unmounts.
   */
  useEffect(() => {
    if (audioUrl) {
      // Create a new Audio object from the blob URL.
      audioRef.current = new Audio(audioUrl);
      // Set up event listeners to track playback state.
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onpause = () => setIsPlaying(false);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setHasPlayed(true); // Mark that the audio has finished at least once.
      };
    }
    // Cleanup function: runs when the component unmounts.
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        // IMPORTANT: Revoke the object URL to prevent memory leaks in the browser.
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current = null;
      }
    };
  }, [audioUrl]); // This effect re-runs only if the audioUrl changes.

  const handleAnswer = () => {
    setCallState('answered');
    // Attempt to play the audio. The catch block handles potential browser restrictions.
    audioRef.current?.play().catch(e => console.error("Audio playback failed:", e));
  };

  const handleDecline = () => {
    // Declining the call is treated as a decision to keep the item.
    onResolve('keep');
  };
  
  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Rewind to the start
      audioRef.current.play().catch(e => console.error("Audio replay failed:", e));
    }
  };

  const handleDecision = (decision: 'return' | 'keep') => {
    setCallState('ended'); // Transition to ended state to ensure component unmounts cleanly.
    onResolve(decision);
  };
  
  // Don't render anything if the call has ended (the parent component will remove it).
  if (callState === 'ended') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 text-center text-white p-4">
      <div className="w-full max-w-sm">
        {/* Ringing View */}
        {callState === 'ringing' ? (
          <>
            <div className="animate-pulse mb-4">
              <p className="text-lg text-gray-300">Incoming Call...</p>
              <h2 className="text-4xl font-bold">Returnley</h2>
            </div>
            {/* Animated ringing icon */}
            <div className="my-10 animate-ping-slow inline-block p-4 bg-red-500 rounded-full">
                <PhoneIcon className="w-10 h-10 text-white" />
            </div>
            <p className="mb-8 text-gray-400">Regarding your purchase of <span className="font-semibold text-white">{transaction.item}</span>.</p>
            <div className="flex justify-around">
              <button onClick={handleDecline} className="flex flex-col items-center space-y-2 text-red-400 hover:text-red-300">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center transform rotate-135">
                  <PhoneIcon className="w-8 h-8"/>
                </div>
                <span>Decline</span>
              </button>
              <button onClick={handleAnswer} className="flex flex-col items-center space-y-2 text-green-400 hover:text-green-300">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                  <PhoneIcon className="w-8 h-8"/>
                </div>
                <span>Answer</span>
              </button>
            </div>
          </>
        ) : (
          /* Answered View */
          <>
            <h2 className="text-3xl font-bold mb-2">Call in Progress</h2>
            <div className="flex items-center justify-center space-x-2 text-lg text-gray-300 mb-6">
                <p>Returnley is speaking</p>
                {/* Visual indicator for when audio is playing */}
                {isPlaying && (
                    <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                )}
            </div>
            {/* Display the AI's reasoning text */}
            <div className="bg-gray-800 rounded-lg p-4 text-left mb-8 min-h-[80px]">
                <p className="font-semibold text-purple-300">Reasoning:</p>
                <p className="text-gray-200">{analysis.reasoning}</p>
            </div>
            {/* Show replay button only after audio has finished playing once */}
            {hasPlayed && !isPlaying && (
                 <button onClick={handleReplay} className="mb-8 text-purple-400 hover:text-purple-300 font-semibold">
                    Replay Message
                </button>
            )}
            <p className="mb-8 text-gray-300">You've been advised about the <span className="font-semibold text-white">{transaction.item}</span>. What will you do?</p>
            {/* Final decision buttons */}
            <div className="flex justify-around">
              <button onClick={() => handleDecision('keep')} className="py-3 px-6 bg-red-600 hover:bg-red-700 rounded-lg font-semibold">I'm Keeping It</button>
              <button onClick={() => handleDecision('return')} className="py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg font-semibold">I Will Return It</button>
            </div>
          </>
        )}
      </div>
       {/* Embedded CSS for custom animations */}
       <style>{`
        @keyframes ping-slow {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};
