import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { sendPasswordResetEmail } from "firebase/auth";
import AuthBackground from "../components/AuthBackground";
import AnimatedAuthForm from "../components/AnimatedAuthForm";
import { gsap } from "gsap";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);

      // Set a success message
      setSuccess("Login successful! Redirecting to home page...");

      // Navigate to home page after a short delay to show the success message
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (err) {
      console.error("Login error:", err);

      // Handle different Firebase auth errors
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many failed login attempts. Please try again later.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError("Login failed: " + (err.message || "Please try again"));
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!resetEmail.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccess("Password reset email sent! Please check your inbox.");
      // Clear the form
      setResetEmail("");
    } catch (err) {
      console.error("Password reset error:", err);

      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email address");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email address format");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError("Failed to send reset email: " + (err.message || "Please try again"));
      }
    } finally {
      setLoading(false);
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

  // Render login form
  const renderLoginForm = () => (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">Email or Username</label>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-white transition-all duration-300 focus:border-secondary"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-white mb-2">Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-white transition-all duration-300 focus:border-secondary"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end">
        <span
          onClick={() => setShowForgotPassword(true)}
          className="text-secondary text-sm hover:text-white transition-colors duration-300 cursor-pointer"
        >
          Forgot password?
        </span>
      </div>

      <button
        ref={buttonRef}
        type="submit"
        className="w-full bg-gradient-to-r from-secondary to-pink-600 text-white font-medium py-4 rounded-xl hover:from-pink-600 hover:to-secondary transition duration-300 shadow-lg transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center mt-6"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Logging in...
          </span>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Login
          </>
        )}
      </button>
    </form>
  );

  // Render forgot password form
  const renderForgotPasswordForm = () => (
    <form onSubmit={handlePasswordReset} className="space-y-6">
      <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg mb-4">
        <p className="text-sm text-gray-300">
          Enter your email address below and we'll send you a link to reset your password.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-white transition-all duration-300 focus:border-secondary"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => {
            setShowForgotPassword(false);
            setError("");
            setSuccess("");
          }}
          className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition duration-300 flex-1"
          disabled={loading}
        >
          Back to Login
        </button>

        <button
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-secondary to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-secondary transition duration-300 flex-1"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* 3D Animated Background */}
      <AuthBackground />

      {/* Animated Form */}
      <AnimatedAuthForm title={showForgotPassword ? "Reset Password" : "Passenger Login"}>
        {success && (
          <div className="bg-green-900 bg-opacity-30 border border-green-500 text-green-300 p-3 rounded-lg flex items-start mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-300 p-3 rounded-lg flex items-start mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {showForgotPassword ? renderForgotPasswordForm() : renderLoginForm()}

        {!showForgotPassword && (
          <div className="mt-8 text-center">
            <p className="text-center text-sm text-gray-300">
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/signup")}
                className="text-secondary hover:text-white transition-colors duration-300 cursor-pointer font-medium"
              >
                Sign up
              </span>
            </p>
            <div className="mt-4 text-center">
              <span
                onClick={() => navigate("/captain/login")}
                className="text-gray-300 text-sm hover:text-secondary transition-colors duration-300 cursor-pointer flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Login as Captain
              </span>
            </div>
          </div>
        )}
      </AnimatedAuthForm>
    </div>
  );
};

export default Login;
