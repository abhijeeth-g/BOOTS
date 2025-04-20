import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

const UpiPayment = ({ captainId, amount, rideId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [captainData, setCaptainData] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const fetchCaptainData = async () => {
      if (!captainId) {
        setError("Captain information not available");
        setLoading(false);
        return;
      }

      try {
        const captainDoc = await getDoc(doc(db, "captains", captainId));
        if (captainDoc.exists()) {
          setCaptainData(captainDoc.data());
        } else {
          setError("Captain information not found");
        }
      } catch (err) {
        console.error("Error fetching captain data:", err);
        setError("Failed to load captain information");
      } finally {
        setLoading(false);
      }
    };

    fetchCaptainData();
  }, [captainId]);

  // Generate UPI payment link
  const generateUpiLink = () => {
    if (!captainData || !captainData.upiId) return null;
    
    const upiId = captainData.upiId;
    const name = captainData.name || "Captain";
    const note = `Ride payment for trip ID: ${rideId?.substring(0, 8) || "RIDE"}`;
    
    // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=CURRENCY&tn=NOTE
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  if (loading) {
    return (
      <div className="bg-dark-primary rounded-xl shadow-md p-6">
        <div className="flex justify-center items-center h-20">
          <p className="text-gray-400">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-primary rounded-xl shadow-md p-6">
        <div className="flex justify-center items-center h-20">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!captainData || !captainData.upiId) {
    return (
      <div className="bg-dark-primary rounded-xl shadow-md p-6">
        <div className="flex justify-center items-center h-20 flex-col">
          <p className="text-yellow-400 mb-2">Captain has not set up UPI payment</p>
          <p className="text-gray-400 text-center">Please pay in cash or contact the captain directly.</p>
        </div>
      </div>
    );
  }

  const upiLink = generateUpiLink();

  return (
    <div className="bg-dark-primary rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-secondary mb-4">Pay for Your Ride</h2>
      
      <div className="bg-black bg-opacity-30 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Captain:</span>
          <span className="font-semibold">{captainData.name}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Amount:</span>
          <span className="font-semibold text-green-500">₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">UPI ID:</span>
          <span className="font-semibold">{captainData.upiId}</span>
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <a
          href={upiLink}
          className="w-full bg-secondary text-white py-3 rounded-lg font-medium hover:bg-pink-700 transition duration-200 text-center mb-4"
        >
          Pay with UPI App
        </a>
        
        <p className="text-sm text-gray-400 text-center">
          Click the button above to open your UPI payment app
        </p>
      </div>
    </div>
  );
};

export default UpiPayment;
