import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LandingPageBackground from "../components/LandingPageBackground";
import AnimatedCard3D from "../components/AnimatedCard3D";
import AnimatedText from "../components/AnimatedText";
import FloatingButton from "../components/FloatingButton";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const navigate = useNavigate();

  // Refs for animations
  const headerRef = useRef(null);
  const mainRef = useRef(null);
  const footerRef = useRef(null);
  const logoRef = useRef(null);

  // Refs for logo text animation
  const logoTextRefs = useRef([]);

  // Add to logo text refs
  const addToLogoTextRefs = (el) => {
    if (el && !logoTextRefs.current.includes(el)) {
      logoTextRefs.current.push(el);
    }
  };

  // GSAP animations
  useEffect(() => {
    // Header animation
    gsap.from(headerRef.current, {
      y: -50,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    });

    // Logo animation
    gsap.from(logoRef.current, {
      scale: 0,
      rotation: 360,
      duration: 1.2,
      delay: 0.3,
      ease: "elastic.out(1, 0.3)"
    });

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

    // Main content animation
    gsap.from(mainRef.current, {
      opacity: 0,
      y: 30,
      duration: 1,
      delay: 0.5,
      ease: "power3.out"
    });

    // Footer animation
    gsap.from(footerRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      delay: 1.5,
      ease: "power3.out"
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col relative overflow-hidden">
      {/* 3D Animated Background */}
      <LandingPageBackground />

      {/* Header */}
      <header ref={headerRef} className="py-6 bg-black bg-opacity-70 backdrop-blur-md z-10 border-b border-gray-800">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <div ref={logoRef} className="w-10 h-10 bg-gradient-to-r from-secondary to-pink-600 rounded-full flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold">
              <span ref={addToLogoTextRefs} className="text-secondary animated-logo-text inline-block">SAFE</span>
              <span ref={addToLogoTextRefs} className="text-white animated-logo-text inline-block">WINGS</span>
            </h1>
          </div>

          <div className="hidden md:flex space-x-4">
            <button onClick={() => navigate("/login")} className="px-4 py-2 text-white hover:text-secondary transition-colors duration-300">
              Login
            </button>
            <button onClick={() => navigate("/signup")} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-pink-600 transition-colors duration-300">
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main ref={mainRef} className="flex-grow flex items-center justify-center z-10 relative">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-secondary rounded-lg blur opacity-20 animate-pulse"></div>
            <div className="relative">
              <AnimatedText
                as="h2"
                className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300"
                type="words"
                stagger={0.1}
                duration={1}
              >
                Choose Your Experience
              </AnimatedText>

              <AnimatedText
                as="p"
                className="text-xl text-gray-300 max-w-2xl mx-auto"
                type="lines"
                stagger={0.2}
                delay={0.5}
                duration={0.8}
              >
                Whether you're looking for a ride or want to earn money as a captain,
                we've got you covered with our state-of-the-art platform.
              </AnimatedText>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Passenger Card */}
            <AnimatedCard3D
              className="bg-black bg-opacity-50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-800"
              borderColor="#ff1493"
              delay={0.3}
            >
              <div className="h-56 bg-gradient-to-r from-secondary to-pink-700 flex items-center justify-center relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full bg-white opacity-20"
                      style={{
                        width: `${Math.random() * 20 + 5}px`,
                        height: `${Math.random() * 20 + 5}px`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 10 + 10}s`,
                        animationDelay: `${Math.random() * 5}s`,
                        animation: 'float-around infinite linear'
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 transform transition-transform duration-700 hover:scale-110 hover:rotate-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-28 w-28 text-white drop-shadow-lg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
              </div>
              <div className="p-8">
                <AnimatedText
                  as="h3"
                  className="text-3xl font-bold mb-3 text-secondary"
                  type="words"
                  stagger={0.1}
                  delay={0.8}
                >
                  Passenger App
                </AnimatedText>

                <AnimatedText
                  as="p"
                  className="text-gray-300 mb-8 text-lg"
                  type="lines"
                  stagger={0.2}
                  delay={1}
                >
                  Need a ride? Book a trip with our trusted captains and get to your
                  destination safely and comfortably. Enjoy transparent pricing and real-time tracking.
                </AnimatedText>

                <FloatingButton
                  onClick={() => navigate("/login")}
                  className="w-full bg-gradient-to-r from-secondary to-pink-600 text-white py-4 rounded-xl font-medium shadow-lg flex items-center justify-center"
                  glowColor="rgba(255, 20, 147, 0.5)"
                  delay={1.2}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Continue as Passenger
                </FloatingButton>
              </div>
            </AnimatedCard3D>

            {/* Captain Card */}
            <AnimatedCard3D
              className="bg-black bg-opacity-50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-800"
              borderColor="#ff1493"
              delay={0.5}
            >
              <div className="h-56 bg-gradient-to-r from-pink-700 to-secondary flex items-center justify-center relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full bg-white opacity-20"
                      style={{
                        width: `${Math.random() * 20 + 5}px`,
                        height: `${Math.random() * 20 + 5}px`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 10 + 10}s`,
                        animationDelay: `${Math.random() * 5}s`,
                        animation: 'float-around infinite linear'
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 transform transition-transform duration-700 hover:scale-110 hover:rotate-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-28 w-28 text-white drop-shadow-lg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="p-8">
                <AnimatedText
                  as="h3"
                  className="text-3xl font-bold mb-3 text-secondary"
                  type="words"
                  stagger={0.1}
                  delay={1}
                >
                  Captain App
                </AnimatedText>

                <AnimatedText
                  as="p"
                  className="text-gray-300 mb-8 text-lg"
                  type="lines"
                  stagger={0.2}
                  delay={1.2}
                >
                  Want to earn money on your own schedule? Join our team of captains
                  and start earning today. Set your own hours and maximize your income.
                </AnimatedText>

                <FloatingButton
                  onClick={() => navigate("/captain/login")}
                  className="w-full bg-gradient-to-r from-pink-600 to-secondary text-white py-4 rounded-xl font-medium shadow-lg flex items-center justify-center"
                  glowColor="rgba(255, 20, 147, 0.5)"
                  delay={1.4}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Continue as Captain
                </FloatingButton>
              </div>
            </AnimatedCard3D>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <div className="py-16 bg-black bg-opacity-70 backdrop-blur-md border-t border-gray-800 z-10 relative mt-12">
        <div className="container mx-auto px-4">
          <AnimatedText
            as="h2"
            className="text-3xl md:text-4xl font-bold mb-12 text-center text-white"
            type="words"
            stagger={0.1}
          >
            Why Choose <span className="text-secondary">SAFE WINGS</span>
          </AnimatedText>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border border-gray-800 transform transition-all duration-500 hover:scale-105 hover:border-secondary">
              <div className="w-16 h-16 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white text-center">Fast Pickups</h3>
              <p className="text-gray-400 text-center">
                Our captains arrive quickly to get you to your destination on time, with an average wait time of just 3 minutes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border border-gray-800 transform transition-all duration-500 hover:scale-105 hover:border-secondary">
              <div className="w-16 h-16 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white text-center">Safe Rides</h3>
              <p className="text-gray-400 text-center">
                All our captains are verified and trained to ensure your safety, with real-time tracking and emergency assistance.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border border-gray-800 transform transition-all duration-500 hover:scale-105 hover:border-secondary">
              <div className="w-16 h-16 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white text-center">Affordable Prices</h3>
              <p className="text-gray-400 text-center">
                Enjoy competitive rates and transparent pricing with no hidden fees. Pay easily with UPI, cards, or cash.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer ref={footerRef} className="py-8 bg-black bg-opacity-90 backdrop-blur-md border-t border-gray-800 z-10 relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-secondary to-pink-600 rounded-full flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <span className="text-white font-bold">
                <span ref={addToLogoTextRefs} className="text-secondary inline-block">SAFE</span>
                <span ref={addToLogoTextRefs} className="text-white inline-block">WINGS</span>
              </span>
            </div>

            <div className="text-center md:text-right text-gray-400">
              <p>&copy; {new Date().getFullYear()} SAFE WINGS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
