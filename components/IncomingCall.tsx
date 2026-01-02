import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Transaction, PurchaseAnalysis } from '../types';
import { Audio } from 'expo-av'; // Import Audio from expo-av
import { Ionicons } from '@expo/vector-icons'; // Using Ionicons for icons

/**
 * Props for the IncomingCall component.
 */
interface IncomingCallProps {
  /** The transaction that triggered the call. */
  transaction: Transaction;
  /** The AI analysis of the transaction. */
  analysis: PurchaseAnalysis;
  /** A URI for the audio to be played (from expo-file-system). */
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
  const soundObject = useRef<Audio.Sound | null>(null);

  // Animated value for the ping effect
  const pingAnim = useRef(new Animated.Value(0)).current;

  // Animation for the ping effect
  const startPingAnimation = () => {
    pingAnim.setValue(0); // Reset animation
    Animated.loop(
      Animated.timing(pingAnim, {
        toValue: 1,
        duration: 2000, // 2 seconds
        easing: Easing.bezier(0, 0, 0.2, 1),
        useNativeDriver: true,
      })
    ).start();
  };

  /**
   * Effect to manage the audio lifecycle.
   * It creates an Audio object, sets up event listeners, and cleans up when the component unmounts.
   */
  useEffect(() => {
    const loadAudio = async () => {
      if (audioUrl) {
        try {
          // Unload any existing sound before loading a new one
          if (soundObject.current) {
            await soundObject.current.unloadAsync();
          }
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: false }
          );
          soundObject.current = sound;

          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) {
                setHasPlayed(true);
                setIsPlaying(false);
              }
            }
          });
        } catch (error) {
          console.error("Error loading audio:", error);
        }
      }
    };

    loadAudio();

    // Cleanup function: runs when the component unmounts.
    return () => {
      if (soundObject.current) {
        soundObject.current.unloadAsync();
        soundObject.current = null;
      }
    };
  }, [audioUrl]); // This effect re-runs only if the audioUrl changes.

  const handleAnswer = async () => {
    setCallState('answered');
    if (soundObject.current) {
      try {
        await soundObject.current.playAsync();
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
    startPingAnimation(); // Start animation when answered
  };

  const handleDecline = () => {
    // Declining the call is treated as a decision to keep the item.
    onResolve('keep');
  };
  
  const handleReplay = async () => {
    if (soundObject.current) {
      try {
        await soundObject.current.replayAsync();
      } catch (error) {
        console.error("Error replaying audio:", error);
      }
    }
  };

  const handleDecision = async (decision: 'return' | 'keep') => {
    if (soundObject.current) {
      await soundObject.current.stopAsync();
      await soundObject.current.unloadAsync();
    }
    setCallState('ended'); // Transition to ended state to ensure component unmounts cleanly.
    onResolve(decision);
  };
  
  // Don't render anything if the call has ended (the parent component will remove it).
  if (callState === 'ended') return null;

  const pingStyle = {
    opacity: pingAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.5, 0],
    }),
    transform: [{
      scale: pingAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2],
      }),
    }],
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={handleDecline} // Android back button
    >
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          {/* Ringing View */}
          {callState === 'ringing' ? (
            <>
              <View style={styles.ringingHeader}>
                <Text style={styles.ringingIncomingCall}>Incoming Call...</Text>
                <Text style={styles.ringingTitle}>Returnley</Text>
              </View>
              {/* Animated ringing icon */}
              <View style={styles.animatedIconContainer}>
                  <Animated.View style={[styles.pingCircle, pingStyle]} />
                  <View style={styles.staticIcon}>
                    <Ionicons name="call" size={40} color="white" />
                  </View>
              </View>
              <Text style={styles.ringingSubtitle}>Regarding your purchase of <Text style={styles.ringingSubtitleHighlight}>{transaction.item}</Text>.</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={handleDecline} style={styles.declineButton}>
                  <View style={[styles.callButtonIconContainer, styles.declineIconBg]}>
                    <Ionicons name="call" size={32} color="white" style={styles.declineIconRotate} />
                  </View>
                  <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAnswer} style={styles.answerButton}>
                  <View style={[styles.callButtonIconContainer, styles.answerIconBg]}>
                    <Ionicons name="call" size={32} color="white" />
                  </View>
                  <Text style={styles.answerButtonText}>Answer</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Answered View */
            <>
              <Text style={styles.answeredTitle}>Call in Progress</Text>
              <View style={styles.speakingIndicator}>
                  <Text style={styles.speakingText}>Returnley is speaking</Text>
                  {/* Visual indicator for when audio is playing */}
                  {isPlaying && (
                      <Animated.View style={[styles.speakingPing, pingStyle]} />
                  )}
              </View>
              {/* Display the AI's reasoning text */}
              <View style={styles.reasoningBox}>
                  <Text style={styles.reasoningHeader}>Reasoning:</Text>
                  <Text style={styles.reasoningText}>{analysis.reasoning}</Text>
              </View>
              {/* Show replay button only after audio has finished playing once */}
              {hasPlayed && !isPlaying && (
                   <TouchableOpacity onPress={handleReplay} style={styles.replayButton}>
                      <Text style={styles.replayButtonText}>Replay Message</Text>
                  </TouchableOpacity>
              )}
              <Text style={styles.decisionPrompt}>You've been advised about the <Text style={styles.decisionPromptHighlight}>{transaction.item}</Text>. What will you do?</Text>
              {/* Final decision buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={() => handleDecision('keep')} style={[styles.decisionButton, styles.decisionButtonKeep]}>
                    <Text style={styles.decisionButtonText}>I'm Keeping It</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDecision('return')} style={[styles.decisionButton, styles.decisionButtonReturn]}>
                    <Text style={styles.decisionButtonText}>I Will Return It</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // bg-black bg-opacity-90
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16, // p-4
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 384, // max-w-sm
    alignItems: 'center', // text-center
  },
  ringingHeader: {
    alignItems: 'center', // text-center
    marginBottom: 16, // mb-4
  },
  ringingIncomingCall: {
    fontSize: 18, // text-lg
    color: '#D1D5DB', // text-gray-300
  },
  ringingTitle: {
    fontSize: 36, // text-4xl
    fontWeight: 'bold', // font-bold
    color: 'white', // text-white
  },
  animatedIconContainer: {
    marginVertical: 40, // my-10
    // inline-block p-4 bg-red-500 rounded-full
    alignItems: 'center',
    justifyContent: 'center',
    width: 64, // approximate size for the effect
    height: 64, // approximate size for the effect
    borderRadius: 32, // half of width/height for full circle
    backgroundColor: '#EF4444', // bg-red-500
    position: 'relative',
  },
  pingCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: '#EF4444', // bg-red-500
    // Animated styles applied directly via `pingStyle`
  },
  staticIcon: {
    position: 'absolute',
  },
  ringingSubtitle: {
    marginBottom: 32, // mb-8
    color: '#9CA3AF', // text-gray-400
    fontSize: 16,
  },
  ringingSubtitleHighlight: {
    fontWeight: 'bold', // font-semibold
    color: 'white', // text-white
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  declineButton: {
    alignItems: 'center', // flex-col items-center
    // space-y-2
  },
  callButtonIconContainer: {
    width: 64, // w-16
    height: 64, // h-16
    borderRadius: 32, // rounded-full
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineIconBg: {
    backgroundColor: '#DC2626', // bg-red-600
  },
  declineIconRotate: {
    transform: [{ rotate: '135deg' }], // transform rotate-135
  },
  declineButtonText: {
    marginTop: 8, // space-y-2
    color: '#F87171', // text-red-400
    fontSize: 16,
    // hover:text-red-300 (handled by TouchableOpacity feedback)
  },
  answerButton: {
    alignItems: 'center', // flex-col items-center
    // space-y-2
  },
  answerIconBg: {
    backgroundColor: '#10B981', // bg-green-600
  },
  answerButtonText: {
    marginTop: 8, // space-y-2
    color: '#4ADE80', // text-green-400
    fontSize: 16,
    // hover:text-green-300 (handled by TouchableOpacity feedback)
  },
  answeredTitle: {
    fontSize: 28, // text-3xl
    fontWeight: 'bold', // font-bold
    marginBottom: 8, // mb-2
    color: 'white',
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // space-x-2
    fontSize: 18, // text-lg
    color: '#D1D5DB', // text-gray-300
    marginBottom: 24, // mb-6
  },
  speakingText: {
    color: '#D1D5DB',
    marginRight: 8, // space-x-2
  },
  speakingPing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A78BFA', // bg-purple-500
  },
  reasoningBox: {
    backgroundColor: '#1F2937', // bg-gray-800
    borderRadius: 8, // rounded-lg
    padding: 16, // p-4
    textAlign: 'left', // text-left
    marginBottom: 32, // mb-8
    minHeight: 80, // min-h-[80px]
    width: '100%',
  },
  reasoningHeader: {
    fontWeight: 'bold', // font-semibold
    color: '#C084FC', // text-purple-300
    marginBottom: 4,
  },
  reasoningText: {
    color: '#E5E7EB', // text-gray-200
  },
  replayButton: {
    marginBottom: 32, // mb-8
    // hover:text-purple-300 (handled by TouchableOpacity feedback)
  },
  replayButtonText: {
    color: '#C084FC', // text-purple-400
    fontWeight: 'bold', // font-semibold
    fontSize: 16,
  },
  decisionPrompt: {
    marginBottom: 32, // mb-8
    color: '#D1D5DB', // text-gray-300
    fontSize: 16,
  },
  decisionPromptHighlight: {
    fontWeight: 'bold', // font-semibold
    color: 'white', // text-white
  },
  decisionButton: {
    paddingVertical: 12, // py-3
    paddingHorizontal: 24, // px-6
    borderRadius: 8, // rounded-lg
    fontWeight: 'bold', // font-semibold
  },
  decisionButtonKeep: {
    backgroundColor: '#DC2626', // bg-red-600
    // hover:bg-red-700
  },
  decisionButtonReturn: {
    backgroundColor: '#10B981', // bg-green-600
    // hover:bg-green-700
  },
  decisionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
