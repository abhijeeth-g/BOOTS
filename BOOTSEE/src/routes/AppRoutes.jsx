import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import UserRideHistory from "../pages/user/UserRideHistory";
import LandingPage from "../pages/LandingPage";
import { useAuth } from "../context/AuthContext";

// Captain pages
import CaptainLogin from "../pages/captain/CaptainLogin";
import CaptainSignup from "../pages/captain/CaptainSignup";
import CaptainDashboard from "../pages/captain/CaptainDashboard";
import CaptainProfile from "../pages/captain/CaptainProfile";
import CaptainRideHistory from "../pages/captain/CaptainRideHistory";

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* User Routes */}
      <Route path="/home" element={user ? <Home /> : <Navigate to="/login" />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/home" />} />
      <Route path="/ridehistory" element={user ? <UserRideHistory /> : <Navigate to="/login" />} />

      {/* Captain Routes */}
      <Route path="/captain/login" element={!user ? <CaptainLogin /> : <Navigate to="/captain/dashboard" />} />
      <Route path="/captain/signup" element={!user ? <CaptainSignup /> : <Navigate to="/captain/dashboard" />} />
      <Route path="/captain/dashboard" element={user ? <CaptainDashboard /> : <Navigate to="/captain/login" />} />
      <Route path="/captain/profile" element={user ? <CaptainProfile /> : <Navigate to="/captain/login" />} />
      <Route path="/captain/rides" element={user ? <CaptainRideHistory /> : <Navigate to="/captain/login" />} />
    </Routes>
  );
};

export default AppRoutes;