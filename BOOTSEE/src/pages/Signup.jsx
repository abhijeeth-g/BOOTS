import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="min-h-screen bg-primary text-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-primary shadow-lg rounded-2xl p-8 border border-secondary">
        <h2 className="text-3xl font-semibold text-center text-secondary mb-6">Passenger Sign Up</h2>
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
              placeholder="Create a password"
              className="w-full px-4 py-3 bg-dark-primary border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-secondary text-white font-medium py-3 rounded-xl hover:bg-pink-700 transition duration-200"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-secondary hover:underline cursor-pointer"
          >
            Log in
          </span>
        </p>
        <div className="mt-4 text-center">
          <span
            onClick={() => navigate("/captain/signup")}
            className="text-gray-400 text-sm hover:text-secondary cursor-pointer"
          >
            Sign up as Captain
          </span>
        </div>
      </div>
    </div>
  );
};

export default Signup;
