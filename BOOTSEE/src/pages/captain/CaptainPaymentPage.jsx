import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import CaptainPaymentQR from "../../components/captain/CaptainPaymentQR";
import CaptainDashboardBackground from "../../components/CaptainDashboardBackground";
import { toast } from "react-toastify";

const CaptainPaymentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { rideId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rideData, setRideData] = useState(null);

  // Get ride data from location state or fetch from database
  useEffect(() => {
    const fetchRideData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // First check if ride data was passed in location state
        if (location.state && location.state.rideData) {
          setRideData(location.state.rideData);
          setLoading(false);
          return;
        }

        // If no ride data in state, fetch from database
        if (rideId) {
          const rideDoc = await getDoc(doc(db, "rides", rideId));

          if (rideDoc.exists()) {
            const data = rideDoc.data();

            // Verify this ride belongs to the current captain
            if (data.captainId !== user.uid) {
              setError("You don't have permission to access this ride");
              setLoading(false);
              return;
            }

            setRideData(data);
          } else {
            setError("Ride not found");
          }
        } else {
          // If no ride ID, create mock data for testing
          setRideData({
            id: "mock" + Math.floor(Math.random() * 1000000),
            status: "completed",
            fare: 350,
            distance: 8.5,
            duration: 25,
            pickupAddress: "123 Main Street, City Center",
            dropAddress: "456 Park Avenue, Downtown",
            createdAt: new Date(),
            captainId: user.uid
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching ride data:", err);
        setError("Failed to load ride data");
        setLoading(false);
      }
    };

    fetchRideData();
  }, [user, rideId, location.state]);

  // Handle payment completion
  const handlePaymentComplete = () => {
    toast.success("Payment completed successfully");

    // Navigate back to dashboard after a short delay
    setTimeout(() => {
      navigate("/captain/dashboard");
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative">
        <CaptainDashboardBackground />
        <div className="max-w-4xl mx-auto p-4 relative z-10 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative">
        <CaptainDashboardBackground />
        <div className="max-w-4xl mx-auto p-4 relative z-10">
          <div className="bg-red-900 bg-opacity-30 border border-red-800 text-red-200 p-4 rounded-lg">
            {error}
          </div>
          <button
            onClick={() => navigate("/captain/dashboard")}
            className="mt-4 px-6 py-2 bg-secondary text-white rounded-lg hover:bg-pink-700 transition duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative">
      {/* 3D Animated Background */}
      <CaptainDashboardBackground />

      <div className="max-w-4xl mx-auto p-4 relative z-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-secondary">Receive</span> Payment
          </h1>
          <p className="text-gray-300">
            Show the QR code to the rider to receive payment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment QR Code */}
          <div>
            <CaptainPaymentQR
              rideId={rideId || rideData?.id}
              amount={rideData?.fare || 0}
              onPaymentComplete={handlePaymentComplete}
            />
          </div>

          {/* Ride Details */}
          <div className="bg-black bg-opacity-70 rounded-xl p-6 shadow-lg border border-gray-800">
            <h2 className="text-xl font-semibold text-secondary mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Ride Details
            </h2>

            <div className="space-y-4">
              {/* Ride Status */}
              <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Status:</span>
                  <span className={`font-medium ${
                    rideData?.status === "completed" ? "text-green-400" :
                    rideData?.status === "cancelled" ? "text-red-400" :
                    "text-blue-400"
                  }`}>
                    {rideData?.status?.replace("_", " ").charAt(0).toUpperCase() + rideData?.status?.replace("_", " ").slice(1) || "N/A"}
                  </span>
                </div>
              </div>

              {/* Ride Route */}
              <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
                <div className="mb-3">
                  <p className="text-xs text-gray-400">Pickup Location</p>
                  <p className="text-sm text-white">{rideData?.pickupAddress || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Destination</p>
                  <p className="text-sm text-white">{rideData?.dropAddress || "N/A"}</p>
                </div>
              </div>

              {/* Ride Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">Distance</p>
                  <p className="text-sm font-medium text-white">{rideData?.distance || 0} km</p>
                </div>
                <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">Duration</p>
                  <p className="text-sm font-medium text-white">{rideData?.duration || 0} min</p>
                </div>
                <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">Fare</p>
                  <p className="text-sm font-medium text-secondary">₹{rideData?.fare || 0}</p>
                </div>
              </div>

              {/* Back Button */}
              <button
                onClick={() => navigate("/captain/dashboard")}
                className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200 mt-4"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptainPaymentPage;
