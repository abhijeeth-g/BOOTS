import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";

const CaptainLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Login with email and password
      const userCredential = await login(email, password);

      // Check if user is a captain
      const captainDoc = await getDoc(doc(db, "captains", userCredential.user.uid));

      if (!captainDoc.exists()) {
        // Not a captain, show error
        setError("This account is not registered as a captain");
        return;
      }

      // Navigate to captain dashboard
      navigate("/captain/dashboard");
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

  return (
    <div className="min-h-screen bg-primary text-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-primary shadow-lg rounded-2xl p-8 border border-secondary">
        <h2 className="text-3xl font-semibold text-center text-secondary mb-6">Captain Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-accent mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-dark-primary border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-accent mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-4 py-3 bg-dark-primary border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white font-medium py-3 rounded-xl hover:bg-pink-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login as Captain"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have a captain account?{" "}
          <span
            onClick={() => navigate("/captain/signup")}
            className="text-secondary hover:underline cursor-pointer"
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
};

export default CaptainLogin;
