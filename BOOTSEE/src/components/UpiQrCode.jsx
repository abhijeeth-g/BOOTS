import { useState, useEffect } from "react";
import QRCode from "qrcode";

const UpiQrCode = ({
  upiId = "9177813634-2@axl",
  amount = "",
  payeeName = "BOOTS Ride",
  note = "Ride Payment",
  isCaptainPayment = false
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setLoading(true);

        // Format UPI payment URL
        // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=CURRENCY&tn=NOTE
        const upiPaymentUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}${amount ? `&am=${amount}` : ""}&cu=INR&tn=${encodeURIComponent(note)}`;

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(upiPaymentUrl, {
          width: 256,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff"
          }
        });

        setQrCodeUrl(qrCodeDataUrl);
        setLoading(false);
      } catch (err) {
        console.error("Error generating QR code:", err);
        setError("Failed to generate QR code");
        setLoading(false);
      }
    };

    generateQRCode();
  }, [upiId, amount, payeeName, note]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-64 h-64 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Generating QR Code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-64 h-64 bg-red-100 border border-red-300 rounded-lg flex items-center justify-center">
          <p className="text-red-500 text-center px-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <img
          src={qrCodeUrl}
          alt="UPI Payment QR Code"
          className="w-64 h-64 object-contain"
        />
      </div>

      <div className="mt-4 text-center">
        <p className="text-lg font-semibold text-secondary">Scan to Pay</p>
        <p className="text-sm text-gray-400 mt-1">
          Scan this QR code with any UPI app to make payment
        </p>

        {/* Payment Breakdown for Captain */}
        {isCaptainPayment && amount && (
          <div className="mt-3 bg-gray-800 bg-opacity-50 p-3 rounded-lg text-left">
            <p className="text-sm font-medium text-white mb-2">Payment Breakdown:</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Fare:</span>
                <span className="text-white">₹{parseFloat(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Company Commission (10%):</span>
                <span className="text-red-400">-₹{(parseFloat(amount) * 0.1).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-gray-700 pt-1 mt-1">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-300">Your Earnings:</span>
                  <span className="text-green-400">₹{(parseFloat(amount) * 0.9).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Earnings will be transferred at the end of the month
            </p>
          </div>
        )}

        <div className="mt-2 flex justify-center space-x-2">
          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">Google Pay</span>
          <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs">PhonePe</span>
          <span className="bg-blue-400 text-white px-2 py-1 rounded-full text-xs">Paytm</span>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          UPI ID: {upiId}
        </p>
      </div>
    </div>
  );
};

export default UpiQrCode;
