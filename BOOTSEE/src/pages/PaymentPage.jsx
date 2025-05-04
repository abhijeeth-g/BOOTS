import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UPIQRScanner from "../components/UPIQRScanner";
import AuthBackground from "../components/AuthBackground";

const PaymentPage = () => {
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

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
        navigate("/payment-success");
      }, 2000);
    }, 2000);
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
