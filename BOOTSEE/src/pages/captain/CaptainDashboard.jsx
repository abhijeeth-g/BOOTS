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
  getDoc,
  setDoc
} from "firebase/firestore";
import CaptainMap from "../../components/captain/CaptainMap";
import RideStatistics from "../../components/captain/RideStatistics";
import CaptainDashboardBackground from "../../components/CaptainDashboardBackground";
import CaptainCard from "../../components/CaptainCard";
import CaptainStatCard from "../../components/CaptainStatCard";
import CaptainEarningsCalculator from "../../components/captain/CaptainEarningsCalculator";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { toast } from "react-toastify";

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
    // First, ensure all elements are visible by default
    if (headerRef.current) {
      gsap.set(headerRef.current, { opacity: 1, y: 0 });
    }

    if (statusButtonRef.current) {
      gsap.set(statusButtonRef.current, { opacity: 1, scale: 1, rotation: 0 });
    }

    if (mapContainerRef.current) {
      gsap.set(mapContainerRef.current, { opacity: 1, y: 0 });
    }

    if (statsRef.current) {
      gsap.set(statsRef.current.querySelectorAll('.stat-item'), { opacity: 1, y: 0 });
    }

    // Only apply animations if we're sure the elements exist
    const animations = [];

    // Header animation - subtle and quick
    if (headerRef.current) {
      const headerAnim = gsap.fromTo(headerRef.current,
        { y: -10, opacity: 0.8 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "power2.out"
        }
      );
      animations.push(headerAnim);
    }

    // Status button animation - subtle fade in, no rotation or scaling
    if (statusButtonRef.current) {
      const buttonAnim = gsap.fromTo(statusButtonRef.current,
        { opacity: 0.8 },
        {
          opacity: 1,
          duration: 0.5,
          delay: 0.1,
          ease: "power2.out"
        }
      );
      animations.push(buttonAnim);
    }

    // Map container animation - subtle slide up
    if (mapContainerRef.current) {
      const mapAnim = gsap.fromTo(mapContainerRef.current,
        { y: 20, opacity: 0.8 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: 0.1,
          ease: "power2.out"
        }
      );
      animations.push(mapAnim);
    }

    // Stats animation - only animate when scrolled into view
    if (statsRef.current) {
      const trigger = ScrollTrigger.create({
        trigger: statsRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.fromTo(statsRef.current.querySelectorAll('.stat-item'),
            { y: 10, opacity: 0.8 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.05,
              duration: 0.4,
              ease: "power2.out"
            }
          );
        }
      });

      // Store the trigger for cleanup
      return () => {
        // Kill all animations
        animations.forEach(anim => anim.kill());

        // Kill ScrollTrigger
        trigger.kill();
      };
    }

    // Cleanup function
    return () => {
      // Kill all animations
      animations.forEach(anim => {
        if (anim && anim.kill) anim.kill();
      });

      // Kill all ScrollTriggers
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger && trigger.kill) trigger.kill();
      });
    };
  }, []);

  // Function to fetch captain data
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

  // Fetch captain data on component mount or when user changes
  useEffect(() => {
    fetchCaptainData();
  }, [user]);

  // Location accuracy and update state
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [locationUpdateTime, setLocationUpdateTime] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const lastLocationRef = useRef(null);
  const minLocationChangeThreshold = 10; // meters

  // Get current location with enhanced accuracy
  useEffect(() => {
    if (!isOnline || !user) return;

    // Reset location error when going online
    setLocationError(null);

    // Calculate distance in meters between two points
    const getDistanceInMeters = (point1, point2) => {
      if (!point1 || !point2) return Infinity;
      // Use our enhanced distance calculation and convert to meters
      return calculateDistance(point1, point2, false) * 1000;
    };

    // Enhanced geolocation options
    const geoOptions = {
      enableHighAccuracy: true,  // Request the most accurate position available
      maximumAge: 5000,          // Accept positions that are up to 5 seconds old
      timeout: 10000             // Wait up to 10 seconds for a position
    };

    console.log("Starting location tracking with high accuracy");

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        const timestamp = position.timestamp;
        const newLocation = [latitude, longitude];

        // Update location accuracy
        setLocationAccuracy(accuracy);
        setLocationUpdateTime(new Date(timestamp).toLocaleTimeString());

        // Only update location if it's significantly different from the last one
        // or if this is the first location update
        if (!lastLocationRef.current ||
            getDistanceInMeters(lastLocationRef.current, newLocation) > minLocationChangeThreshold) {

          console.log(`Location updated: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (accuracy: ${accuracy.toFixed(1)}m)`);
          setCurrentLocation(newLocation);
          lastLocationRef.current = newLocation;

          // Update captain location in Firestore with enhanced data
          try {
            // Check if captain document exists first
            const captainDocRef = doc(db, "captains", user.uid);
            const captainDocSnap = await getDoc(captainDocRef);

            // Prepare location data with additional information
            const locationData = {
              currentLocation: newLocation,
              locationAccuracy: accuracy,
              locationTimestamp: timestamp,
              heading: heading || null,
              speed: speed || null,
              lastUpdated: serverTimestamp()
            };

            if (captainDocSnap.exists()) {
              // Update existing document
              await updateDoc(captainDocRef, locationData);
            } else {
              // Create new captain document
              await setDoc(captainDocRef, {
                ...locationData,
                isOnline: true,
                lastStatusChange: serverTimestamp(),
                name: user.displayName || "Captain",
                email: user.email || "",
                phone: "",
                rating: 4.5,
                totalRides: 0,
                todayEarnings: 0,
                earningsChange: 0,
                todayRides: 0,
                ratingChange: 0,
                createdAt: serverTimestamp()
              });
            }
          } catch (err) {
            console.error("Error updating location:", err);
          }
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError(error.message || "Location error");

        // If high accuracy fails, try again with lower accuracy
        if (error.code === error.TIMEOUT && geoOptions.enableHighAccuracy) {
          console.log("High accuracy location timed out, trying with lower accuracy");
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setCurrentLocation([latitude, longitude]);
              setLocationAccuracy(position.coords.accuracy);
              setLocationError("Using lower accuracy location");
            },
            (fallbackError) => {
              console.error("Fallback location also failed:", fallbackError);
              setLocationError("Location services unavailable. Please check your device settings.");
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
          );
        }
      },
      geoOptions
    );

    // Cleanup function
    return () => {
      console.log("Stopping location tracking");
      navigator.geolocation.clearWatch(watchId);
    };
  }, [user, isOnline]);

  // Toggle online status
  const toggleOnlineStatus = async () => {
    if (!user) return;

    try {
      const newStatus = !isOnline;

      // Check if captain document exists
      const captainDocRef = doc(db, "captains", user.uid);
      const captainDocSnap = await getDoc(captainDocRef);

      // If going online, request location permission first
      if (newStatus) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const newLocation = [latitude, longitude];

            // Update or create captain document in Firestore
            if (captainDocSnap.exists()) {
              // Update existing document
              await updateDoc(captainDocRef, {
                isOnline: true,
                currentLocation: newLocation,
                lastStatusChange: serverTimestamp()
              });
            } else {
              // Create new captain document
              await setDoc(captainDocRef, {
                isOnline: true,
                currentLocation: newLocation,
                lastStatusChange: serverTimestamp(),
                name: user.displayName || "Captain",
                email: user.email || "",
                phone: "",
                rating: 4.5,
                totalRides: 0,
                todayEarnings: 0,
                earningsChange: 0,
                todayRides: 0,
                ratingChange: 0,
                createdAt: serverTimestamp()
              });
            }

            setCurrentLocation(newLocation);
            setIsOnline(true);
            console.log("Captain is now online with location:", newLocation);
          },
          (error) => {
            console.error("Error getting location:", error);
            alert("Location access is required to go online. Please enable location services and try again.");
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        // Going offline is simpler
        if (captainDocSnap.exists()) {
          await updateDoc(captainDocRef, {
            isOnline: false,
            lastStatusChange: serverTimestamp()
          });
        } else {
          // Create new captain document in offline state
          await setDoc(captainDocRef, {
            isOnline: false,
            lastStatusChange: serverTimestamp(),
            name: user.displayName || "Captain",
            email: user.email || "",
            createdAt: serverTimestamp()
          });
        }
        setIsOnline(false);
        console.log("Captain is now offline");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("There was an error changing your status. Please try again.");
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

  // Complete ride and update earnings
  const completeRide = async () => {
    if (!activeRide) return;

    try {
      // Get the ride fare
      const rideFare = activeRide.fare || 0;

      // Calculate company commission (10%)
      const companyCommission = rideFare * 0.1;

      // Calculate captain's actual earnings (90%)
      const captainEarnings = rideFare - companyCommission;

      // Get current captain data for earnings update
      const captainDocRef = doc(db, "captains", user.uid);
      const captainDocSnap = await getDoc(captainDocRef);

      if (!captainDocSnap.exists()) {
        throw new Error("Captain document not found");
      }

      const captainData = captainDocSnap.data();

      // Calculate new earnings values (using captain's actual earnings after commission)
      const todayEarnings = (captainData.todayEarnings || 0) + captainEarnings;
      const totalEarnings = (captainData.totalEarnings || 0) + captainEarnings;
      const totalRides = (captainData.totalRides || 0) + 1;
      const todayRides = (captainData.todayRides || 0) + 1;

      // Track gross earnings (before commission) for reporting
      const todayGrossEarnings = (captainData.todayGrossEarnings || 0) + rideFare;
      const totalGrossEarnings = (captainData.totalGrossEarnings || 0) + rideFare;

      // Update ride status in Firestore
      await updateDoc(doc(db, "rides", activeRide.id), {
        status: "completed",
        completedAt: serverTimestamp(),
        finalFare: rideFare, // Total fare paid by user
        captainEarnings: captainEarnings, // Captain's earnings after commission
        companyCommission: companyCommission // Company's commission
      });

      // Update captain data with new earnings and ride count
      await updateDoc(captainDocRef, {
        activeRide: null,
        isAvailable: true,
        todayEarnings: todayEarnings, // Net earnings after commission
        totalEarnings: totalEarnings, // Net earnings after commission
        todayGrossEarnings: todayGrossEarnings, // Gross earnings before commission
        totalGrossEarnings: totalGrossEarnings, // Gross earnings before commission
        totalRides: totalRides,
        todayRides: todayRides,
        lastCompletedRide: {
          id: activeRide.id,
          fare: rideFare, // Total fare
          captainEarnings: captainEarnings, // Captain's earnings after commission
          companyCommission: companyCommission, // Company's commission
          completedAt: serverTimestamp(),
          from: activeRide.pickupAddress,
          to: activeRide.dropAddress,
          distance: activeRide.distance
        }
      });

      // Clear active ride from state
      setActiveRide(null);

      // Show success message with earnings breakdown
      toast.success(
        <div>
          <p>Ride completed!</p>
          <p className="text-xs mt-1">Total: ₹{rideFare.toLocaleString('en-IN')}</p>
          <p className="text-xs">Your earnings: ₹{captainEarnings.toLocaleString('en-IN')}</p>
        </div>
      );

      // Refresh captain data to show updated earnings
      fetchCaptainData();

      // Animate earnings update
      const earningsElement = document.querySelector('.earnings-value');
      if (earningsElement) {
        // Flash animation for earnings
        gsap.fromTo(earningsElement,
          { backgroundColor: 'rgba(16, 185, 129, 0.3)' }, // Green flash
          {
            backgroundColor: 'transparent',
            duration: 1.5,
            ease: 'power2.out'
          }
        );

        // Bounce animation for the value
        gsap.fromTo(earningsElement,
          { scale: 1 },
          {
            scale: 1.1,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: 'power2.out'
          }
        );
      }
    } catch (error) {
      console.error("Error completing ride:", error);
      toast.error("Failed to complete ride. Please try again.");
    }
  };

  // Cache for distance calculations to improve performance
  const distanceCache = useRef(new Map());

  // Distance unit state (km or miles)
  const [distanceUnit, setDistanceUnit] = useState("km");

  // Distance conversion utilities
  const convertDistance = (distance, unit = distanceUnit) => {
    if (distance === null || distance === undefined) return null;

    // Convert to number if it's a string
    const numDistance = typeof distance === 'string' ? parseFloat(distance) : distance;

    if (isNaN(numDistance)) return null;

    // Convert based on unit
    if (unit === "miles") {
      return (numDistance * 0.621371).toFixed(2); // km to miles
    }
    return numDistance.toFixed(2); // already in km
  };

  // Format distance with unit
  const formatDistance = (distance, unit = distanceUnit) => {
    const convertedDistance = convertDistance(distance, unit);
    if (convertedDistance === null) return "--";
    return `${convertedDistance} ${unit}`;
  };

  // Calculate distance between two points with enhanced accuracy
  const calculateDistance = (point1, point2, useCache = true) => {
    // Validate input points
    if (!point1 || !point2 ||
        !Array.isArray(point1) || !Array.isArray(point2) ||
        point1.length < 2 || point2.length < 2) {
      return null;
    }

    // Check if values are valid numbers
    const lat1 = Number(point1[0]);
    const lon1 = Number(point1[1]);
    const lat2 = Number(point2[0]);
    const lon2 = Number(point2[1]);

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      return null;
    }

    // Generate cache key
    const cacheKey = `${lat1.toFixed(6)},${lon1.toFixed(6)}-${lat2.toFixed(6)},${lon2.toFixed(6)}`;

    // Check cache first if enabled
    if (useCache && distanceCache.current.has(cacheKey)) {
      return distanceCache.current.get(cacheKey);
    }

    // Enhanced Haversine formula with better precision
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371.0710; // Earth's mean radius in km (WGS-84 ellipsoid)

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    // Use the improved haversine formula
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))); // Prevent negative values

    // Apply correction factor for road distances (typically 1.2-1.4 times the straight-line distance)
    const roadFactor = 1.3;
    const straightDistance = R * c;
    const roadDistance = straightDistance * roadFactor;

    // Round to 2 decimal places for display
    const result = parseFloat(roadDistance.toFixed(2));

    // Store in cache if enabled
    if (useCache) {
      distanceCache.current.set(cacheKey, result);

      // Limit cache size to prevent memory issues
      if (distanceCache.current.size > 1000) {
        // Remove oldest entries (first 200)
        const keys = Array.from(distanceCache.current.keys()).slice(0, 200);
        keys.forEach(key => distanceCache.current.delete(key));
      }
    }

    return result;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative">
      {/* 3D Animated Background */}
      <CaptainDashboardBackground />

      {/* Modern Header with Quick Stats */}
      <div ref={headerRef} className="bg-black bg-opacity-80 backdrop-blur-xl p-4 shadow-lg border-b border-gray-800 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Top Navigation Bar */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="mr-2 bg-secondary p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold flex items-center">
                <span className="text-secondary">SAFE</span>
                <span className="text-white">WINGS</span>
                <span className="ml-2 text-white bg-secondary bg-opacity-20 px-2 py-1 rounded text-sm">Captain</span>
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-full hover:bg-gray-800 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 bg-secondary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
              </button>

              {/* Settings */}
              <button className="p-2 rounded-full hover:bg-gray-800 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Profile */}
              <div className="flex items-center space-x-2 border-l border-gray-700 pl-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
                  {captainData?.name?.charAt(0) || "C"}
                </div>
                <div className="hidden md:block">
                  <p className="text-white font-medium">{captainData?.name || "Captain"}</p>
                  <p className="text-xs text-gray-400">{captainData?.rating ? `★ ${captainData.rating.toFixed(1)}` : "New Captain"}</p>
                </div>
              </div>

              {/* Online/Offline Toggle Button */}
              <button
                ref={statusButtonRef}
                onClick={toggleOnlineStatus}
                className={`px-4 py-2 rounded-full font-medium transform transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center ${
                  isOnline
                    ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    : "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-gray-200"
                }`}
              >
                <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-300 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="hidden sm:inline">{isOnline ? "Go Offline" : "Go Online"}</span>
                <span className="sm:hidden">{isOnline ? "Online" : "Offline"}</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
            <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400">Today's Earnings (After 10% Commission)</p>
                  <p className="text-xl font-bold text-white earnings-value">₹{(captainData?.todayEarnings || 0).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="text-gray-400">Gross: </span>
                    ₹{(captainData?.todayGrossEarnings || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-secondary bg-opacity-20 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs">
                {captainData?.earningsChange > 0 ? (
                  <span className="text-green-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {captainData?.earningsChange || 0}%
                  </span>
                ) : captainData?.earningsChange < 0 ? (
                  <span className="text-red-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    {Math.abs(captainData?.earningsChange || 0)}%
                  </span>
                ) : (
                  <span className="text-gray-400 flex items-center">
                    0%
                  </span>
                )}
                <span className="text-gray-500 ml-2">from yesterday</span>
              </div>
            </div>

            <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400">Completed Rides</p>
                  <p className="text-xl font-bold text-white">{captainData?.totalRides || 0}</p>
                </div>
                <div className="bg-blue-500 bg-opacity-20 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs">
                <span className="text-blue-400 flex items-center">
                  {captainData?.todayRides || 0}
                </span>
                <span className="text-gray-500 ml-2">today</span>
              </div>
            </div>

            <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400">Rating</p>
                  <p className="text-xl font-bold text-white flex items-center">
                    {captainData?.rating?.toFixed(1) || "N/A"}
                    <span className="text-yellow-400 ml-1">★</span>
                  </p>
                </div>
                <div className="bg-yellow-500 bg-opacity-20 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs">
                {captainData?.ratingChange > 0 ? (
                  <span className="text-yellow-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {captainData?.ratingChange.toFixed(1) || 0}
                  </span>
                ) : captainData?.ratingChange < 0 ? (
                  <span className="text-red-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    {Math.abs(captainData?.ratingChange || 0).toFixed(1)}
                  </span>
                ) : (
                  <span className="text-gray-400 flex items-center">
                    0.0
                  </span>
                )}
                <span className="text-gray-500 ml-2">last week</span>
              </div>
            </div>

            <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400">Online Status</p>
                  <p className="text-xl font-bold text-white">{isOnline ? "Active" : "Offline"}</p>
                </div>
                <div className={`${isOnline ? 'bg-green-500 bg-opacity-20' : 'bg-gray-500 bg-opacity-20'} p-2 rounded-lg`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isOnline ? 'text-green-500' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs">
                <span className={`${isOnline ? 'text-green-400' : 'text-gray-400'} flex items-center`}>
                  {isOnline ? (
                    <>
                      <span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-1 animate-pulse"></span>
                      Receiving requests
                    </>
                  ) : (
                    "Not receiving requests"
                  )}
                </span>
              </div>
              {isOnline && (
                <div className="mt-1 flex items-center text-xs">
                  <div className={`h-2 w-2 rounded-full mr-1 ${locationError ? 'bg-red-500' : locationAccuracy && locationAccuracy < 20 ? 'bg-green-500' : locationAccuracy && locationAccuracy < 50 ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                  <span className={locationError ? 'text-red-400' : 'text-gray-400'}>
                    {locationError ? locationError :
                     locationAccuracy ? `Accuracy: ${locationAccuracy.toFixed(0)}m (${locationUpdateTime})` :
                     "Waiting for location..."}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Enhanced Map Section */}
        <div className="lg:col-span-2" ref={mapContainerRef}>
          <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-gray-800 flex flex-col">
            {/* Map Controls */}
            <div className="p-3 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="bg-secondary bg-opacity-20 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Live Map</h3>
                  <p className="text-xs text-gray-400">
                    {currentLocation ?
                      `Current Location: ${currentLocation[0].toFixed(6)}, ${currentLocation[1].toFixed(6)}` :
                      "Waiting for location..."}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                {/* Distance Unit Toggle */}
                <button
                  onClick={() => setDistanceUnit(distanceUnit === "km" ? "miles" : "km")}
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-all duration-200 flex items-center"
                  title={`Switch to ${distanceUnit === "km" ? "miles" : "km"}`}
                >
                  <span className="text-xs font-medium text-gray-300 mr-1">{distanceUnit.toUpperCase()}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>

                {/* Map Type Toggle */}
                <button className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </button>

                {/* Recenter Button */}
                <button className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v10.764a1 1 0 01-1.447.894L15 18M5 18l-4.553-2.276A1 1 0 010 14.618V3.382a1 1 0 011.447-.894L5 4m0 14V4m0 0L9 2m0 0l4 2m0-2v18m0 0l-4-2m4 2l4.553 2.276A1 1 0 0018 20.618V9.382a1 1 0 00-1.447-.894L12 10" />
                  </svg>
                </button>

                {/* Fullscreen Toggle */}
                <button className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Enhanced Map Container */}
            <div className="h-[500px] relative">
              <CaptainMap
                currentLocation={currentLocation}
                activeRide={activeRide}
                initialZoom={15}
                showLegend={true}
                showControls={true}
                onRouteCalculated={(routeInfo) => {
                  console.log("Route calculated:", routeInfo);
                  // You can update state or perform actions based on route info here
                }}
              />

              {/* Map Overlay - Quick Actions */}
              {isOnline && !activeRide && (
                <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 backdrop-blur-md p-3 rounded-lg border border-gray-700 shadow-lg z-[1001]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Ready for Rides</h3>
                      <p className="text-xs text-gray-300">You're online and can receive ride requests</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-secondary hover:bg-pink-700 text-white px-3 py-1 rounded-lg text-sm transition-all duration-200 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        View Hotspots
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Navigation Instructions (when in active ride) */}
              {activeRide && activeRide.status === "in_progress" && (
                <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 backdrop-blur-md p-4 rounded-lg border border-gray-700 shadow-lg z-[1001]">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-white font-medium">Navigation</h3>
                        <div className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                          ETA: {activeRide.estimatedTime || Math.ceil(activeRide.distance * 3)} mins
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">
                        {activeRide.navigationInstructions || "Follow the route on the map to reach your destination"}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-2 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-secondary to-pink-500 h-full rounded-full"
                          style={{
                            width: (() => {
                              // Calculate progress based on distance
                              const totalDistance = activeRide.distance || 1; // Prevent division by zero
                              const remainingDistance = calculateDistance(currentLocation, activeRide.drop) || 0;
                              const progress = Math.max(0, Math.min(100, 100 - (remainingDistance / totalDistance * 100)));
                              return `${progress}%`;
                            })()
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>Distance: {formatDistance(calculateDistance(currentLocation, activeRide.drop))} remaining</span>
                        <span>{formatDistance(activeRide.distance)} total</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ride Statistics Component */}
            <div className="bg-black bg-opacity-70 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden shadow-lg mt-6">
              <RideStatistics
                captainData={captainData}
                className="p-4"
                delay={0.2}
              />
            </div>
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
                    <p className="text-sm font-medium">{formatDistance(activeRide.distance)}</p>
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
                          ? formatDistance(calculateDistance(currentLocation, activeRide.pickup))
                          : formatDistance(calculateDistance(currentLocation, activeRide.drop))}
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
                            <p className="text-sm font-medium">{formatDistance(request.distance)}</p>
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
                              <p className="text-sm font-medium">{formatDistance(calculateDistance(currentLocation, request.pickup))}</p>
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
                    title="Today's Earnings (After Commission)"
                    value={`₹${(captainData?.todayEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    subtitle={`Gross: ₹${(captainData?.todayGrossEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>}
                    color="green"
                    delay={0.3}
                  />
                </div>
                <div className="stat-item">
                  <CaptainStatCard
                    title="Total Earnings (After Commission)"
                    value={`₹${(captainData?.totalEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    subtitle={`Gross: ₹${(captainData?.totalGrossEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>}
                    color="secondary"
                    delay={0.4}
                  />
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="mt-4">
                <CaptainEarningsCalculator
                  totalAmount={captainData?.todayGrossEarnings || 0}
                  commissionPercentage={10}
                  showDetails={true}
                />
              </div>
            </CaptainCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptainDashboard;
