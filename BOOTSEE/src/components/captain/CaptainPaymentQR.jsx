import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import UpiQrCode from "../UpiQrCode";
import { toast } from "react-toastify";

const CaptainPaymentQR = ({ rideId, amount, onPaymentComplete }) => {
  const { user } = useAuth();
  const [captainData, setCaptainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upiId, setUpiId] = useState("");
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, verifying, completed
  const [verificationTimer, setVerificationTimer] = useState(null);
  const [countdown, setCountdown] = useState(30);

  // Fetch captain data
  useEffect(() => {
    const fetchCaptainData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const captainDoc = await getDoc(doc(db, "captains", user.uid));

        if (captainDoc.exists()) {
          const data = captainDoc.data();
          setCaptainData(data);
          setUpiId(data.upiId || "");
        } else {
          setError("Captain profile not found");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching captain data:", err);
        setError("Failed to load captain data");
        setLoading(false);
      }
    };

    fetchCaptainData();
  }, [user]);

  // Handle UPI ID update
  const handleUpiIdUpdate = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db, "captains", user.uid), {
        upiId: upiId
      });

      setCaptainData(prev => ({
        ...prev,
        upiId: upiId
      }));

      setIsEditingUpi(false);
      toast.success("UPI ID updated successfully");
    } catch (err) {
      console.error("Error updating UPI ID:", err);
      toast.error("Failed to update UPI ID");
    }
  };

  // Start payment verification process
  const startVerification = () => {
    setPaymentStatus("verifying");

    // Start countdown
    setCountdown(30);

    // Set up timer to count down
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setVerificationTimer(timer);
  };

  // Mark payment as completed
  const markPaymentComplete = async () => {
    if (verificationTimer) {
      clearInterval(verificationTimer);
    }

    setPaymentStatus("completed");

    try {
      // Update ride status in database if we have a valid ride ID
      if (rideId && rideId !== "mock1" && !rideId.startsWith("mock")) {
        await updateDoc(doc(db, "rides", rideId), {
          paymentStatus: "completed",
          paymentMethod: "upi",
          paymentTimestamp: serverTimestamp(),
          paymentAmount: amount,
          paymentReceivedBy: user.uid,
          paymentUpiId: captainData?.upiId || ""
        });
        console.log(`Updated payment status for ride ${rideId}`);
      } else {
        console.log("Using mock ride ID, skipping database update");
      }

      // Call the callback function
      if (onPaymentComplete) {
        onPaymentComplete();
      }

      toast.success("Payment marked as completed");
    } catch (err) {
      console.error("Error updating payment status:", err);
      toast.error("Failed to update payment status");

      // Still call the callback even if the database update fails
      // This ensures the UI flow continues even if there's a backend error
      if (onPaymentComplete) {
        onPaymentComplete();
      }
    }
  };

  // Cancel verification
  const cancelVerification = () => {
    if (verificationTimer) {
      clearInterval(verificationTimer);
    }

    setPaymentStatus("pending");
    setCountdown(30);
  };

  if (loading) {
    return (
      <div className="bg-black bg-opacity-70 rounded-xl p-6 shadow-lg border border-gray-800">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black bg-opacity-70 rounded-xl p-6 shadow-lg border border-gray-800">
        <div className="bg-red-900 bg-opacity-30 border border-red-800 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black bg-opacity-70 rounded-xl p-6 shadow-lg border border-gray-800">
      <h2 className="text-xl font-semibold text-secondary mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Receive Payment
      </h2>

      {/* UPI ID Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-300">Your UPI ID</p>
          <button
            onClick={() => setIsEditingUpi(!isEditingUpi)}
            className="text-secondary text-sm hover:text-pink-400 transition duration-200"
          >
            {isEditingUpi ? "Cancel" : "Edit"}
          </button>
        </div>

        {isEditingUpi ? (
          <div className="flex space-x-2">
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-white"
            />
            <button
              onClick={handleUpiIdUpdate}
              className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-pink-700 transition duration-200"
            >
              Save
            </button>
          </div>
        ) : (
          <p className="bg-gray-800 px-3 py-2 rounded-lg text-white">
            {captainData?.upiId || "No UPI ID set"}
          </p>
        )}
      </div>

      {/* Payment Amount */}
      <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg mb-6 border border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Ride Amount:</span>
          <span className="text-xl font-bold text-secondary">₹{amount}</span>
        </div>
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className="text-gray-400">Your Earnings (90%):</span>
          <span className="text-green-400 font-medium">₹{(amount * 0.9).toFixed(2)}</span>
        </div>
      </div>

      {/* QR Code Section */}
      {paymentStatus === "pending" && (
        <div className="mb-6">
          {!captainData?.upiId ? (
            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-800 p-4 rounded-lg mb-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-yellow-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-yellow-200 font-medium mb-2">No UPI ID Set</p>
              <p className="text-gray-300 text-sm mb-3">
                Please set your UPI ID above to receive payments directly to your account.
              </p>
              <p className="text-gray-400 text-xs">
                Using default BOOTS UPI ID for now.
              </p>
            </div>
          ) : (
            <p className="text-center text-gray-300 mb-4">
              Show this QR code to the rider for payment
            </p>
          )}

          <UpiQrCode
            upiId={captainData?.upiId || "9177813634-2@axl"}
            amount={amount}
            payeeName={captainData?.name || "BOOTS Captain"}
            note={`Ride payment for trip ID: ${rideId?.substring(0, 8) || "RIDE"}`}
            isCaptainPayment={true}
          />

          <div className="mt-6 flex justify-center">
            <button
              onClick={startVerification}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Payment Received
            </button>
          </div>
        </div>
      )}

      {/* Verification Section */}
      {paymentStatus === "verifying" && (
        <div className="bg-blue-900 bg-opacity-30 border border-blue-800 p-4 rounded-lg mb-6">
          <p className="text-center text-white mb-4">
            Verifying payment... Please wait {countdown} seconds
          </p>

          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000"
              style={{ width: `${(countdown / 30) * 100}%` }}
            ></div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={cancelVerification}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200"
            >
              Cancel
            </button>

            <button
              onClick={markPaymentComplete}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
            >
              Confirm Payment
            </button>
          </div>
        </div>
      )}

      {/* Payment Completed Section */}
      {paymentStatus === "completed" && (
        <div className="bg-green-900 bg-opacity-30 border border-green-800 p-4 rounded-lg mb-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>

          <p className="text-green-200 text-lg font-medium mb-2">
            Payment Completed!
          </p>

          <p className="text-gray-300 text-sm">
            The ride payment has been successfully received.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg text-sm">
        <h3 className="font-medium text-secondary mb-2">Instructions:</h3>
        <ol className="text-gray-300 space-y-2 list-decimal pl-5">
          <li>Show the QR code to the rider</li>
          <li>Ask them to scan it with their UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
          <li>Once they complete the payment, click "Payment Received"</li>
          <li>Verify the payment in your UPI app and confirm</li>
        </ol>
      </div>
    </div>
  );
};

export default CaptainPaymentQR;
