import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform, Button } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

/**
 * Props for the ReceiptScannerModal component.
 */
interface ReceiptScannerModalProps {
  /** Function to call when the modal should be closed. */
  onClose: () => void;
  /** Function to call when a picture is confirmed, passing the base64 image data. */
  onConfirm: (imageUri: string) => void;
}

/**
 * A modal component for scanning receipts using the device's camera.
 */
export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({ onClose, onConfirm }) => {
  const cameraRef = useRef<React.ElementRef<typeof CameraView>>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTakingPicture, setIsTakingPicture] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [permissionChecked, setPermissionChecked] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if (!permission) return;

      if (!permission.granted) {
        requestPermission();
      }

      setPermissionChecked(true);
    };

    checkPermission();
  }, [permission]);

  /**
   * Captures a photo using the camera.
   */
  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      setIsTakingPicture(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false, // receipts don't need exif data
          // Skip processing if on Android for faster capture and to use raw image data
          skipProcessing: Platform.OS === 'android' ? true : false,
        });
        setCapturedImageUri(photo.uri);
        setError(null);
      } catch (err) {
        console.error('Error taking picture:', err);
        setError('Failed to take picture. Please try again.');
      } finally {
        setIsTakingPicture(false);
      }
    }
  };

  /**
   * Handles the "Retake" button click. Clears the captured image and restarts the camera preview.
   */
  const handleRetake = () => {
    setCapturedImageUri(null);
    setError(null);
  };

  /**
   * Handles the "Use Picture" button click. Calls the onConfirm prop with the image data.
   */
  const handleConfirm = () => {
    if (capturedImageUri) {
      onConfirm(capturedImageUri);
    }
  };

  // Render loading state while checking permissions
  if (!permissionChecked) {
    return (
      <Modal transparent animationType="fade" visible>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>
            Initializing camera...
          </Text>
        </View>
      </Modal>
    );
  }

  // Render error message if permission is denied  
  if (!permission?.granted) {
    return (
      <Modal transparent animationType="fade" visible>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorScreenText}>
            Camera permission denied. Please enable it in settings.
          </Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={false} // Use false for full screen modal
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={30} color="white" />
        </TouchableOpacity>
        
        <View style={styles.cameraPreviewContainer}>
          {/* Display error message if camera access fails */}
          {error && (
              <View style={styles.errorOverlay}>
                  <Text style={styles.errorOverlayText}>Error: {error}</Text>
              </View>
          )}
          
          {/* Live camera feed or captured image preview */}
          {capturedImageUri ? (
            <Image
              source={{ uri: capturedImageUri }}
              style={styles.capturedImage}
            />
          ) : (
            <View style={{ flex: 1}}>
              <CameraView
                style={styles.camera}
                facing={"back"} // Prioritize back camera
                ref={cameraRef}>
              </CameraView>
            </View>
          )}
        </View>

        <View style={styles.buttonActionsContainer}>
          {/* Conditionally render buttons based on whether an image has been captured */}
          {capturedImageUri ? (
            // Not sure what this is but if you remove it shit goes red
            <>
              <TouchableOpacity onPress={handleRetake} style={styles.retakeButton}>
                <Text style={styles.buttonText}>
                  Retake
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
                <Text style={styles.buttonText}>
                  Use Picture
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={handleTakePhoto} disabled={!!error || isTakingPicture} style={styles.takePhotoButton}>
              {isTakingPicture ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <View style={styles.takePhotoInnerCircle} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
  },
  errorScreen: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorScreenText: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  errorScreenCloseButton: {
    backgroundColor: '#4B5563',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  errorScreenCloseButtonText: {
    color: 'white',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: 'black', // fixed inset-0 bg-black
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16, // p-4
  },
  closeButton: {
    position: 'absolute',
    top: 40, // top-4
    right: 20, // right-4
    zIndex: 10, // z-20
    // text-white text-3xl font-bold is handled by Ionicons
  },
  cameraPreviewContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 9 / 16, // aspect-[9/16]
    // md:aspect-video for larger screens might require responsive logic not directly in StyleSheet
    backgroundColor: '#111827', // bg-gray-900
    borderRadius: 8, // rounded-lg
    overflow: 'hidden',
    shadowColor: '#000', // shadow-2xl
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5.46,
    elevation: 10,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 5,
  },
  errorOverlayText: {
    color: '#EF4444', // text-red-400
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  activityIndicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // object-contain
  },
  buttonActionsContainer: {
    marginTop: 24, // mt-6
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // space-x-8 (marginRight/marginLeft on buttons)
    width: '100%',
    maxWidth: 600, // max-w-2xl
  },
  retakeButton: {
    paddingHorizontal: 24, // px-6
    paddingVertical: 12, // py-3
    backgroundColor: '#4B5563', // bg-gray-600
    borderRadius: 8, // rounded-lg
    shadowColor: '#000', // shadow-md
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    marginHorizontal: 16, // Simulating space-x-8
  },
  confirmButton: {
    paddingHorizontal: 24, // px-6
    paddingVertical: 12, // py-3
    backgroundColor: '#7C3AED', // bg-purple-600
    borderRadius: 8, // rounded-lg
    shadowColor: '#000', // shadow-md
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    marginHorizontal: 16, // Simulating space-x-8
  },
  takePhotoButton: {
    width: 80, // w-20
    height: 80, // h-20
    backgroundColor: 'white',
    borderRadius: 40, // rounded-full
    borderWidth: 4, // border-4
    borderColor: '#6B7280', // border-gray-500
    justifyContent: 'center',
    alignItems: 'center',
    // disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white
  },
  takePhotoInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
