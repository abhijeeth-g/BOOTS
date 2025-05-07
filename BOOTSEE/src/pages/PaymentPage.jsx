import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UPIQRScanner from "../components/UPIQRScanner";
import AuthBackground from "../components/AuthBackground";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent rides for payment
  useEffect(() => {
    const fetchRecentRides = async () => {
      if (!user) return;

      try {
        // Try to get ride data from location state (if navigated from ride details)
        if (location.state && location.state.rideData) {
          setCurrentRide(location.state.rideData);
        }

        // Query recent rides
        const ridesQuery = query(
          collection(db, "rides"),
          where("userId", "==", user.uid),
          where("status", "in", ["completed", "in_progress"]),
          orderBy("createdAt", "desc"),
          limit(5)
        );

        const snapshot = await getDocs(ridesQuery);

        if (snapshot.empty) {
          console.log("No recent rides found, creating mock data");

          // Create mock ride data
          const mockRides = [
            {
              id: "mock1",
              userId: user.uid,
              status: "completed",
              createdAt: new Date(),
              pickupAddress: "123 Main Street, City Center",
              dropAddress: "456 Park Avenue, Downtown",
              fare: 350,
              distance: 8.5,
              duration: 25,
              captainName: "John Driver"
            },
            {
              id: "mock2",
              userId: user.uid,
              status: "in_progress",
              createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
              pickupAddress: "789 Broadway, Uptown",
              dropAddress: "101 River Road, Riverside",
              fare: 420,
              distance: 10.2,
              duration: 32,
              captainName: "Sarah Driver"
            }
          ];

          setRecentRides(mockRides);

          // Set the first mock ride as current if none was passed
          if (!currentRide) {
            setCurrentRide(mockRides[0]);
          }
        } else {
          const rides = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          setRecentRides(rides);

          // Set the first ride as current if none was passed
          if (!currentRide && rides.length > 0) {
            setCurrentRide(rides[0]);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching rides:", error);

        // Create mock ride data on error
        const mockRides = [
          {
            id: "mock1",
            userId: user.uid,
            status: "completed",
            createdAt: new Date(),
            pickupAddress: "123 Main Street, City Center",
            dropAddress: "456 Park Avenue, Downtown",
            fare: 350,
            distance: 8.5,
            duration: 25,
            captainName: "John Driver"
          }
        ];

        setRecentRides(mockRides);
        setCurrentRide(mockRides[0]);
        setLoading(false);
      }
    };

    fetchRecentRides();
  }, [user, location.state]);

  // Handle scanned payment data
  const handlePaymentDataScanned = (data) => {
    console.log("Payment data received:", data);
    setPaymentData(data);
  };

  // Simulate payment processing
  const processPayment = () => {
    setPaymentStatus("processing");

    // Simulate payment processing delay
    setTimeout(() => {
      // Simulate successful payment (in a real app, this would be handled by a payment gateway)
      setPaymentStatus("success");

      // Navigate to success page or show success message
      setTimeout(() => {
        navigate("/payment-success", {
          state: {
            rideData: currentRide,
            amount: currentRide?.fare || 0
          }
        });
      }, 2000);
    }, 2000);
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

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
      } else if (typeof timestamp === 'number') {
        // Unix timestamp (milliseconds)
        date = new Date(timestamp);
      } else {
        // Try to convert to date as a last resort
        date = new Date(timestamp);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Just now";
      }

      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Just now";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <AuthBackground />

      <div className="w-full max-w-md z-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center text-white">
            <span className="text-secondary">Make Payment</span>
          </h1>
          <p className="text-center text-gray-300 mt-2">
            Scan a UPI QR code or enter UPI ID to make a payment
          </p>
        </div>

        {/* Payment Status */}
        {paymentStatus === "processing" && (
          <div className="bg-blue-900 bg-opacity-30 border border-blue-500 text-blue-300 p-4 rounded-lg mb-6 text-center">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing your payment...
            </div>
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="bg-green-900 bg-opacity-30 border border-green-500 text-green-300 p-4 rounded-lg mb-6 text-center">
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Payment successful! Redirecting...
            </div>
          </div>
        )}

        {/* QR Scanner */}
        {paymentStatus !== "processing" && paymentStatus !== "success" && (
          <UPIQRScanner onPaymentDataScanned={handlePaymentDataScanned} />
        )}

        {/* Ride Details */}
        {currentRide && (
          <div className="mt-6 bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
            <h2 className="text-lg font-semibold text-secondary mb-4">Ride Details</h2>

            <div className="bg-black bg-opacity-50 rounded-lg p-4 border border-gray-800 mb-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-xs text-gray-400">Ride Date</span>
                  <p className="text-sm text-white">{formatDate(currentRide.createdAt)}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400">Status</span>
                  <p className={`text-sm ${
                    currentRide.status === "completed" ? "text-green-400" :
                    currentRide.status === "in_progress" ? "text-blue-400" : "text-yellow-400"
                  }`}>
                    {currentRide.status?.replace("_", " ").charAt(0).toUpperCase() + currentRide.status?.replace("_", " ").slice(1)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-400">From</span>
                  <p className="text-sm text-white">{currentRide.pickupAddress}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">To</span>
                  <p className="text-sm text-white">{currentRide.dropAddress}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between">
                <div>
                  <span className="text-xs text-gray-400">Distance</span>
                  <p className="text-sm text-white">{currentRide.distance} km</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400">Captain</span>
                  <p className="text-sm text-white">{currentRide.captainName || "Unknown"}</p>
                </div>
              </div>
            </div>

            <div className="bg-black bg-opacity-50 rounded-lg p-4 border border-gray-800 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg text-white">Total Amount</span>
                <span className="text-xl font-bold text-secondary">₹{currentRide.fare}</span>
              </div>
            </div>

            <button
              onClick={processPayment}
              className="w-full bg-secondary hover:bg-pink-700 text-white py-3 rounded-lg font-medium transition duration-200 flex items-center justify-center"
              disabled={paymentStatus === "processing" || paymentStatus === "success"}
            >
              {paymentStatus === "processing" ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>Pay Now</>
              )}
            </button>
          </div>
        )}

        {/* Payment Methods */}
        <div className="mt-6 bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
          <h2 className="text-lg font-semibold text-secondary mb-4">Payment Methods</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black bg-opacity-70 p-3 rounded-lg flex flex-col items-center cursor-pointer hover:bg-gray-800 transition duration-200 border border-gray-800">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/2560px-Paytm_Logo_%28standalone%29.svg.png" alt="Paytm" className="h-6 mb-2" />
              <span className="text-xs text-white">Paytm</span>
            </div>

            <div className="bg-black bg-opacity-70 p-3 rounded-lg flex flex-col items-center cursor-pointer hover:bg-gray-800 transition duration-200 border border-gray-800">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/2560px-Google_Pay_Logo.svg.png" alt="Google Pay" className="h-6 mb-2" />
              <span className="text-xs text-white">Google Pay</span>
            </div>

            <div className="bg-black bg-opacity-70 p-3 rounded-lg flex flex-col items-center cursor-pointer hover:bg-gray-800 transition duration-200 border border-gray-800">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png" alt="PhonePe" className="h-6 mb-2" />
              <span className="text-xs text-white">PhonePe</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate(-1)}
              className="text-white text-sm hover:text-secondary transition duration-200"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
