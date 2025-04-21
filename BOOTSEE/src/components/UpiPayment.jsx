import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { gsap } from "gsap";

const UpiPayment = ({ captainId, amount, rideId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [captainData, setCaptainData] = useState(null);

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

  // Animation effect when component mounts
  useEffect(() => {
    if (!loading && !error && captainData) {
      // Animate the payment elements
      gsap.fromTo(".payment-element",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [loading, error, captainData]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-lg p-6 border border-gray-700">
        <div className="flex justify-center items-center h-24">
          <svg className="animate-spin h-8 w-8 text-secondary mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-300">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-lg p-6 border border-gray-700">
        <div className="flex justify-center items-center h-24">
          <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-300 p-4 rounded-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!captainData || !captainData.upiId) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-lg p-6 border border-gray-700">
        <div className="flex justify-center items-center h-32 flex-col">
          <div className="bg-yellow-900 bg-opacity-30 border border-yellow-500 text-yellow-300 p-4 rounded-lg flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-yellow-300 font-medium mb-2">Captain has not set up UPI payment</p>
            <p className="text-gray-300 text-center text-sm">Please pay in cash or contact the captain directly.</p>
          </div>
        </div>
      </div>
    );
  }

  const upiLink = generateUpiLink();

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-lg p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-2 flex items-center payment-element">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Pay for Your Ride
      </h2>
      <p className="text-gray-400 ml-8 mb-4 payment-element">Complete your payment using UPI</p>

      <div className="bg-white bg-opacity-5 p-5 rounded-lg mb-6 border border-gray-700 payment-element">
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-700">
          <span className="text-gray-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Captain:
          </span>
          <span className="font-semibold text-white">{captainData.name}</span>
        </div>
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-700">
          <span className="text-gray-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Amount:
          </span>
          <span className="font-semibold text-white bg-green-800 px-3 py-1 rounded-full">₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            UPI ID:
          </span>
          <span className="font-semibold text-white bg-black bg-opacity-30 px-3 py-1 rounded-lg">{captainData.upiId}</span>
        </div>
      </div>

      <div className="flex flex-col items-center payment-element">
        <a
          href={upiLink}
          className="w-full bg-gradient-to-r from-secondary to-pink-600 text-white py-4 rounded-lg font-medium hover:from-pink-600 hover:to-secondary transition duration-300 text-center mb-4 shadow-lg transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Pay with UPI App
        </a>

        <div className="bg-black bg-opacity-30 p-3 rounded-lg w-full text-center">
          <p className="text-sm text-gray-300">
            Click the button above to open your UPI payment app
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpiPayment;
