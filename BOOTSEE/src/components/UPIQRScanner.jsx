import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const UPIQRScanner = ({ onPaymentDataScanned }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const scannerRef = useRef(null);
  const qrBoxSize = Math.min(window.innerWidth * 0.7, 250);

  // Start QR scanning
  const startScanner = async () => {
    setError(null);
    setScanResult(null);
    setPaymentData(null);

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      setScanning(true);

      const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        console.log(`QR Code detected: ${decodedText}`);
        setScanResult(decodedText);

        // Parse UPI payment data
        try {
          parseUPIData(decodedText);
        } catch (err) {
          setError("Invalid UPI QR code. Please scan a valid UPI payment QR code.");
        }

        // Stop scanner after successful scan
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(err => console.error("Error stopping scanner:", err));
        }

        setScanning(false);
      };

      const config = {
        fps: 10,
        qrbox: { width: qrBoxSize, height: qrBoxSize },
        aspectRatio: 1
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        (errorMessage) => {
          // This is a non-fatal error, so we don't need to stop scanning
          console.log(`QR Code scanning error: ${errorMessage}`);
        }
      );
    } catch (err) {
      console.error("Error starting QR scanner:", err);
      setError(`Could not start scanner: ${err.message || "Unknown error"}`);
      setScanning(false);
    }
  };

  // Stop QR scanning
  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
    }
    setScanning(false);
  };

  // Parse UPI data from QR code
  const parseUPIData = (qrText) => {
    // UPI QR codes typically start with "upi://" or contain "pa=" (payee address)
    if (!qrText.includes('upi://') && !qrText.includes('pa=')) {
      throw new Error("Not a valid UPI QR code");
    }

    // Parse the UPI string
    const upiData = {};

    // Handle both URL format and query string format
    let queryString = qrText;
    if (qrText.startsWith('upi://')) {
      // Extract query string from UPI URL
      queryString = qrText.split('?')[1] || '';
    }

    // Parse parameters
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        upiData[key] = decodeURIComponent(value);
      }
    });

    // Extract common UPI parameters
    const parsedData = {
      payeeAddress: upiData.pa || upiData.pn || '',
      payeeName: upiData.pn || '',
      transactionNote: upiData.tn || '',
      amount: upiData.am || '',
      currencyCode: upiData.cu || 'INR',
      merchantCode: upiData.mc || '',
      referenceId: upiData.tid || upiData.tr || '',
    };

    console.log("Parsed UPI data:", parsedData);
    setPaymentData(parsedData);

    // Call the callback with the parsed data
    if (onPaymentDataScanned) {
      onPaymentDataScanned(parsedData);
    }

    return parsedData;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
      }
    };
  }, []);

  // Render payment details
  const renderPaymentDetails = () => {
    if (!paymentData) return null;

    return (
      <div className="bg-black bg-opacity-70 p-4 rounded-lg mt-4 border border-gray-800">
        <h3 className="text-lg font-medium text-secondary mb-3">Payment Details</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white">UPI ID:</span>
            <span className="text-secondary font-medium">{paymentData.payeeAddress}</span>
          </div>

          {paymentData.payeeName && (
            <div className="flex justify-between">
              <span className="text-white">Payee Name:</span>
              <span className="text-secondary font-medium">{paymentData.payeeName}</span>
            </div>
          )}

          {paymentData.amount && (
            <div className="flex justify-between">
              <span className="text-white">Amount:</span>
              <span className="text-secondary font-medium">₹{paymentData.amount}</span>
            </div>
          )}

          {paymentData.transactionNote && (
            <div className="flex justify-between">
              <span className="text-white">Note:</span>
              <span className="text-secondary font-medium">{paymentData.transactionNote}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => window.open(`upi://pay?pa=${paymentData.payeeAddress}&pn=${paymentData.payeeName || ''}&am=${paymentData.amount || ''}&cu=${paymentData.currencyCode || 'INR'}&tn=${paymentData.transactionNote || ''}`)}
            className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-pink-700 transition duration-200 font-medium"
          >
            Pay Now
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
      <h2 className="text-xl font-semibold text-secondary mb-4">UPI QR Scanner</h2>

      {error && (
        <div className="bg-red-900 bg-opacity-30 text-red-200 p-3 rounded-lg mb-4 border border-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center">
        {/* QR Scanner */}
        <div
          id="qr-reader"
          style={{
            width: '100%',
            maxWidth: '300px',
            display: scanning ? 'block' : 'none'
          }}
        ></div>

        {/* Scanner Controls */}
        <div className="mt-4 w-full flex justify-center">
          {!scanning ? (
            <button
              onClick={startScanner}
              className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-pink-700 transition duration-200 font-medium"
              disabled={scanning}
            >
              Scan QR Code
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200 font-medium"
            >
              Cancel Scan
            </button>
          )}
        </div>

        {/* Manual UPI ID Input */}
        {!scanning && !paymentData && (
          <div className="mt-6 w-full">
            <div className="text-center text-sm text-white mb-2">
              Or enter UPI ID manually
            </div>
            <div className="flex">
              <input
                type="text"
                placeholder="Enter UPI ID (e.g., name@upi)"
                className="flex-1 px-4 py-2 bg-black bg-opacity-70 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-secondary text-white"
              />
              <button
                className="px-4 py-2 bg-secondary text-white rounded-r-lg hover:bg-pink-700 transition duration-200 font-medium"
              >
                Proceed
              </button>
            </div>
          </div>
        )}

        {/* Payment Details */}
        {renderPaymentDetails()}

        {/* Instructions */}
        {!paymentData && !scanning && (
          <div className="mt-6 bg-black bg-opacity-50 p-4 rounded-lg w-full border border-gray-800">
            <h3 className="text-sm font-medium text-secondary mb-2">How to use:</h3>
            <ol className="list-decimal list-inside text-xs text-white space-y-1">
              <li>Click "Scan QR Code" to start the scanner</li>
              <li>Point your camera at a UPI QR code</li>
              <li>The payment details will be displayed automatically</li>
              <li>Click "Pay Now" to complete the payment</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default UPIQRScanner;
