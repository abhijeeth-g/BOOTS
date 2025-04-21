import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import CaptainAuthBackground from "../../components/CaptainAuthBackground";
import AnimatedAuthForm from "../../components/AnimatedAuthForm";
import { gsap } from "gsap";

const CaptainSignup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create user with email and password
      const userCredential = await signup(email, password);

      // Add captain details to Firestore
      await setDoc(doc(db, "captains", userCredential.user.uid), {
        name,
        email,
        phone,
        vehicleNumber,
        vehicleModel,
        rating: 0,
        totalRatings: 0,
        isOnline: false,
        currentLocation: null,
        createdAt: serverTimestamp(),
        role: "captain"
      });

      navigate("/captain/dashboard");
    } catch (err) {
      console.error("Signup error:", err);

      // Handle different Firebase auth errors
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please use a different email or login.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email address format.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. Please use a stronger password.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError("Signup failed: " + (err.message || "Please try again"));
      }
    } finally {
      setLoading(false);
    }
  };

  // Refs for animations
  const formRef = useRef(null);
  const buttonRef = useRef(null);
  const formFieldsRef = useRef([]);

  // Button animation on hover
  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.addEventListener('mouseenter', () => {
        gsap.to(buttonRef.current, {
          scale: 1.05,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      buttonRef.current.addEventListener('mouseleave', () => {
        gsap.to(buttonRef.current, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      // Cleanup
      return () => {
        if (buttonRef.current) {
          buttonRef.current.removeEventListener('mouseenter', () => {});
          buttonRef.current.removeEventListener('mouseleave', () => {});
        }
      };
    }
  }, []);

  // Form fields animation
  useEffect(() => {
    if (formFieldsRef.current.length > 0) {
      gsap.fromTo(
        formFieldsRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.4, delay: 0.5 }
      );
    }
  }, []);

  // Add field to refs
  const addToFieldRefs = (el) => {
    if (el && !formFieldsRef.current.includes(el)) {
      formFieldsRef.current.push(el);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* 3D Animated Background */}
      <CaptainAuthBackground />

      {/* Animated Form */}
      <AnimatedAuthForm title="Captain Sign Up">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div ref={addToFieldRefs}>
              <label className="block text-sm font-medium text-white mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-white transition-all duration-300 focus:border-secondary"
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div ref={addToFieldRefs}>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-white transition-all duration-300 focus:border-secondary"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div ref={addToFieldRefs}>
              <label className="block text-sm font-medium text-white mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-white transition-all duration-300 focus:border-secondary"
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div ref={addToFieldRefs}>
              <label className="block text-sm font-medium text-white mb-2">Vehicle Number</label>
              <input
                type="text"
                placeholder="Enter your vehicle number"
                className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-white transition-all duration-300 focus:border-secondary"
                onChange={(e) => setVehicleNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div ref={addToFieldRefs}>
              <label className="block text-sm font-medium text-white mb-2">Vehicle Model</label>
              <input
                type="text"
                placeholder="Enter your vehicle model"
                className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-white transition-all duration-300 focus:border-secondary"
                onChange={(e) => setVehicleModel(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div ref={addToFieldRefs}>
              <label className="block text-sm font-medium text-white mb-2">Password</label>
              <input
                type="password"
                placeholder="Create a password"
                className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-white transition-all duration-300 focus:border-secondary"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>



          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-300 p-3 rounded-lg flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            ref={buttonRef}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-secondary to-pink-600 text-white font-medium py-4 rounded-xl hover:from-pink-600 hover:to-secondary transition duration-300 shadow-lg transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center mt-6"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Sign Up as Captain
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-center text-sm text-gray-300">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/captain/login")}
              className="text-secondary hover:text-white transition-colors duration-300 cursor-pointer font-medium"
            >
              Log in
            </span>
          </p>
          <div className="mt-4 text-center">
            <span
              onClick={() => navigate("/signup")}
              className="text-gray-300 text-sm hover:text-secondary transition-colors duration-300 cursor-pointer flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Sign up as Passenger
            </span>
          </div>
        </div>
      </AnimatedAuthForm>
    </div>
  );
};

export default CaptainSignup;
