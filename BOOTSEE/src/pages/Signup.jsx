import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AuthBackground from "../components/AuthBackground";
import AnimatedAuthForm from "../components/AnimatedAuthForm";
import { gsap } from "gsap";

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(email, password);
      navigate("/");
    } catch (err) {
      setError("Signup failed. Please try again.");
    }
  };

  // Refs for animations
  const formRef = useRef(null);
  const buttonRef = useRef(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* 3D Animated Background */}
      <AuthBackground />

      {/* Animated Form */}
      <AnimatedAuthForm title="Passenger Sign Up">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-white transition-all duration-300 focus:border-secondary"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Password</label>
            <input
              type="password"
              placeholder="Create a password"
              className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-white transition-all duration-300 focus:border-secondary"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
            className="w-full bg-gradient-to-r from-secondary to-pink-600 text-white font-medium py-4 rounded-xl hover:from-pink-600 hover:to-secondary transition duration-300 shadow-lg transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center mt-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Sign Up
          </button>
        </form>
        <div className="mt-8 text-center">
          <p className="text-center text-sm text-gray-300">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-secondary hover:text-white transition-colors duration-300 cursor-pointer font-medium"
            >
              Log in
            </span>
          </p>
          <div className="mt-4 text-center">
            <span
              onClick={() => navigate("/captain/signup")}
              className="text-gray-300 text-sm hover:text-secondary transition-colors duration-300 cursor-pointer flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Sign up as Captain
            </span>
          </div>
        </div>
      </AnimatedAuthForm>
    </div>
  );
};

export default Signup;
