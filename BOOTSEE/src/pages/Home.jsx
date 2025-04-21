import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import AnimatedWrapper from "../components/AnimatedWrapper";
import EnhancedHeroBackground from "../components/EnhancedHeroBackground";
import ParticleBackground from "../components/ParticleBackground";
import AnimatedFeature from "../components/AnimatedFeature";
import FloatingElement from "../components/FloatingElement";
import Interactive3DCard from "../components/Interactive3DCard";
import AnimatedCounter from "../components/AnimatedCounter";
import RideStatus from "../components/RideStatus";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentRides, setRecentRides] = useState([]);
  const [nearbyCaptains, setNearbyCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRideForm, setShowRideForm] = useState(true);

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

  // Refs for GSAP animations
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const ctaRef = useRef(null);
  const logoTextRefs = useRef([]);

  // Add to logo text refs
  const addToLogoTextRefs = (el) => {
    if (el && !logoTextRefs.current.includes(el)) {
      logoTextRefs.current.push(el);
    }
  };

  // GSAP animations
  useEffect(() => {
    // Logo text animation
    if (logoTextRefs.current.length > 0) {
      // Initial animation
      gsap.from(logoTextRefs.current, {
        y: 40,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        delay: 0.5,
        ease: "back.out(1.7)"
      });

      // Create a timeline for continuous animation
      const tl = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 2 });

      // Add subtle animations
      tl.to(logoTextRefs.current, {
        y: -5,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.inOut"
      })
      .to(logoTextRefs.current, {
        y: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.inOut"
      });
    }
    // Hero section animation
    gsap.from(heroRef.current, {
      opacity: 0,
      y: 30,
      duration: 1.5,
      ease: "power3.out"
    });

    // Animate hero text elements
    const heroTextElements = heroRef.current?.querySelectorAll('.hero-text');
    if (heroTextElements) {
      gsap.from(heroTextElements, {
        opacity: 0,
        y: 50,
        stagger: 0.2,
        duration: 1,
        ease: "power3.out",
        delay: 0.5
      });
    }

    // Animate the hero image
    const heroImage = heroRef.current?.querySelector('.hero-image');
    if (heroImage) {
      gsap.from(heroImage, {
        opacity: 0,
        scale: 0.8,
        rotation: 5,
        duration: 1.2,
        ease: "back.out(1.7)",
        delay: 0.3
      });
    }

    // Create scroll animations
    gsap.to('.parallax-bg', {
      backgroundPosition: '0 50%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.parallax-bg',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });

    // Features section animation
    if (featuresRef.current) {
      ScrollTrigger.create({
        trigger: featuresRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.to(featuresRef.current, {
            backgroundPosition: '100% 50%',
            duration: 15,
            ease: "none",
            repeat: -1,
            yoyo: true
          });
        }
      });
    }

    // Stats section animation
    if (statsRef.current) {
      ScrollTrigger.create({
        trigger: statsRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from(statsRef.current.querySelectorAll('.stat-item'), {
            y: 50,
            opacity: 0,
            stagger: 0.2,
            duration: 0.8,
            ease: "back.out(1.7)"
          });
        }
      });
    }

    // CTA section animation
    if (ctaRef.current) {
      ScrollTrigger.create({
        trigger: ctaRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from(ctaRef.current, {
            scale: 0.9,
            opacity: 0,
            duration: 1,
            ease: "elastic.out(1, 0.5)"
          });
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-primary text-accent">
      {/* Particle Background */}
      <ParticleBackground color="#ff1493" count={70} />

      {/* Hero Section */}
      <div ref={heroRef} className="relative bg-gradient-to-r from-gray-900 to-black py-24 px-4 border-b border-gray-800 overflow-hidden parallax-bg">
        <EnhancedHeroBackground />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="hero-text text-5xl md:text-7xl font-bold mb-6 leading-tight text-white">
                <span className="text-secondary">Fast</span> & <span className="text-secondary">Reliable</span> Rides
              </h1>
              <p className="hero-text text-xl text-white mb-8 max-w-lg">
                Book a ride with our trusted captains and get to your destination safely and comfortably. Enjoy transparent pricing and real-time tracking.
              </p>
              <button
                onClick={() => {
                  setShowRideForm(!showRideForm);
                  if (!showRideForm) {
                    // Scroll to booking form
                    setTimeout(() => {
                      document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className="hero-text bg-gradient-to-r from-secondary to-pink-600 text-white px-8 py-4 rounded-xl font-medium hover:from-pink-600 hover:to-secondary transition duration-300 shadow-lg transform hover:-translate-y-1 hover:shadow-xl flex items-center relative overflow-hidden group"
              >
                <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-white rounded-full group-hover:w-32 group-hover:h-32 opacity-10"></span>
                {showRideForm ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Hide Booking Form
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Book a Ride Now
                  </>
                )}
              </button>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-secondary rounded-lg blur opacity-25 animate-pulse"></div>
                <FloatingElement delay={0.5} distance={20}>
                  <img
                    src="https://img.freepik.com/free-vector/city-driver-concept-illustration_114360-1209.jpg"
                    alt="Ride Illustration"
                    className="hero-image relative w-full max-w-md rounded-lg shadow-2xl border border-gray-700 transform transition-all duration-500"
                  />
                </FloatingElement>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Ride Status Section */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <AnimatedWrapper delay={0.1}>
            <RideStatus />
          </AnimatedWrapper>
        </div>
      )}

      {/* Map and Booking Section */}
      <div id="booking-section" className="max-w-7xl mx-auto px-4 py-12">
        {/* Always visible Book a Ride button */}
        {!showRideForm && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowRideForm(true)}
              className="bg-gradient-to-r from-secondary to-pink-600 text-white px-8 py-4 rounded-xl font-medium hover:from-pink-600 hover:to-secondary transition duration-300 shadow-lg transform hover:-translate-y-1 hover:shadow-xl flex items-center mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Book a Ride Now
            </button>
          </div>
        )}
        {showRideForm && (
          <AnimatedWrapper delay={0.1}>
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-lg overflow-hidden mb-12 border border-gray-700">
              <div className="flex justify-end p-2">
                <button
                  onClick={() => setShowRideForm(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Book Your Ride
                </h2>
                <p className="text-gray-400 ml-8">Enter your pickup and destination details</p>
              </div>
              <div className="p-6">
                <MapView />
              </div>
            </div>
          </AnimatedWrapper>
        )}

        {/* Recent Rides and Nearby Captains */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <AnimatedWrapper delay={0.2}>
          {/* Recent Rides */}
          <Interactive3DCard className="overflow-hidden" depth={20} sensitivity={15}>
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Rides
              </h2>
            </div>
            <div className="p-6">
              {recentRides.length > 0 ? (
                <div className="space-y-4">
                  {recentRides.map(ride => (
                    <div key={ride.id} className="bg-black bg-opacity-40 border border-gray-700 rounded-lg p-4 hover:border-secondary transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${ride.status === "completed" ? "bg-green-500" : ride.status === "cancelled" ? "bg-red-500" : ride.status === "in_progress" ? "bg-blue-500" : "bg-yellow-500"}`}></span>
                            <p className="font-medium">{ride.pickupAddress || "Unknown pickup"} → {ride.dropAddress || "Unknown destination"}</p>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{formatDate(ride.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold bg-secondary px-2 py-1 rounded-md mb-1">₹{ride.fare?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 'N/A'}</p>
                          <div className="flex items-center justify-end text-sm bg-gray-700 text-white px-2 py-1 rounded-md">
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
                <div className="text-center py-8 bg-black bg-opacity-30 rounded-lg border border-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <p className="text-gray-400 mb-4">No recent rides found</p>
                  <button
                    onClick={() => setShowRideForm(true)}
                    className="mt-2 bg-gradient-to-r from-secondary to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-secondary transition duration-300 shadow-lg transform hover:-translate-y-1 hover:shadow-xl flex items-center mx-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Book Your First Ride
                  </button>
                </div>
              )}
              {recentRides.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate("/ridehistory")}
                    className="bg-white bg-opacity-10 text-secondary hover:bg-opacity-20 px-6 py-2 rounded-lg transition duration-300 flex items-center mx-auto"
                  >
                    <span>View All Rides</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </Interactive3DCard>
          </AnimatedWrapper>

          <AnimatedWrapper delay={0.4}>
          {/* Nearby Captains */}
          <Interactive3DCard className="overflow-hidden" depth={20} sensitivity={15}>
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Nearby Captains
              </h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8 bg-black bg-opacity-30 rounded-lg border border-gray-700">
                  <svg className="animate-spin h-10 w-10 text-secondary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-400">Loading captains...</p>
                </div>
              ) : nearbyCaptains.length > 0 ? (
                <div className="space-y-4">
                  {nearbyCaptains.map(captain => (
                    <div key={captain.id} className="flex items-center bg-black bg-opacity-40 border border-gray-700 rounded-lg p-4 hover:border-secondary transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
                      <div className="w-12 h-12 bg-gradient-to-br from-secondary to-pink-600 rounded-full flex items-center justify-center text-xl font-bold text-white mr-4 shadow-lg">
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
                <div className="text-center py-8 bg-black bg-opacity-30 rounded-lg border border-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-gray-400 mb-2">No captains available nearby</p>
                  <p className="text-sm text-gray-500">Try again in a few minutes</p>
                </div>
              )}
            </div>
          </Interactive3DCard>
          </AnimatedWrapper>
        </div>
      </div>

      {/* Stats Section */}
      <div ref={statsRef} className="relative bg-gradient-to-br from-gray-800 to-black py-16 px-4 mt-12 border-t border-gray-800 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="stat-item bg-black bg-opacity-50 p-6 rounded-xl border border-gray-700 text-center transform transition-all hover:scale-105 hover:border-secondary">
              <div className="text-4xl font-bold text-secondary mb-2">
                <AnimatedCounter end={5000} suffix="+" triggerElement={statsRef.current} />
              </div>
              <p className="text-gray-300">Happy Riders</p>
            </div>

            <div className="stat-item bg-black bg-opacity-50 p-6 rounded-xl border border-gray-700 text-center transform transition-all hover:scale-105 hover:border-secondary">
              <div className="text-4xl font-bold text-secondary mb-2">
                <AnimatedCounter end={500} suffix="+" triggerElement={statsRef.current} />
              </div>
              <p className="text-gray-300">Expert Captains</p>
            </div>

            <div className="stat-item bg-black bg-opacity-50 p-6 rounded-xl border border-gray-700 text-center transform transition-all hover:scale-105 hover:border-secondary">
              <div className="text-4xl font-bold text-secondary mb-2">
                <AnimatedCounter end={50000} suffix="+" triggerElement={statsRef.current} />
              </div>
              <p className="text-gray-300">Rides Completed</p>
            </div>

            <div className="stat-item bg-black bg-opacity-50 p-6 rounded-xl border border-gray-700 text-center transform transition-all hover:scale-105 hover:border-secondary">
              <div className="text-4xl font-bold text-secondary mb-2">
                <AnimatedCounter end={20} suffix=" Cities" triggerElement={statsRef.current} />
              </div>
              <p className="text-gray-300">And Growing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="relative bg-gradient-to-br from-gray-900 to-black py-20 px-4 mt-12 border-t border-gray-800 overflow-hidden" style={{ backgroundSize: '200% 200%' }}>
        {/* Add a subtle background pattern */}
        <div className="absolute inset-0 z-0 opacity-10" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          backgroundSize: '60px 60px'
        }}></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 relative inline-block">
              Why Choose <span ref={addToLogoTextRefs} className="text-secondary animated-logo-text inline-block">SAFE WINGS</span>
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-secondary to-transparent"></div>
            </h2>
            <p className="text-gray-300 text-xl max-w-2xl mx-auto mt-4">Experience the best ride-sharing service with premium features and reliable captains</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FloatingElement delay={0.1} distance={10} rotation={3}>
              <AnimatedFeature
                index={0}
                icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Fast Pickups"
              description="Our captains arrive quickly to get you to your destination on time, with an average wait time of just 3 minutes."
              />
            </FloatingElement>

            <FloatingElement delay={0.2} distance={10} rotation={3}>
              <AnimatedFeature
                index={1}
                icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              title="Safe Rides"
              description="All our captains are verified and trained to ensure your safety, with real-time tracking and emergency assistance."
              />
            </FloatingElement>

            <FloatingElement delay={0.3} distance={10} rotation={3}>
              <AnimatedFeature
                index={2}
                icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
              title="Affordable Prices"
              description="Enjoy competitive rates and transparent pricing with no hidden fees. Pay easily with UPI, cards, or cash."
              />
            </FloatingElement>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div ref={ctaRef} className="relative bg-gradient-to-r from-secondary to-pink-600 py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-repeat" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            <span ref={addToLogoTextRefs} className="animated-logo-text inline-block">Ready for Your Next Ride?</span>
          </h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">Join thousands of satisfied riders who trust <span ref={addToLogoTextRefs} className="text-secondary font-bold animated-logo-text inline-block">SAFE WINGS</span> for their daily commute. Fast, safe, and affordable rides are just a click away.</p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => {
                setShowRideForm(true);
                document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-secondary px-8 py-4 rounded-xl font-medium hover:bg-gray-100 transition duration-300 shadow-lg transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Book a Ride Now
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="bg-transparent text-white border-2 border-white px-8 py-4 rounded-xl font-medium hover:bg-white hover:text-secondary transition duration-300 shadow-lg transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Sign Up Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;