import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

const PaymentOptions = ({ fare, onSelectPayment, captainId, rideId }) => {
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [captainData, setCaptainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    if (captainId) {
      fetchCaptainData();
    } else {
      setLoading(false);
    }
  }, [captainId]);

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    if (onSelectPayment) {
      onSelectPayment(method);
    }
  };

  // Generate UPI payment link
  const generateUpiLink = () => {
    if (!captainData || !captainData.upiId) return null;

    const upiId = captainData.upiId;
    const name = captainData.name || "Captain";
    const note = `Ride payment for trip ID: ${rideId?.substring(0, 8) || "RIDE"}`;

    // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=CURRENCY&tn=NOTE
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${fare}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  // Generate specific app UPI links
  const generateGooglePayLink = () => {
    if (!captainData?.upiId) return null;
    return `gpay://upi/pay?pa=${captainData.upiId}&pn=${encodeURIComponent(captainData.name || "Captain")}&am=${fare}&cu=INR&tn=${encodeURIComponent(`Ride payment for ${rideId?.substring(0, 8) || "RIDE"}`)}`;
  };

  const generatePhonePeLink = () => {
    if (!captainData?.upiId) return null;
    return `phonepe://pay?pa=${captainData.upiId}&pn=${encodeURIComponent(captainData.name || "Captain")}&am=${fare}&cu=INR&tn=${encodeURIComponent(`Ride payment for ${rideId?.substring(0, 8) || "RIDE"}`)}`;
  };

  const generatePaytmLink = () => {
    if (!captainData?.upiId) return null;
    return `paytmmp://pay?pa=${captainData.upiId}&pn=${encodeURIComponent(captainData.name || "Captain")}&am=${fare}&cu=INR&tn=${encodeURIComponent(`Ride payment for ${rideId?.substring(0, 8) || "RIDE"}`)}`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-xl mt-4 border border-gray-700 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Payment Options
      </h3>

      {/* Payment Methods */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div
          className={`p-4 rounded-lg text-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
            selectedMethod === "upi"
              ? "bg-white bg-opacity-10 border-2 border-secondary shadow-lg"
              : "bg-white bg-opacity-5 border border-gray-700 hover:border-gray-500"
          }`}
          onClick={() => handleSelectMethod("upi")}
        >
          <div className="flex justify-center mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">U</div>
          </div>
          <p className="text-xs text-gray-400 mb-1">UPI</p>
          <p className="text-sm font-semibold">Pay Instantly</p>
        </div>

        <div
          className={`p-4 rounded-lg text-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
            selectedMethod === "card"
              ? "bg-white bg-opacity-10 border-2 border-secondary shadow-lg"
              : "bg-white bg-opacity-5 border border-gray-700 hover:border-gray-500"
          }`}
          onClick={() => handleSelectMethod("card")}
        >
          <div className="flex justify-center mb-2">
            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold">C</div>
          </div>
          <p className="text-xs text-gray-400 mb-1">Card</p>
          <p className="text-sm font-semibold">Credit/Debit</p>
        </div>

        <div
          className={`p-4 rounded-lg text-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
            selectedMethod === "cash"
              ? "bg-white bg-opacity-10 border-2 border-secondary shadow-lg"
              : "bg-white bg-opacity-5 border border-gray-700 hover:border-gray-500"
          }`}
          onClick={() => handleSelectMethod("cash")}
        >
          <div className="flex justify-center mb-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">₹</div>
          </div>
          <p className="text-xs text-gray-400 mb-1">Cash</p>
          <p className="text-sm font-semibold">Pay Later</p>
        </div>
      </div>

      {/* Selected Payment Method Details */}
      <div className="bg-black bg-opacity-30 p-5 rounded-lg mb-5 border border-gray-700">
        {selectedMethod === "upi" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-gray-400">Payment Method</p>
              <div className="flex items-center">
                <span className="text-white font-medium mr-2">UPI</span>
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">UPI</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-400">Amount</p>
              <p className="text-secondary font-bold">₹{fare?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-400">Captain UPI ID</p>
              <p className="text-white">{captainData?.upiId || "Not available"}</p>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <p className="text-gray-300 font-medium">Total</p>
                <p className="text-white font-bold">₹{fare?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            {captainData?.upiId && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <a
                  href={generateGooglePayLink()}
                  className="bg-blue-500 text-white text-center py-2 px-2 rounded-lg text-xs font-medium"
                >
                  Google Pay
                </a>
                <a
                  href={generatePhonePeLink()}
                  className="bg-purple-600 text-white text-center py-2 px-2 rounded-lg text-xs font-medium"
                >
                  PhonePe
                </a>
                <a
                  href={generatePaytmLink()}
                  className="bg-blue-400 text-white text-center py-2 px-2 rounded-lg text-xs font-medium"
                >
                  Paytm
                </a>
              </div>
            )}
          </div>
        )}

        {selectedMethod === "card" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-gray-400">Payment Method</p>
              <div className="flex items-center">
                <span className="text-white font-medium mr-2">Card</span>
                <div className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">CARD</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-400">Amount</p>
              <p className="text-secondary font-bold">₹{fare?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-400">Card Processing Fee</p>
              <p className="text-yellow-500">+ ₹{(fare * 0.02).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <p className="text-gray-300 font-medium">Total</p>
                <p className="text-white font-bold">₹{(fare * 1.02).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        )}

        {selectedMethod === "cash" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-gray-400">Payment Method</p>
              <div className="flex items-center">
                <span className="text-white font-medium mr-2">Cash</span>
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">CASH</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-400">Amount</p>
              <p className="text-secondary font-bold">₹{fare?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-400">Pay to</p>
              <p className="text-gray-300">Captain directly</p>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <p className="text-gray-300 font-medium">Total</p>
                <p className="text-white font-bold">₹{fare?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Button */}
      {selectedMethod === "upi" && captainData?.upiId ? (
        <a
          href={generateUpiLink()}
          className="block w-full bg-gradient-to-r from-secondary to-pink-600 text-white py-4 px-4 rounded-xl hover:from-pink-600 hover:to-secondary transition duration-300 font-medium text-center shadow-lg transform hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pay Now with Any UPI App
          </div>
        </a>
      ) : (
        <button
          onClick={() => onSelectPayment(selectedMethod)}
          className="w-full bg-gradient-to-r from-secondary to-pink-600 text-white py-4 px-4 rounded-xl hover:from-pink-600 hover:to-secondary transition duration-300 font-medium shadow-lg transform hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex items-center justify-center">
            {selectedMethod === "cash" ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Pay Later with Cash
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Pay Now
              </>
            )}
          </div>
        </button>
      )}

      <div className="bg-black bg-opacity-30 p-3 rounded-lg mt-4">
        <p className="text-xs text-gray-400 text-center">
          {selectedMethod === "upi" && "Your payment is secure and processed instantly through UPI"}
          {selectedMethod === "card" && "Your card details are secure with 256-bit encryption technology"}
          {selectedMethod === "cash" && "Please pay the exact amount to the captain after your ride is completed"}
        </p>
      </div>
    </div>
  );
};

export default PaymentOptions;
