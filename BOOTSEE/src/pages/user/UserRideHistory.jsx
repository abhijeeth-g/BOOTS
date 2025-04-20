import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import RateCaptain from "../../components/RateCaptain";
import UpiPayment from "../../components/UpiPayment";

const UserRideHistory = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedRide, setSelectedRide] = useState(null);
  const [paymentRide, setPaymentRide] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchRides = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, "rides"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        if (filter !== "all") {
          q = query(
            collection(db, "rides"),
            where("userId", "==", user.uid),
            where("status", "==", filter),
            orderBy("createdAt", "desc")
          );
        }

        const snapshot = await getDocs(q);
        const ridesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRides(ridesData);
      } catch (error) {
        console.error("Error fetching rides:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, [user, filter]);

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Calculate ride duration
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "N/A";

    try {
      const start = startTime.toDate();
      const end = endTime.toDate();
      const durationMs = end - start;

      const minutes = Math.floor(durationMs / (1000 * 60));

      if (minutes < 60) {
        return `${minutes} min${minutes !== 1 ? 's' : ''}`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMinutes} min${remainingMinutes !== 1 ? 's' : ''}`;
      }
    } catch (error) {
      return "N/A";
    }
  };

  const handleRatingSubmitted = () => {
    // Refresh the rides list after rating is submitted
    setSelectedRide(null);

    // Refresh the rides list
    if (!user) return;

    const fetchRides = async () => {
      try {
        let q = query(
          collection(db, "rides"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        if (filter !== "all") {
          q = query(
            collection(db, "rides"),
            where("userId", "==", user.uid),
            where("status", "==", filter),
            orderBy("createdAt", "desc")
          );
        }

        const snapshot = await getDocs(q);
        const ridesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRides(ridesData);
      } catch (error) {
        console.error("Error fetching rides:", error);
      }
    };

    fetchRides();
  };

  return (
    <div className="min-h-screen bg-primary text-accent">
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-secondary mb-6">Your Ride History</h1>

        {/* Filter buttons */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full ${
              filter === "all"
                ? "bg-secondary text-white"
                : "bg-dark-primary text-gray-400 hover:bg-gray-800"
            } transition duration-200`}
          >
            All Rides
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded-full ${
              filter === "completed"
                ? "bg-green-600 text-white"
                : "bg-dark-primary text-gray-400 hover:bg-gray-800"
            } transition duration-200`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("in_progress")}
            className={`px-4 py-2 rounded-full ${
              filter === "in_progress"
                ? "bg-blue-600 text-white"
                : "bg-dark-primary text-gray-400 hover:bg-gray-800"
            } transition duration-200`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-full ${
              filter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-dark-primary text-gray-400 hover:bg-gray-800"
            } transition duration-200`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-4 py-2 rounded-full ${
              filter === "cancelled"
                ? "bg-red-600 text-white"
                : "bg-dark-primary text-gray-400 hover:bg-gray-800"
            } transition duration-200`}
          >
            Cancelled
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading ride history...</p>
          </div>
        ) : rides.length === 0 ? (
          <div className="bg-dark-primary rounded-xl p-8 text-center">
            <p className="text-gray-400">No rides found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div key={ride.id} className="bg-dark-primary rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-l-4 border-secondary">
                  {/* Header with status and fare */}
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block w-3 h-3 rounded-full ${
                          ride.status === "completed" ? "bg-green-500" :
                          ride.status === "cancelled" ? "bg-red-500" :
                          ride.status === "in_progress" ? "bg-blue-500" :
                          "bg-yellow-500"
                        }`}></span>
                        <span className="font-medium capitalize">{ride.status}</span>
                        {ride.status === "completed" && ride.completedAt && ride.startedAt && (
                          <span className="text-xs text-gray-400 ml-2">
                            ({calculateDuration(ride.startedAt, ride.completedAt)})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{formatDate(ride.createdAt)}</p>
                    </div>

                    <div className="mt-2 md:mt-0 text-right">
                      <p className="text-xl font-semibold text-green-500 bg-white px-2 py-1 rounded-md mb-1">₹{ride.fare?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      <p className="text-xs text-gray-700 bg-white px-2 py-1 rounded-md">₹{Math.round(ride.fare / ride.distance).toLocaleString('en-IN')}/km</p>
                    </div>
                  </div>

                  {/* Captain info (if assigned) */}
                  {ride.captainId && (
                    <div className="mt-4 bg-black bg-opacity-20 p-3 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-sm font-bold text-white mr-3">
                          {ride.captainName?.charAt(0) || "C"}
                        </div>
                        <div>
                          <p className="font-medium">{ride.captainName || "Captain"}</p>
                          <div className="flex items-center text-xs text-gray-400">
                            <span className="flex items-center">
                              <span className="text-yellow-400 mr-1">★</span>
                              {ride.captainRating?.toFixed(1) || ride.captainRating || "N/A"}
                            </span>
                            <span className="mx-1">•</span>
                            <span>{ride.captainVehicle} ({ride.captainVehicleNumber})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Locations */}
                  <div className="mt-4 bg-black bg-opacity-20 p-3 rounded-lg">
                    <div className="flex items-start mb-2">
                      <div className="mt-1 mr-3">
                        <div className="w-2 h-2 rounded-full bg-secondary"></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Pickup</p>
                        <p className="text-sm">{ride.pickupAddress || "Unknown location"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mt-1 mr-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Destination</p>
                        <p className="text-sm">{ride.dropAddress || "Unknown location"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ride details */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="bg-white px-3 py-2 rounded-lg">
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="text-sm font-medium text-gray-700">{ride.distance} km</p>
                    </div>

                    <div className="bg-white px-3 py-2 rounded-lg">
                      <p className="text-xs text-gray-500">Est. Time</p>
                      <p className="text-sm font-medium text-gray-700">{ride.estimatedTime || Math.ceil(ride.distance * 3)} mins</p>
                    </div>

                    {ride.startedAt && ride.completedAt && (
                      <div className="bg-white px-3 py-2 rounded-lg">
                        <p className="text-xs text-gray-500">Actual Time</p>
                        <p className="text-sm font-medium text-gray-700">{calculateDuration(ride.startedAt, ride.completedAt)}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-col space-y-2">
                    {/* Rate Captain Button */}
                    {ride.status === "completed" && ride.captainId && !ride.captainRating && (
                      <button
                        onClick={() => setSelectedRide(ride)}
                        className="w-full bg-secondary text-white py-2 rounded-lg hover:bg-pink-700 transition duration-200"
                      >
                        Rate Captain
                      </button>
                    )}

                    {/* Payment Button */}
                    {ride.status === "completed" && ride.captainId && (
                      <button
                        onClick={() => setPaymentRide(ride)}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition duration-200"
                      >
                        Pay with UPI
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rating Modal */}
        {selectedRide && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full">
              <RateCaptain
                rideId={selectedRide.id}
                captainId={selectedRide.captainId}
                onRatingSubmitted={handleRatingSubmitted}
              />
              <button
                onClick={() => setSelectedRide(null)}
                className="mt-4 w-full bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {paymentRide && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full">
              <UpiPayment
                captainId={paymentRide.captainId}
                amount={paymentRide.fare}
                rideId={paymentRide.id}
              />
              <button
                onClick={() => setPaymentRide(null)}
                className="mt-4 w-full bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition duration-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRideHistory;
