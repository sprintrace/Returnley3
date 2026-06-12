import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform, BackHandler } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

interface ReceiptScannerModalProps {
  onClose: () => void;
  onConfirm: (imageUri: string) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({ onClose, onConfirm }) => {
  const cameraRef = useRef<React.ElementRef<typeof CameraView>>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTakingPicture, setIsTakingPicture] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [permissionChecked, setPermissionChecked] = useState(false);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      requestPermission();
    }
    setPermissionChecked(true);
  }, [permission]);

  useEffect(() => {
    const backAction = () => {
      if (capturedImageUri) {
        setCapturedImageUri(null);
        return true;
      }
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [capturedImageUri, onClose]);

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      setIsTakingPicture(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: Platform.OS === 'android',
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

  const handleConfirm = () => {
    if (capturedImageUri) {
      onConfirm(capturedImageUri);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={40} color="white" />
        </TouchableOpacity>

        {!permissionChecked ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#A78BFA" />
            <Text style={styles.statusText}>Initializing camera...</Text>
          </View>
        ) : !permission?.granted ? (
          <View style={styles.centerContent}>
            <Ionicons name={"camera-off-outline" as any} size={64} color="#EF4444" />
            <Text style={styles.errorText}>Camera permission is required to scan receipts.</Text>
            <TouchableOpacity onPress={onClose} style={styles.errorCloseButton}>
              <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.cameraPreviewContainer}>
              {error && (
                <View style={styles.errorOverlay}>
                  <Text style={styles.errorOverlayText}>{error}</Text>
                </View>
              )}
              
              {capturedImageUri ? (
                <Image source={{ uri: capturedImageUri }} style={styles.capturedImage} />
              ) : (
                <CameraView style={styles.camera} facing="back" ref={cameraRef} />
              )}
            </View>

            <View style={styles.buttonActionsContainer}>
              {capturedImageUri ? (
                <>
                  <TouchableOpacity onPress={() => setCapturedImageUri(null)} style={styles.retakeButton}>
                    <Text style={styles.buttonText}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
                    <Text style={styles.buttonText}>Use Picture</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={handleTakePhoto} disabled={isTakingPicture} style={styles.takePhotoButton}>
                  {isTakingPicture ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <View style={styles.takePhotoInnerCircle} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 20,
  },
  statusText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 30,
  },
  errorCloseButton: {
    backgroundColor: '#4B5563',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cameraPreviewContainer: {
    width: '100%',
    flex: 1,
    maxHeight: 600,
    backgroundColor: '#111827',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 40,
  },
  camera: {
    flex: 1,
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
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
    zIndex: 5,
  },
  errorOverlayText: {
    color: '#EF4444',
    textAlign: 'center',
    padding: 20,
  },
  buttonActionsContainer: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  retakeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4B5563',
    borderRadius: 8,
    marginHorizontal: 12,
  },
  confirmButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    marginHorizontal: 12,
  },
  takePhotoButton: {
    width: 80,
    height: 80,
    backgroundColor: 'white',
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  takePhotoInnerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#000',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
