import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentRides, setRecentRides] = useState([]);
  const [nearbyCaptains, setNearbyCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRideForm, setShowRideForm] = useState(false);

  // Fetch recent rides
  useEffect(() => {
    const fetchRecentRides = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "rides"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(3)
        );

        const snapshot = await getDocs(q);
        const rides = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log("Recent rides data:", rides);
        setRecentRides(rides);
      } catch (error) {
        console.error("Error fetching recent rides:", error);
      }
    };

    fetchRecentRides();
  }, [user]);

  // Fetch nearby captains
  useEffect(() => {
    const fetchNearbyCaptains = async () => {
      try {
        const q = query(
          collection(db, "captains"),
          where("isOnline", "==", true),
          limit(5)
        );

        const snapshot = await getDocs(q);
        const captains = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setNearbyCaptains(captains);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching nearby captains:", error);
        setLoading(false);
      }
    };

    fetchNearbyCaptains();
  }, []);

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="min-h-screen bg-primary text-accent">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-dark-primary to-black py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-secondary">Fast</span> & <span className="text-secondary">Reliable</span> Rides
              </h1>
              <p className="text-lg text-gray-300 mb-6">
                Book a ride with our trusted captains and get to your destination safely and comfortably.
              </p>
              <button
                onClick={() => setShowRideForm(!showRideForm)}
                className="bg-secondary text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition duration-200 shadow-lg"
              >
                {showRideForm ? "Hide Booking Form" : "Book a Ride Now"}
              </button>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img
                src="https://img.freepik.com/free-vector/city-driver-concept-illustration_114360-1209.jpg"
                alt="Ride Illustration"
                className="w-full max-w-md rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Map and Booking Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {showRideForm && (
          <div className="bg-dark-primary rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-secondary">Book Your Ride</h2>
              <p className="text-gray-400">Enter your pickup and destination details</p>
            </div>
            <div className="p-4">
              <MapView />
            </div>
          </div>
        )}

        {/* Recent Rides and Nearby Captains */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Recent Rides */}
          <div className="bg-dark-primary rounded-xl shadow-lg overflow-hidden border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-secondary">Recent Rides</h2>
            </div>
            <div className="p-4">
              {recentRides.length > 0 ? (
                <div className="space-y-4">
                  {recentRides.map(ride => (
                    <div key={ride.id} className="border border-gray-800 rounded-lg p-3 hover:border-secondary transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${ride.status === "completed" ? "bg-green-500" : ride.status === "cancelled" ? "bg-red-500" : ride.status === "in_progress" ? "bg-blue-500" : "bg-yellow-500"}`}></span>
                            <p className="font-medium">{ride.pickupAddress || "Unknown pickup"} → {ride.dropAddress || "Unknown destination"}</p>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{formatDate(ride.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-secondary font-bold bg-white px-2 py-1 rounded-md mb-1">₹{ride.fare?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 'N/A'}</p>
                          <div className="flex items-center justify-end text-sm bg-white text-gray-700 px-2 py-1 rounded-md">
                            <span>{ride.distance || 'N/A'} km</span>
                            <span className="mx-1">•</span>
                            <span>{ride.estimatedTime || Math.ceil((ride.distance || 0) * 3)} mins</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">No recent rides found</p>
                  <button
                    onClick={() => setShowRideForm(true)}
                    className="mt-4 bg-secondary text-white px-4 py-2 rounded-lg font-medium hover:bg-pink-700 transition duration-200"
                  >
                    Book Your First Ride
                  </button>
                </div>
              )}
              {recentRides.length > 0 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate("/ridehistory")}
                    className="text-secondary hover:underline"
                  >
                    View All Rides
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Nearby Captains */}
          <div className="bg-white-primary rounded-xl shadow-lg overflow-hidden border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-secondary">Nearby Captains</h2>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="text-center py-6">
                  <p className="text-gray-400">Loading captains...</p>
                </div>
              ) : nearbyCaptains.length > 0 ? (
                <div className="space-y-4">
                  {nearbyCaptains.map(captain => (
                    <div key={captain.id} className="flex items-center border border-gray-800 rounded-lg p-3 hover:border-secondary transition-colors">
                      <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-xl font-bold text-white mr-4">
                        {captain.name?.charAt(0) || "C"}
                      </div>
                      <div>
                        <p className="font-medium">{captain.name}</p>
                        <div className="flex items-center text-sm text-gray-400">
                          <span className="flex items-center">
                            <span className="text-yellow-400 mr-1">★</span>
                            {captain.rating?.toFixed(1) || "New"}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{captain.vehicleModel}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">No captains available nearby</p>
                  <p className="text-sm text-gray-500 mt-2">Try again in a few minutes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-dark-primary py-12 px-4 mt-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-secondary mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black bg-opacity-40 p-6 rounded-xl text-center">
              <div className="w-16 h-16 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Fast Pickups</h3>
              <p className="text-gray-400">Our captains arrive quickly to get you to your destination on time.</p>
            </div>
            <div className="bg-black bg-opacity-40 p-6 rounded-xl text-center">
              <div className="w-16 h-16 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Safe Rides</h3>
              <p className="text-gray-400">All our captains are verified and trained to ensure your safety.</p>
            </div>
            <div className="bg-black bg-opacity-40 p-6 rounded-xl text-center">
              <div className="w-16 h-16 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Affordable Prices</h3>
              <p className="text-gray-400">Enjoy competitive rates and transparent pricing with no hidden fees.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;