import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import RatingStars from "../../components/RatingStars";

const CaptainRideHistory = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, completed, cancelled

  useEffect(() => {
    const fetchRides = async () => {
      if (!user) return;

      try {
        let q;

        if (filter === "all") {
          q = query(
            collection(db, "rides"),
            where("captainId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
        } else {
          q = query(
            collection(db, "rides"),
            where("captainId", "==", user.uid),
            where("status", "==", filter),
            orderBy("createdAt", "desc")
          );
        }

        const snapshot = await getDocs(q);
        const rideData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRides(rideData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching rides:", error);
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

  return (
    <div className="min-h-screen bg-primary text-accent">
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-secondary mb-6">Ride History</h1>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg ${
              filter === "all"
                ? "bg-secondary text-white"
                : "bg-dark-primary text-gray-400 hover:bg-gray-800"
            }`}
          >
            All Rides
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded-lg ${
              filter === "completed"
                ? "bg-secondary text-white"
                : "bg-dark-primary text-gray-400 hover:bg-gray-800"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-4 py-2 rounded-lg ${
              filter === "cancelled"
                ? "bg-secondary text-white"
                : "bg-dark-primary text-gray-400 hover:bg-gray-800"
            }`}
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
                      <p className="text-xl font-semibold text-green-500">₹{ride.fare?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      <p className="text-xs text-gray-400">₹{Math.round(ride.fare / ride.distance).toLocaleString('en-IN')}/km</p>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="mt-4 bg-black bg-opacity-20 p-3 rounded-lg">
                    <div className="flex items-start mb-2">
                      <div className="mt-1 mr-3">
                        <div className="w-3 h-3 rounded-full bg-secondary"></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Pickup</p>
                        <p className="text-sm">{ride.pickupAddress || "Unknown location"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mt-1 mr-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Destination</p>
                        <p className="text-sm">{ride.dropAddress || "Unknown location"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-4 flex flex-wrap gap-4">
                    <div className="bg-black bg-opacity-20 px-3 py-2 rounded-lg">
                      <p className="text-xs text-gray-400">Distance</p>
                      <p className="text-sm font-medium">{ride.distance} km</p>
                    </div>

                    {ride.startedAt && ride.completedAt && (
                      <div className="bg-black bg-opacity-20 px-3 py-2 rounded-lg">
                        <p className="text-xs text-gray-400">Duration</p>
                        <p className="text-sm font-medium">{calculateDuration(ride.startedAt, ride.completedAt)}</p>
                      </div>
                    )}

                    {ride.userRating > 0 && (
                      <div className="bg-black bg-opacity-20 px-3 py-2 rounded-lg">
                        <p className="text-xs text-gray-400">User Rating</p>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-1">{ride.userRating.toFixed(1)}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${star <= Math.round(ride.userRating) ? 'text-yellow-400' : 'text-gray-600'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptainRideHistory;
