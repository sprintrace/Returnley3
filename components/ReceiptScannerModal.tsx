import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Props for the ReceiptScannerModal component.
 */
interface ReceiptScannerModalProps {
  /** Function to call when the modal should be closed. */
  onClose: () => void;
  /** Function to call when a picture is confirmed, passing the base64 image data. */
  onConfirm: (imageData: string) => void;
}

/**
 * A modal component for scanning receipts using the device's camera.
 */
export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({ onClose, onConfirm }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initializes and starts the camera stream.
   * Wrapped in useCallback to memoize the function.
   */
  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream before starting a new one.
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // Request access to the user's camera.
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Prioritize the rear camera on mobile devices.
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream; // Attach the stream to the video element.
      }
      setCapturedImage(null); // Clear any previously captured image.
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the camera. Please check permissions and try again.');
      // If 'environment' facing mode fails, try a fallback without it.
      if (err instanceof DOMException && err.name === "OverconstrainedError") {
          try {
             const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
             setStream(fallbackStream);
             if (videoRef.current) {
                videoRef.current.srcObject = fallbackStream;
             }
             setError(null);
          } catch (fallbackErr) {
             console.error('Error accessing fallback camera:', fallbackErr);
          }
      }
    }
  }, [stream]); // Dependency on `stream` to allow re-calling if needed.

  /**
   * Effect to start the camera when the component mounts and clean up when it unmounts.
   */
  useEffect(() => {
    startCamera();
    // Cleanup function: stop all media tracks when the component is unmounted.
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  /**
   * Captures a photo from the video stream.
   * It draws the current video frame onto a hidden canvas and gets the data URL.
   */
  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Convert the canvas content to a JPEG data URL.
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // 0.9 is the image quality.
        // We only need the base64 part of the data URL, so we split and take the second part.
        const base64Data = dataUrl.split(',')[1];
        setCapturedImage(base64Data);
        // Stop the camera stream to freeze the frame and save battery.
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  /**
   * Handles the "Retake" button click. Clears the captured image and restarts the camera.
   */
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  /**
   * Handles the "Use Picture" button click. Calls the onConfirm prop with the image data.
   */
  const handleConfirm = () => {
    if (capturedImage) {
      onConfirm(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl font-bold z-20">&times;</button>
      
      <div className="relative w-full max-w-2xl aspect-[9/16] md:aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        {/* Display error message if camera access fails */}
        {error && (
            <div className="absolute inset-0 flex items-center justify-center text-center text-red-400 p-4">
                {error}
            </div>
        )}
        
        {/* Live camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${capturedImage ? 'hidden' : ''}`}
        />

        {/* Captured image preview */}
        {capturedImage && (
          <img
            src={`data:image/jpeg;base64,${capturedImage}`}
            alt="Receipt preview"
            className="w-full h-full object-contain"
          />
        )}
        {/* Hidden canvas used for capturing the image */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="mt-6 flex justify-center items-center space-x-8 w-full max-w-2xl">
        {/* Conditionally render buttons based on whether an image has been captured */}
        {capturedImage ? (
          <>
            <button onClick={handleRetake} className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg shadow-md">
              Retake
            </button>
            <button onClick={handleConfirm} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md">
              Use Picture
            </button>
          </>
        ) : (
          <button onClick={handleTakePhoto} disabled={!!error} className="w-20 h-20 bg-white rounded-full border-4 border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white">
            <span className="sr-only">Take photo</span>
          </button>
        )}
      </div>
    </div>
  );
};
