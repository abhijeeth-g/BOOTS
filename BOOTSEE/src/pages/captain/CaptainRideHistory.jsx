import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import RatingStars from "../../components/RatingStars";
import CaptainDashboardBackground from "../../components/CaptainDashboardBackground";
import CaptainCard from "../../components/CaptainCard";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const CaptainRideHistory = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, completed, cancelled

  // Refs for animations
  const headerRef = useRef(null);
  const filtersRef = useRef(null);
  const ridesContainerRef = useRef(null);
  const rideRefs = useRef([]);

  // Clear ride refs on re-render
  rideRefs.current = [];

  // Add to ride refs
  const addToRideRefs = (el) => {
    if (el && !rideRefs.current.includes(el)) {
      rideRefs.current.push(el);
    }
  };

  // GSAP animations
  useEffect(() => {
    // Header animation
    gsap.from(headerRef.current, {
      y: -30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    });

    // Filters animation
    gsap.from(filtersRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      delay: 0.2,
      ease: "power3.out"
    });

    // Rides container animation
    gsap.from(ridesContainerRef.current, {
      opacity: 0,
      duration: 0.8,
      delay: 0.4,
      ease: "power3.out"
    });

    // Setup scroll animations for rides
    if (rideRefs.current.length > 0) {
      gsap.from(rideRefs.current, {
        y: 50,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        scrollTrigger: {
          trigger: ridesContainerRef.current,
          start: "top 80%",
        },
        ease: "back.out(1.7)"
      });
    }

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [rides]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative">
      {/* 3D Animated Background */}
      <CaptainDashboardBackground />

      <div className="max-w-7xl mx-auto p-4 relative z-10">
        <div ref={headerRef}>
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-secondary">Ride</span> History
          </h1>
          <p className="text-gray-300 mb-6">View and manage your past rides</p>
        </div>

        {/* Filter Tabs */}
        <div ref={filtersRef} className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              filter === "all"
                ? "bg-gradient-to-r from-secondary to-pink-600 text-white shadow-lg"
                : "bg-black bg-opacity-50 backdrop-blur-sm text-gray-300 hover:bg-opacity-70 border border-gray-700"
            }`}
          >
            All Rides
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              filter === "completed"
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                : "bg-black bg-opacity-50 backdrop-blur-sm text-gray-300 hover:bg-opacity-70 border border-gray-700"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              filter === "cancelled"
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                : "bg-black bg-opacity-50 backdrop-blur-sm text-gray-300 hover:bg-opacity-70 border border-gray-700"
            }`}
          >
            Cancelled
          </button>
        </div>

        <div ref={ridesContainerRef}>
          {loading ? (
            <div className="text-center py-8 bg-black bg-opacity-50 backdrop-blur-sm rounded-xl border border-gray-700">
              <div className="flex justify-center items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Loading ride history...</p>
              </div>
            </div>
          ) : rides.length === 0 ? (
            <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400">No rides found for the selected filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rides.map((ride, index) => (
                <div
                  key={ride.id}
                  ref={addToRideRefs}
                  className="bg-black bg-opacity-50 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-gray-700 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className={`p-5 ${ride.status === "completed" ? "border-l-4 border-green-500" : ride.status === "cancelled" ? "border-l-4 border-red-500" : "border-l-4 border-secondary"}`}>
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
                          <span className="font-medium capitalize text-white">{ride.status}</span>
                          {ride.status === "completed" && ride.completedAt && ride.startedAt && (
                            <span className="text-xs text-gray-300 ml-2">
                              ({calculateDuration(ride.startedAt, ride.completedAt)})
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mt-1">{formatDate(ride.createdAt)}</p>
                      </div>

                      <div className="mt-2 md:mt-0 text-right">
                        <p className="text-xl font-semibold text-green-500">₹{ride.fare?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        <p className="text-xs text-gray-300">₹{Math.round(ride.fare / ride.distance).toLocaleString('en-IN')}/km</p>
                      </div>
                    </div>

                    {/* Locations */}
                    <div className="mt-4 bg-black bg-opacity-30 p-4 rounded-lg border border-gray-800">
                      <div className="flex items-start mb-3">
                        <div className="mt-1 mr-3">
                          <div className="w-3 h-3 rounded-full bg-secondary"></div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-300">Pickup</p>
                          <p className="text-sm text-white">{ride.pickupAddress || "Unknown location"}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="mt-1 mr-3">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-300">Destination</p>
                          <p className="text-sm text-white">{ride.dropAddress || "Unknown location"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mt-4 flex flex-wrap gap-4">
                      <div className="bg-black bg-opacity-30 px-4 py-3 rounded-lg border border-gray-800">
                        <p className="text-xs text-gray-300">Distance</p>
                        <p className="text-sm font-medium text-white">{ride.distance} km</p>
                      </div>

                      {ride.startedAt && ride.completedAt && (
                        <div className="bg-black bg-opacity-30 px-4 py-3 rounded-lg border border-gray-800">
                          <p className="text-xs text-gray-300">Duration</p>
                          <p className="text-sm font-medium text-white">{calculateDuration(ride.startedAt, ride.completedAt)}</p>
                        </div>
                      )}

                      {ride.userRating > 0 && (
                        <div className="bg-black bg-opacity-30 px-4 py-3 rounded-lg border border-gray-800">
                          <p className="text-xs text-gray-300">User Rating</p>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-white mr-1">{ride.userRating.toFixed(1)}</span>
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
    </div>
  );
};

export default CaptainRideHistory;
