import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import UserRideHistory from "../pages/user/UserRideHistory";
import UserProfile from "../pages/user/UserProfile";
import LandingPage from "../pages/LandingPage";
import PaymentPage from "../pages/PaymentPage";
import PaymentSuccessPage from "../pages/PaymentSuccessPage";
import UpiQrCodePage from "../pages/UpiQrCodePage";
import TestDocumentStorage from "../pages/TestDocumentStorage";
import { useAuth } from "../context/AuthContext";

// Captain pages
import CaptainLogin from "../pages/captain/CaptainLogin";
import CaptainSignup from "../pages/captain/CaptainSignup";
import CaptainDashboard from "../pages/captain/CaptainDashboard";
import CaptainProfile from "../pages/captain/CaptainProfile";
import CaptainRideHistory from "../pages/captain/CaptainRideHistory";
import CaptainEarnings from "../pages/captain/CaptainEarnings";

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
      <Route path="/profile" element={user ? <UserProfile /> : <Navigate to="/login" />} />

      {/* Captain Routes */}
      <Route path="/captain/login" element={!user ? <CaptainLogin /> : <Navigate to="/captain/dashboard" />} />
      <Route path="/captain/signup" element={!user ? <CaptainSignup /> : <Navigate to="/captain/dashboard" />} />
      <Route path="/captain/dashboard" element={user ? <CaptainDashboard /> : <Navigate to="/captain/login" />} />
      <Route path="/captain/profile" element={user ? <CaptainProfile /> : <Navigate to="/captain/login" />} />
      <Route path="/captain/rides" element={user ? <CaptainRideHistory /> : <Navigate to="/captain/login" />} />
      <Route path="/captain/earnings" element={user ? <CaptainEarnings /> : <Navigate to="/captain/login" />} />

      {/* Payment Routes */}
      <Route path="/payment" element={user ? <PaymentPage /> : <Navigate to="/login" />} />
      <Route path="/payment-success" element={user ? <PaymentSuccessPage /> : <Navigate to="/login" />} />
      <Route path="/upi-qr-code" element={<UpiQrCodePage />} />

      {/* Test Routes */}
      <Route path="/test-storage" element={<TestDocumentStorage />} />
    </Routes>
  );
};

export default AppRoutes;