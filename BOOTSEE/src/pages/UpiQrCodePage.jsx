import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UpiQrCode from "../components/UpiQrCode";
import AuthBackground from "../components/AuthBackground";

const UpiQrCodePage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("BOOTS Ride Payment");
  
  // UPI ID is hardcoded as per requirement
  const upiId = "9177813634-2@axl";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <AuthBackground />

      <div className="w-full max-w-md z-10">
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-secondary">
              Scan & Pay
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Amount (Optional)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-white"
            />
          </div>

          {/* Note Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter payment note"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-white"
            />
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <UpiQrCode 
              upiId={upiId}
              amount={amount}
              payeeName="BOOTS Ride"
              note={note}
            />
          </div>

          {/* UPI ID Display */}
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <p className="text-center text-sm text-gray-400 mb-1">UPI ID</p>
            <p className="text-center text-lg font-medium text-secondary">{upiId}</p>
          </div>

          {/* Instructions */}
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
            <h3 className="font-medium text-secondary mb-2">How to pay:</h3>
            <ol className="text-sm text-gray-300 space-y-2 list-decimal pl-5">
              <li>Open any UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
              <li>Scan the QR code shown above</li>
              <li>Enter the amount (if not already specified)</li>
              <li>Complete the payment in your UPI app</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpiQrCodePage;
