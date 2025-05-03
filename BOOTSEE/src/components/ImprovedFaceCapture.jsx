import { useState, useRef, useEffect } from "react";
import { storage } from "../firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ImprovedFaceCapture = ({ onCapture, userId }) => {
  // State management
  const [step, setStep] = useState("initial"); // initial, camera, preview, verifying, verified
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Clean up camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  // Start camera function
  const startCamera = async () => {
    try {
      setError(null);
      setStep("camera");
      
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 640 },
          facingMode: "user",
          aspectRatio: { ideal: 1 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          // Give camera time to initialize
          setTimeout(() => setCameraReady(true), 1000);
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        err.name === "NotAllowedError" 
          ? "Camera access denied. Please allow camera access in your browser settings."
          : `Could not access camera: ${err.message || "Unknown error"}`
      );
      setStep("initial");
    }
  };
  
  // Take photo function
  const takePhoto = () => {
    if (!cameraReady || !videoRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video (square)
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = size;
      canvas.height = size;
      
      // Calculate offset to center the crop
      const offsetX = (video.videoWidth - size) / 2;
      const offsetY = (video.videoHeight - size) / 2;
      
      // Draw video to canvas (cropped to square)
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        video, 
        offsetX, offsetY, size, size, // Source rectangle
        0, 0, size, size // Destination rectangle
      );
      
      // Get image data
      const imageData = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(imageData);
      setStep("preview");
      
      // Stop camera
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      
    } catch (err) {
      console.error("Error capturing photo:", err);
      setError(`Failed to capture photo: ${err.message || "Unknown error"}`);
    }
  };
  
  // Retake photo function
  const retakePhoto = () => {
    setCapturedImage(null);
    setCameraReady(false);
    startCamera();
  };
  
  // Verify photo function
  const verifyPhoto = async () => {
    setStep("verifying");
    
    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep("verified");
    } catch (err) {
      console.error("Error verifying photo:", err);
      setError(`Verification failed: ${err.message || "Unknown error"}`);
      setStep("preview");
    }
  };
  
  // Submit verified photo
  const submitVerifiedPhoto = () => {
    if (onCapture && capturedImage) {
      onCapture(capturedImage);
    }
  };
  
  // Use mock image (for testing)
  const useMockImage = () => {
    setCapturedImage("https://example.com/mock-face-image.jpg");
    setStep("preview");
  };
  
  return (
    <div className="bg-dark-primary rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-secondary mb-4">Face Verification</h3>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-900 bg-opacity-30 text-red-200 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {/* Step 1: Initial */}
      {step === "initial" && (
        <div className="flex flex-col items-center">
          <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg mb-6 w-full">
            <h4 className="text-sm font-medium text-secondary mb-2">Face Verification Required</h4>
            <p className="text-xs text-gray-300 mb-2">
              We need to verify your identity with a photo of your face.
            </p>
            <p className="text-xs text-gray-300">
              <span className="text-yellow-400">Note:</span> You'll need to allow camera access when prompted.
            </p>
          </div>
          
          <div className="w-64 h-64 bg-gray-800 rounded-lg mb-6 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-secondary text-white rounded-lg hover:bg-pink-700 transition duration-200 font-medium"
            >
              Take Photo
            </button>
            
            <button
              onClick={useMockImage}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200 text-sm"
            >
              Skip for Testing
            </button>
          </div>
        </div>
      )}
      
      {/* Step 2: Camera */}
      {step === "camera" && (
        <div className="flex flex-col items-center">
          <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg mb-4 w-full">
            <h4 className="text-sm font-medium text-secondary mb-2">Take Your Photo</h4>
            <p className="text-xs text-gray-300">
              Position your face in the square and make sure you're in a well-lit area.
            </p>
          </div>
          
          {/* Camera container */}
          <div className="relative w-64 h-64 bg-black rounded-lg mb-6 overflow-hidden">
            {/* Video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Square overlay */}
            <div className="absolute inset-0 border-2 border-secondary"></div>
            
            {/* Loading overlay */}
            {!cameraReady && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                <div className="text-center">
                  <svg className="animate-spin h-10 w-10 mb-2 mx-auto text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-white text-sm">Initializing camera...</p>
                </div>
              </div>
            )}
            
            {/* Face guide */}
            {cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border border-dashed border-secondary opacity-70"></div>
              </div>
            )}
          </div>
          
          {/* Camera controls */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={takePhoto}
              disabled={!cameraReady}
              className={`px-6 py-3 ${cameraReady ? 'bg-secondary' : 'bg-gray-600'} text-white rounded-lg hover:bg-pink-700 transition duration-200 font-medium flex items-center justify-center`}
            >
              {cameraReady ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take Photo
                </>
              ) : (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Preparing Camera...
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                if (stream) {
                  stream.getTracks().forEach(track => track.stop());
                  setStream(null);
                }
                setStep("initial");
              }}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Step 3: Preview */}
      {step === "preview" && (
        <div className="flex flex-col items-center">
          <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg mb-4 w-full">
            <h4 className="text-sm font-medium text-secondary mb-2">Review Your Photo</h4>
            <p className="text-xs text-gray-300">
              Is your face clearly visible? If not, you can retake the photo.
            </p>
          </div>
          
          {/* Photo preview */}
          <div className="relative w-64 h-64 bg-black rounded-lg mb-6 overflow-hidden">
            {capturedImage && capturedImage.startsWith('data:') ? (
              <img 
                src={capturedImage} 
                alt="Captured face" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-400">Mock image for testing</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Preview controls */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={verifyPhoto}
              className="px-6 py-3 bg-secondary text-white rounded-lg hover:bg-pink-700 transition duration-200 font-medium flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verify Photo
            </button>
            
            <button
              onClick={retakePhoto}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200 text-sm"
            >
              Retake Photo
            </button>
          </div>
        </div>
      )}
      
      {/* Step 4: Verifying */}
      {step === "verifying" && (
        <div className="flex flex-col items-center">
          <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg mb-4 w-full">
            <h4 className="text-sm font-medium text-secondary mb-2">Verifying Your Photo</h4>
            <p className="text-xs text-gray-300">
              Please wait while we verify your photo...
            </p>
          </div>
          
          {/* Photo with verification overlay */}
          <div className="relative w-64 h-64 bg-black rounded-lg mb-6 overflow-hidden">
            {capturedImage && capturedImage.startsWith('data:') ? (
              <img 
                src={capturedImage} 
                alt="Captured face" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800"></div>
            )}
            
            {/* Verification overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 mb-3 mx-auto text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-white">Verifying your face...</p>
              </div>
            </div>
          </div>
          
          {/* Verifying message */}
          <div className="w-full max-w-xs text-center text-gray-400 text-sm">
            This may take a few moments
          </div>
        </div>
      )}
      
      {/* Step 5: Verified */}
      {step === "verified" && (
        <div className="flex flex-col items-center">
          <div className="bg-green-900 bg-opacity-30 border border-green-500 text-green-300 p-4 rounded-lg mb-4 w-full">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-green-300 mb-1">Verification Successful</h4>
                <p className="text-xs text-green-200">
                  Your face has been verified successfully.
                </p>
              </div>
            </div>
          </div>
          
          {/* Photo with success overlay */}
          <div className="relative w-64 h-64 bg-black rounded-lg mb-6 overflow-hidden">
            {capturedImage && capturedImage.startsWith('data:') ? (
              <img 
                src={capturedImage} 
                alt="Verified face" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800"></div>
            )}
            
            {/* Success overlay */}
            <div className="absolute inset-0 bg-green-900 bg-opacity-50 flex items-center justify-center">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-3 mx-auto text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-white text-lg font-medium">Face Verified!</p>
              </div>
            </div>
          </div>
          
          {/* Verified controls */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={submitVerifiedPhoto}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 font-medium flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Continue
            </button>
            
            <button
              onClick={retakePhoto}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200 text-sm"
            >
              Retake Photo
            </button>
          </div>
        </div>
      )}
      
      {/* Hidden canvas for capturing photos */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ImprovedFaceCapture;
