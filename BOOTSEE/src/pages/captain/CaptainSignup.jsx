import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

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

  return (
    <div className="min-h-screen bg-primary text-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-primary shadow-lg rounded-2xl p-8 border border-secondary">
        <h2 className="text-3xl font-semibold text-center text-secondary mb-6">Captain Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-accent mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="w-full px-4 py-3 bg-dark-primary border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
            <label className="block text-sm font-medium text-accent mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              className="w-full px-4 py-3 bg-dark-primary border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-accent mb-1">Vehicle Number</label>
            <input
              type="text"
              placeholder="Enter your vehicle number"
              className="w-full px-4 py-3 bg-dark-primary border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
              onChange={(e) => setVehicleNumber(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-accent mb-1">Vehicle Model</label>
            <input
              type="text"
              placeholder="Enter your vehicle model"
              className="w-full px-4 py-3 bg-dark-primary border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
              onChange={(e) => setVehicleModel(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-accent mb-1">Password</label>
            <input
              type="password"
              placeholder="Create a password"
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
            {loading ? "Creating Account..." : "Sign Up as Captain"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/captain/login")}
            className="text-secondary hover:underline cursor-pointer"
          >
            Log in
          </span>
        </p>
      </div>
    </div>
  );
};

export default CaptainSignup;
