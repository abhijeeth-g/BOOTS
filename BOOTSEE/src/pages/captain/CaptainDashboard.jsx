import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  orderBy,
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import CaptainMap from "../../components/captain/CaptainMap";

const CaptainDashboard = () => {
  const { user } = useAuth();
  const [rideRequests, setRideRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [captainData, setCaptainData] = useState(null);

  // Fetch captain data
  useEffect(() => {
    const fetchCaptainData = async () => {
      if (!user) return;

      try {
        const captainDoc = await getDoc(doc(db, "captains", user.uid));
        if (captainDoc.exists()) {
          setCaptainData(captainDoc.data());
          setIsOnline(captainDoc.data().isOnline || false);
        }
      } catch (error) {
        console.error("Error fetching captain data:", error);
      }
    };

    fetchCaptainData();
  }, [user]);

  // Get current location
  useEffect(() => {
    if (!isOnline) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = [latitude, longitude];
        setCurrentLocation(newLocation);

        // Update captain location in Firestore
        if (user) {
          updateDoc(doc(db, "captains", user.uid), {
            currentLocation: newLocation,
            lastUpdated: serverTimestamp()
          }).catch(err => console.error("Error updating location:", err));
        }
      },
      (error) => console.error("Error getting location:", error),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, isOnline]);

  // Toggle online status
  const toggleOnlineStatus = async () => {
    if (!user) return;

    try {
      const newStatus = !isOnline;
      await updateDoc(doc(db, "captains", user.uid), {
        isOnline: newStatus,
        lastStatusChange: serverTimestamp()
      });
      setIsOnline(newStatus);
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  // Listen for ride requests
  useEffect(() => {
    if (!isOnline || !user) return;

    console.log("Setting up ride requests listener, isOnline:", isOnline);
    setLoading(true);

    // We need to avoid using orderBy with where on different fields
    // as it requires a composite index which might not be set up
    const q = query(
      collection(db, "rides"),
      where("status", "==", "pending")
      // Note: removed orderBy to ensure query works without composite index
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Ride requests snapshot received, count:", snapshot.docs.length);
      let requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort manually by createdAt since we can't use orderBy with where
      requests.sort((a, b) => {
        // Handle missing createdAt fields
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;

        // Sort in descending order (newest first)
        return b.createdAt.toDate() - a.createdAt.toDate();
      });

      console.log("Ride requests data (sorted):", requests);
      setRideRequests(requests);
      setLoading(false);
    }, (error) => {
      console.error("Error in ride requests listener:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isOnline]);

  // Listen for active ride
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "rides"),
      where("captainId", "==", user.uid),
      where("status", "in", ["accepted", "in_progress"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const activeRideData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        };
        setActiveRide(activeRideData);
      } else {
        setActiveRide(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Accept ride request
  const acceptRide = async (rideId) => {
    if (!user || !currentLocation) return;

    try {
      await updateDoc(doc(db, "rides", rideId), {
        captainId: user.uid,
        captainName: captainData?.name || "Captain",
        captainPhone: captainData?.phone || "",
        captainVehicle: captainData?.vehicleModel || "",
        captainVehicleNumber: captainData?.vehicleNumber || "",
        captainLocation: currentLocation,
        captainRating: captainData?.rating || 0,
        status: "accepted",
        acceptedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error accepting ride:", error);
    }
  };

  // Start ride
  const startRide = async () => {
    if (!activeRide) return;

    try {
      await updateDoc(doc(db, "rides", activeRide.id), {
        status: "in_progress",
        startedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error starting ride:", error);
    }
  };

  // Complete ride
  const completeRide = async () => {
    if (!activeRide) return;

    try {
      await updateDoc(doc(db, "rides", activeRide.id), {
        status: "completed",
        completedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error completing ride:", error);
    }
  };

  // Calculate distance between two points
  const calculateDistance = (point1, point2) => {
    if (!point1 || !point2) return null;

    // Haversine formula to calculate distance between two points
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km

    const dLat = toRad(point2[0] - point1[0]);
    const dLon = toRad(point2[1] - point1[1]);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(point1[0])) * Math.cos(toRad(point2[0])) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-primary text-accent">
      {/* Status Toggle */}
      <div className="bg-dark-primary p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Captain Dashboard</h1>
            <p className="text-gray-400">
              {isOnline ? "You are online and receiving ride requests" : "You are offline"}
            </p>
          </div>
          <button
            onClick={toggleOnlineStatus}
            className={`px-6 py-2 rounded-full font-medium ${
              isOnline
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-600 hover:bg-gray-700"
            } transition duration-200`}
          >
            {isOnline ? "Go Offline" : "Go Online"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="bg-dark-primary rounded-xl shadow-md overflow-hidden h-[500px]">
            <CaptainMap
              currentLocation={currentLocation}
              activeRide={activeRide}
            />
          </div>
        </div>

        {/* Ride Requests & Active Ride */}
        <div className="space-y-6">
          {/* Active Ride Card */}
          {activeRide && (
            <div className="bg-dark-primary rounded-xl shadow-md p-4 border-l-4 border-secondary">
              <h2 className="text-xl font-semibold text-secondary mb-2">Active Ride</h2>
              <div className="space-y-3">
                {/* User info */}
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-sm font-bold text-white mr-2">
                    {activeRide.userName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-medium">{activeRide.userName || "User"}</p>
                    <div className="flex items-center text-xs text-gray-400">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${activeRide.status === "accepted" ? "bg-yellow-500" : "bg-blue-500"}`}></span>
                      <span className="capitalize">{activeRide.status}</span>
                    </div>
                  </div>
                </div>

                {/* Locations */}
                <div className="bg-black bg-opacity-20 p-3 rounded-lg">
                  <div className="flex items-start mb-2">
                    <div className="mt-1 mr-3">
                      <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Pickup</p>
                      <p className="text-sm">{activeRide.pickupAddress || "Loading..."}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="mt-1 mr-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Destination</p>
                      <p className="text-sm">{activeRide.dropAddress || "Loading..."}</p>
                    </div>
                  </div>
                </div>

                {/* Ride details */}
                <div className="flex flex-wrap gap-2">
                  <div className="bg-black bg-opacity-20 px-3 py-2 rounded-lg">
                    <p className="text-xs text-gray-400">Distance</p>
                    <p className="text-sm font-medium">{activeRide.distance} km</p>
                  </div>

                  <div className="bg-black bg-opacity-20 px-3 py-2 rounded-lg">
                    <p className="text-xs text-gray-400">Fare</p>
                    <p className="text-sm font-medium text-green-500">₹{activeRide.fare?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>

                  <div className="bg-black bg-opacity-20 px-3 py-2 rounded-lg">
                    <p className="text-xs text-gray-400">Est. Time</p>
                    <p className="text-sm font-medium">{activeRide.estimatedTime || Math.ceil(activeRide.distance * 3)} mins</p>
                  </div>

                  {currentLocation && activeRide.pickup && (
                    <div className="bg-black bg-opacity-20 px-3 py-2 rounded-lg">
                      <p className="text-xs text-gray-400">
                        {activeRide.status === "accepted" ? "Distance to pickup" : "Distance to destination"}
                      </p>
                      <p className="text-sm font-medium">
                        {activeRide.status === "accepted"
                          ? calculateDistance(currentLocation, activeRide.pickup)
                          : calculateDistance(currentLocation, activeRide.drop)} km
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                {activeRide.status === "accepted" ? (
                  <button
                    onClick={startRide}
                    className="flex-1 bg-secondary text-white py-2 rounded-lg hover:bg-pink-700 transition duration-200"
                  >
                    Start Ride
                  </button>
                ) : (
                  <button
                    onClick={completeRide}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    Complete Ride
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Ride Requests List */}
          {isOnline && !activeRide && (
            <div className="bg-dark-primary rounded-xl shadow-md p-4">
              <h2 className="text-xl font-semibold text-secondary mb-4">Ride Requests</h2>
              {loading ? (
                <p className="text-center text-gray-400 py-4">Loading ride requests...</p>
              ) : rideRequests.length > 0 ? (
                <div className="space-y-4">
                  {rideRequests.map((request) => (
                    <div key={request.id} className="border border-gray-700 rounded-lg p-3">
                      <div className="space-y-3">
                        {/* User info */}
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-sm font-bold text-white mr-2">
                            {request.userName?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-medium">{request.userName || "User"}</p>
                            <p className="text-xs text-gray-400">{new Date(request.createdAt?.toDate()).toLocaleTimeString()}</p>
                          </div>
                        </div>

                        {/* Locations */}
                        <div className="bg-black bg-opacity-20 p-3 rounded-lg">
                          <div className="flex items-start mb-2">
                            <div className="mt-1 mr-3">
                              <div className="w-2 h-2 rounded-full bg-secondary"></div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Pickup</p>
                              <p className="text-sm">{request.pickupAddress || "Loading..."}</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="mt-1 mr-3">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Destination</p>
                              <p className="text-sm">{request.dropAddress || "Loading..."}</p>
                            </div>
                          </div>
                        </div>

                        {/* Ride details */}
                        <div className="flex flex-wrap gap-2">
                          <div className="bg-black bg-opacity-20 px-3 py-2 rounded-lg">
                            <p className="text-xs text-gray-400">Distance</p>
                            <p className="text-sm font-medium">{request.distance} km</p>
                          </div>

                          <div className="bg-black bg-opacity-20 px-3 py-2 rounded-lg">
                            <p className="text-xs text-gray-400">Fare</p>
                            <p className="text-sm font-medium text-green-500">₹{request.fare}</p>
                          </div>

                          <div className="bg-black bg-opacity-20 px-3 py-2 rounded-lg">
                            <p className="text-xs text-gray-400">Est. Time</p>
                            <p className="text-sm font-medium">{request.estimatedTime || Math.ceil(request.distance * 3)} mins</p>
                          </div>

                          {currentLocation && request.pickup && (
                            <div className="bg-black bg-opacity-20 px-3 py-2 rounded-lg">
                              <p className="text-xs text-gray-400">Distance to pickup</p>
                              <p className="text-sm font-medium">{calculateDistance(currentLocation, request.pickup)} km</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => acceptRide(request.id)}
                        className="w-full mt-3 bg-secondary text-white py-2 rounded-lg hover:bg-pink-700 transition duration-200"
                      >
                        Accept Request
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4">No ride requests available</p>
              )}
            </div>
          )}

          {/* Captain Stats */}
          <div className="bg-dark-primary rounded-xl shadow-md p-4">
            <h2 className="text-xl font-semibold text-secondary mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black bg-opacity-30 p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Rating</p>
                <div className="flex items-center">
                  <span className="text-xl font-semibold mr-2">
                    {captainData?.rating?.toFixed(1) || "N/A"}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${star <= Math.round(captainData?.rating || 0) ? 'text-yellow-400' : 'text-gray-600'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {captainData?.totalRatings || 0} {captainData?.totalRatings === 1 ? 'rating' : 'ratings'}
                </p>
              </div>
              <div className="bg-black bg-opacity-30 p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Total Rides</p>
                <p className="text-xl font-semibold">
                  {captainData?.totalRides?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {captainData?.completedRides || 0} completed
                </p>
              </div>
              <div className="bg-black bg-opacity-30 p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Today's Earnings</p>
                <p className="text-xl font-semibold text-green-500">
                  ₹{(captainData?.todayEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {captainData?.todayRides || 0} rides today
                </p>
              </div>
              <div className="bg-black bg-opacity-30 p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Total Earnings</p>
                <p className="text-xl font-semibold text-green-500">
                  ₹{(captainData?.totalEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Since {captainData?.createdAt?.toDate().toLocaleDateString() || 'joining'}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptainDashboard;
