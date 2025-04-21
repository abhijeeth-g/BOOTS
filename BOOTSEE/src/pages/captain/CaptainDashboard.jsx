import { useState, useEffect, useRef } from "react";
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
import CaptainDashboardBackground from "../../components/CaptainDashboardBackground";
import CaptainCard from "../../components/CaptainCard";
import CaptainStatCard from "../../components/CaptainStatCard";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const CaptainDashboard = () => {
  const { user } = useAuth();
  const [rideRequests, setRideRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [captainData, setCaptainData] = useState(null);

  // Refs for animations
  const headerRef = useRef(null);
  const statusButtonRef = useRef(null);
  const mapContainerRef = useRef(null);
  const statsRef = useRef(null);

  // GSAP animations
  useEffect(() => {
    // Header animation
    gsap.from(headerRef.current, {
      y: -30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    });

    // Status button animation
    gsap.from(statusButtonRef.current, {
      scale: 0,
      rotation: 180,
      opacity: 0,
      duration: 1,
      delay: 0.3,
      ease: "elastic.out(1, 0.3)"
    });

    // Map container animation
    gsap.from(mapContainerRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      delay: 0.2,
      ease: "power3.out"
    });

    // Stats animation
    if (statsRef.current) {
      ScrollTrigger.create({
        trigger: statsRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from(statsRef.current.querySelectorAll('.stat-item'), {
            y: 30,
            opacity: 0,
            stagger: 0.1,
            duration: 0.6,
            ease: "back.out(1.7)"
          });
        }
      });
    }

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative">
      {/* 3D Animated Background */}
      <CaptainDashboardBackground />

      {/* Status Toggle */}
      <div ref={headerRef} className="bg-black bg-opacity-70 backdrop-blur-md p-4 shadow-md border-b border-gray-800 relative z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-secondary">SAFE</span>
              <span className="text-white">WINGS</span>
              <span className="ml-2 text-white">Captain</span>
            </h1>
            <p className="text-gray-300">
              {isOnline ? "You are online and receiving ride requests" : "You are offline"}
            </p>
          </div>
          <button
            ref={statusButtonRef}
            onClick={toggleOnlineStatus}
            className={`px-6 py-3 rounded-full font-medium transform transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              isOnline
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
            }`}
          >
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-300' : 'bg-gray-400'}`}></div>
              {isOnline ? "Go Offline" : "Go Online"}
            </div>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Map Section */}
        <div className="lg:col-span-2" ref={mapContainerRef}>
          <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden h-[500px] border border-gray-800">
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
            <CaptainCard
              title="Active Ride"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>}
              delay={0.2}
              className="border-l-4 border-secondary"
            >
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
            </CaptainCard>
          )}

          {/* Ride Requests List */}
          {isOnline && !activeRide && (
            <CaptainCard
              title="Ride Requests"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>}
              delay={0.3}
              maxHeight="400px"
              scrollable={true}
            >
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
            </CaptainCard>
          )}

          {/* Captain Stats */}
          <div ref={statsRef} className="space-y-4">
            <CaptainCard
              title="Your Stats"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>}
              delay={0.4}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="stat-item">
                  <CaptainStatCard
                    title="Rating"
                    value={captainData?.rating?.toFixed(1) || "N/A"}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>}
                    color="yellow"
                    delay={0.1}
                  />
                </div>
                <div className="stat-item">
                  <CaptainStatCard
                    title="Total Rides"
                    value={captainData?.totalRides?.toLocaleString() || 0}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>}
                    color="blue"
                    delay={0.2}
                  />
                </div>
                <div className="stat-item">
                  <CaptainStatCard
                    title="Today's Earnings"
                    value={`₹${(captainData?.todayEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>}
                    color="green"
                    trend="up"
                    trendValue="+12%"
                    delay={0.3}
                  />
                </div>
                <div className="stat-item">
                  <CaptainStatCard
                    title="Total Earnings"
                    value={`₹${(captainData?.totalEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>}
                    color="secondary"
                    delay={0.4}
                  />
                </div>
              </div>
            </CaptainCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptainDashboard;
