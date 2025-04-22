import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, onSnapshot, collection, query, where, orderBy, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { gsap } from 'gsap';
import CaptainCard from './CaptainCard';
import RatingStars from './RatingStars';

const RideStatus = () => {
  const { user } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const statusRef = useRef(null);
  const statusIconRef = useRef(null);
  const statusTextRef = useRef(null);
  const captainInfoRef = useRef(null);
  const rideDetailsRef = useRef(null);

  // Listen for active ride
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Query for active rides (pending, accepted, in_progress)
      // Using a simpler query to avoid requiring a composite index
      const q = query(
        collection(db, "rides"),
        where("userId", "==", user.uid),
        where("status", "in", ["pending", "accepted", "in_progress"])
        // Removed orderBy to avoid requiring a composite index
        // We'll sort the results in JavaScript instead
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          // Sort the documents by createdAt in descending order
          const sortedDocs = snapshot.docs.sort((a, b) => {
            const aDate = a.data().createdAt?.toDate() || new Date(0);
            const bDate = b.data().createdAt?.toDate() || new Date(0);
            return bDate - aDate; // Descending order
          });

          const rideData = {
            id: sortedDocs[0].id,
            ...sortedDocs[0].data()
          };
          setActiveRide(rideData);

          // Show rating dialog if ride was just completed
          if (rideData.status === "completed" && !rideData.userRating) {
            setShowRating(true);
          }
        } else {
          // Check if there's a recently completed ride that needs rating
          // Simplified query to avoid requiring a composite index
          const completedQuery = query(
            collection(db, "rides"),
            where("userId", "==", user.uid),
            where("status", "==", "completed"),
            where("userRating", "==", null)
            // Removed orderBy to avoid requiring a composite index
            // We'll sort the results in JavaScript instead
          );

          onSnapshot(completedQuery, (completedSnapshot) => {
            if (!completedSnapshot.empty) {
              // Sort the documents by completedAt in descending order
              const sortedDocs = completedSnapshot.docs.sort((a, b) => {
                const aDate = a.data().completedAt?.toDate() || new Date(0);
                const bDate = b.data().completedAt?.toDate() || new Date(0);
                return bDate - aDate; // Descending order
              });

              const completedRide = {
                id: sortedDocs[0].id,
                ...sortedDocs[0].data()
              };
              setActiveRide(completedRide);
              setShowRating(true);
            } else {
              setActiveRide(null);
            }
          });
        }
        setLoading(false);
      }, (err) => {
        console.error("Error fetching active ride:", err);
        setError("Failed to load ride information");
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      console.error("Error setting up ride listener:", err);
      setError("Failed to load ride information");
      setLoading(false);
    }
  }, [user]);

  // Animate status changes
  useEffect(() => {
    if (activeRide && statusRef.current) {
      // Animate status icon
      if (statusIconRef.current) {
        gsap.fromTo(
          statusIconRef.current,
          { scale: 0, rotation: -180 },
          { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(1.7)" }
        );
      }

      // Animate status text
      if (statusTextRef.current) {
        gsap.fromTo(
          statusTextRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: "power3.out" }
        );
      }

      // Animate captain info
      if (captainInfoRef.current) {
        gsap.fromTo(
          captainInfoRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 0.3, ease: "power3.out" }
        );
      }

      // Animate ride details
      if (rideDetailsRef.current) {
        gsap.fromTo(
          rideDetailsRef.current.children,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, delay: 0.4, ease: "power3.out" }
        );
      }
    }
  }, [activeRide]);

  // Submit rating
  const submitRating = async () => {
    if (!activeRide || !rating) return;

    try {
      await updateDoc(doc(db, "rides", activeRide.id), {
        userRating: rating,
        ratedAt: serverTimestamp()
      });

      // Also update captain's average rating
      if (activeRide.captainId) {
        const captainDoc = await getDoc(doc(db, "captains", activeRide.captainId));
        if (captainDoc.exists()) {
          const captainData = captainDoc.data();
          const currentRating = captainData.rating || 0;
          const totalRatings = captainData.totalRatings || 0;

          // Calculate new average rating
          const newRating = ((currentRating * totalRatings) + rating) / (totalRatings + 1);

          await updateDoc(doc(db, "captains", activeRide.captainId), {
            rating: newRating,
            totalRatings: totalRatings + 1
          });
        }
      }

      setRatingSubmitted(true);

      // Animate success message
      gsap.fromTo(
        ".rating-success",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      );

      // Hide rating dialog after a delay
      setTimeout(() => {
        setShowRating(false);
        setRatingSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error("Error submitting rating:", err);
      setError("Failed to submit rating. Please try again.");
    }
  };

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: "text-yellow-500",
          bgColor: "bg-yellow-500",
          text: "Waiting for captain to accept your ride"
        };
      case "accepted":
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          color: "text-blue-500",
          bgColor: "bg-blue-500",
          text: "Captain is on the way to your pickup location"
        };
      case "in_progress":
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
          color: "text-green-500",
          bgColor: "bg-green-500",
          text: "Your ride is in progress"
        };
      case "completed":
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: "text-green-500",
          bgColor: "bg-green-500",
          text: "Your ride has been completed"
        };
      case "cancelled":
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: "text-red-500",
          bgColor: "bg-red-500",
          text: "Your ride has been cancelled"
        };
      default:
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: "text-gray-500",
          bgColor: "bg-gray-500",
          text: "Unknown status"
        };
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-lg flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-secondary border-t-transparent rounded-full mr-3"></div>
        <p className="text-white">Loading ride status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-300 p-4 rounded-lg flex items-start">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  if (!activeRide) {
    return (
      <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-lg">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">No Active Rides</h3>
          <p className="text-gray-300 mb-4">You don't have any active rides at the moment.</p>
          <button
            onClick={() => window.location.href = '/book'}
            className="bg-gradient-to-r from-secondary to-pink-600 text-white py-3 px-6 rounded-xl hover:from-pink-600 hover:to-secondary transition duration-300 shadow-lg transform hover:-translate-y-1 hover:shadow-xl"
          >
            Book a Ride
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(activeRide.status);

  return (
    <div ref={statusRef}>
      <CaptainCard
        title="Current Ride Status"
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>}
      >
        {/* Status */}
        <div className="flex items-center mb-6">
          <div ref={statusIconRef} className={`w-14 h-14 ${statusInfo.bgColor} bg-opacity-20 rounded-full flex items-center justify-center ${statusInfo.color} mr-4`}>
            {statusInfo.icon}
          </div>
          <div ref={statusTextRef}>
            <h3 className="text-xl font-semibold text-white">{activeRide.status.charAt(0).toUpperCase() + activeRide.status.slice(1)}</h3>
            <p className="text-gray-300">{statusInfo.text}</p>
          </div>
        </div>

        {/* Captain Info */}
        {activeRide.captainId && (
          <div ref={captainInfoRef} className="bg-black bg-opacity-30 p-4 rounded-lg mb-4 border border-gray-700">
            <h4 className="text-sm text-gray-400 mb-2">Captain Information</h4>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-pink-600 rounded-full flex items-center justify-center text-lg font-bold text-white mr-4">
                {activeRide.captainName?.charAt(0) || "C"}
              </div>
              <div>
                <p className="text-white font-medium">{activeRide.captainName || "Captain"}</p>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="flex items-center">
                    <span className="text-yellow-400 mr-1">★</span>
                    {activeRide.captainRating?.toFixed(1) || "New"}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{activeRide.captainVehicle}</span>
                  {activeRide.captainVehicleNumber && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{activeRide.captainVehicleNumber}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {activeRide.captainPhone && (
              <div className="mt-3 flex justify-between">
                <a
                  href={`tel:${activeRide.captainPhone}`}
                  className="bg-green-600 text-white py-2 px-4 rounded-lg flex items-center text-sm hover:bg-green-700 transition-colors duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Captain
                </a>

                <button
                  className="bg-secondary text-white py-2 px-4 rounded-lg flex items-center text-sm hover:bg-pink-700 transition-colors duration-300"
                  onClick={() => {
                    // Open chat with captain
                    alert("Chat functionality will be implemented soon!");
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ride Details */}
        <div ref={rideDetailsRef} className="space-y-4">
          {/* Locations */}
          <div className="bg-black bg-opacity-30 p-4 rounded-lg border border-gray-700">
            <div className="flex items-start mb-3">
              <div className="mt-1 mr-3">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
              </div>
              <div>
                <p className="text-xs text-gray-300">Pickup</p>
                <p className="text-sm text-white">{activeRide.pickupAddress || "Unknown location"}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="mt-1 mr-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div>
                <p className="text-xs text-gray-300">Destination</p>
                <p className="text-sm text-white">{activeRide.dropAddress || "Unknown location"}</p>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-black bg-opacity-30 p-3 rounded-lg text-center border border-gray-700">
              <p className="text-xs text-gray-300 mb-1">Distance</p>
              <p className="text-lg font-semibold text-white">{activeRide.distance} <span className="text-sm">km</span></p>
            </div>
            <div className="bg-black bg-opacity-30 p-3 rounded-lg text-center border border-gray-700">
              <p className="text-xs text-gray-300 mb-1">Fare</p>
              <p className="text-lg font-semibold text-secondary">₹{activeRide.fare}</p>
            </div>
            <div className="bg-black bg-opacity-30 p-3 rounded-lg text-center border border-gray-700">
              <p className="text-xs text-gray-300 mb-1">Est. Time</p>
              <p className="text-lg font-semibold text-white">{activeRide.estimatedTime} <span className="text-sm">mins</span></p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-black bg-opacity-30 p-4 rounded-lg border border-gray-700">
            <h4 className="text-sm text-gray-400 mb-2">Payment Information</h4>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-medium">
                  {activeRide.paymentMethod === "upi" && "UPI Payment"}
                  {activeRide.paymentMethod === "card" && "Card Payment"}
                  {activeRide.paymentMethod === "cash" && "Cash Payment"}
                </p>
                <p className="text-sm text-gray-300">
                  {activeRide.paymentStatus === "pending" && "Payment pending"}
                  {activeRide.paymentStatus === "completed" && "Payment completed"}
                  {activeRide.paymentStatus === "failed" && "Payment failed"}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                activeRide.paymentStatus === "completed" ? "bg-green-500 bg-opacity-20 text-green-400" :
                activeRide.paymentStatus === "failed" ? "bg-red-500 bg-opacity-20 text-red-400" :
                "bg-yellow-500 bg-opacity-20 text-yellow-400"
              }`}>
                {activeRide.paymentStatus.charAt(0).toUpperCase() + activeRide.paymentStatus.slice(1)}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-black bg-opacity-30 p-4 rounded-lg border border-gray-700">
            <h4 className="text-sm text-gray-400 mb-2">Ride Timeline</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-300">Requested</p>
                <p className="text-sm text-white">{formatDate(activeRide.createdAt)}</p>
              </div>
              {activeRide.acceptedAt && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-300">Accepted</p>
                  <p className="text-sm text-white">{formatDate(activeRide.acceptedAt)}</p>
                </div>
              )}
              {activeRide.startedAt && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-300">Started</p>
                  <p className="text-sm text-white">{formatDate(activeRide.startedAt)}</p>
                </div>
              )}
              {activeRide.completedAt && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-300">Completed</p>
                  <p className="text-sm text-white">{formatDate(activeRide.completedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CaptainCard>

      {/* Rating Dialog */}
      {showRating && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border border-gray-700 shadow-2xl max-w-md w-full">
            {!ratingSubmitted ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-2 text-center">Rate Your Ride</h3>
                <p className="text-gray-300 mb-6 text-center">How was your experience with {activeRide.captainName || "your captain"}?</p>

                <div className="flex justify-center mb-6">
                  <RatingStars
                    rating={rating}
                    setRating={setRating}
                    size="large"
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setShowRating(false)}
                    className="bg-gray-700 text-white py-3 px-6 rounded-xl hover:bg-gray-600 transition duration-300"
                  >
                    Skip
                  </button>
                  <button
                    onClick={submitRating}
                    disabled={!rating}
                    className="bg-gradient-to-r from-secondary to-pink-600 text-white py-3 px-6 rounded-xl hover:from-pink-600 hover:to-secondary transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Rating
                  </button>
                </div>
              </>
            ) : (
              <div className="rating-success text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-gray-300 mb-6">Your rating has been submitted successfully.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RideStatus;
