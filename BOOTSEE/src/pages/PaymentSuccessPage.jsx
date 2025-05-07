import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthBackground from "../components/AuthBackground";

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(5);

  // Get ride data and amount from location state
  const rideData = location.state?.rideData || null;
  const amount = location.state?.amount || 0;

  // Auto-redirect to home after countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate("/home");
    }
  }, [countdown, navigate]);

  // Generate a random transaction ID
  const transactionId = `TXN${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return new Date().toLocaleString();

    try {
      let date;

      // Handle different timestamp formats
      if (timestamp.toDate) {
        // Firestore Timestamp
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        // JavaScript Date
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        // ISO string or other string format
        date = new Date(timestamp);
      } else {
        // Try to convert to date as a last resort
        date = new Date(timestamp);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return new Date().toLocaleString();
      }

      return date.toLocaleString();
    } catch (error) {
      return new Date().toLocaleString();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <AuthBackground />

      <div className="w-full max-w-md z-10">
        <div className="bg-gray-900 rounded-xl p-8 shadow-lg border border-gray-800">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-900 bg-opacity-30 flex items-center justify-center border border-green-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-center text-green-400 mb-2">
            Payment Successful!
          </h1>

          <p className="text-center text-white mb-6">
            Your payment has been processed successfully.
          </p>

          {/* Transaction Details */}
          <div className="bg-black bg-opacity-70 p-4 rounded-lg mb-6 border border-gray-800">
            <div className="flex justify-between mb-2">
              <span className="text-white">Transaction ID:</span>
              <span className="text-secondary font-medium">{transactionId}</span>
            </div>

            <div className="flex justify-between mb-2">
              <span className="text-white">Date & Time:</span>
              <span className="text-secondary font-medium">{new Date().toLocaleString()}</span>
            </div>

            <div className="flex justify-between mb-2">
              <span className="text-white">Payment Method:</span>
              <span className="text-secondary font-medium">UPI</span>
            </div>

            <div className="flex justify-between mb-2">
              <span className="text-white">Amount:</span>
              <span className="text-green-400 font-medium">₹{amount}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-white">Status:</span>
              <span className="text-green-400 font-medium">Completed</span>
            </div>
          </div>

          {/* Ride Details */}
          {rideData && (
            <div className="bg-black bg-opacity-70 p-4 rounded-lg mb-6 border border-gray-800">
              <h3 className="text-secondary font-medium mb-3">Ride Details</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Ride Date:</span>
                  <span className="text-white">{formatDate(rideData.createdAt)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">From:</span>
                  <span className="text-white max-w-[200px] text-right truncate">{rideData.pickupAddress}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">To:</span>
                  <span className="text-white max-w-[200px] text-right truncate">{rideData.dropAddress}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Distance:</span>
                  <span className="text-white">{rideData.distance} km</span>
                </div>

                {rideData.captainName && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Captain:</span>
                    <span className="text-white">{rideData.captainName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/home")}
              className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-pink-700 transition duration-200 font-medium"
            >
              Back to Home
            </button>

            <button
              onClick={() => {/* Download receipt functionality would go here */}}
              className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200"
            >
              Download Receipt
            </button>
          </div>

          {/* Auto-redirect notice */}
          <div className="mt-6 text-center text-sm text-white">
            Redirecting to home in {countdown} seconds...
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
