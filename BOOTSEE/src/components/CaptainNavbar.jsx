import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

const CaptainNavbar = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [captainData, setCaptainData] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchCaptainData = async () => {
      if (!user) return;

      try {
        const captainDoc = await getDoc(doc(db, "captains", user.uid));
        if (captainDoc.exists()) {
          setCaptainData(captainDoc.data());
        }
      } catch (error) {
        console.error("Error fetching captain data:", error);
      }
    };

    fetchCaptainData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const isCaptainRoute = location.pathname.startsWith("/captain");

  if (!isCaptainRoute) return null;

  return (
    <nav className="bg-primary shadow-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-accent hover:text-gray-400 hover:bg-dark-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-accent"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between flex-1 sm:items-stretch sm:justify-start">
            <div className="flex-shrink-0">
              <Link to="/captain/dashboard" className="text-secondary text-2xl font-bold">
                Captain App
              </Link>
            </div>
            <div className="hidden sm:block sm:ml-6">
              <div className="flex space-x-4">
                <Link
                  to="/captain/dashboard"
                  className={`px-3 py-2 rounded-md text-lg font-medium ${
                    location.pathname === "/captain/dashboard"
                      ? "bg-secondary text-accent"
                      : "text-accent hover:bg-dark-primary"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/captain/rides"
                  className={`px-3 py-2 rounded-md text-lg font-medium ${
                    location.pathname === "/captain/rides"
                      ? "bg-secondary text-accent"
                      : "text-accent hover:bg-dark-primary"
                  }`}
                >
                  Ride History
                </Link>
                <Link
                  to="/captain/profile"
                  className={`px-3 py-2 rounded-md text-lg font-medium ${
                    location.pathname === "/captain/profile"
                      ? "bg-secondary text-accent"
                      : "text-accent hover:bg-dark-primary"
                  }`}
                >
                  Profile
                </Link>
                <Link
                  to="/captain/earnings"
                  className={`px-3 py-2 rounded-md text-lg font-medium ${
                    location.pathname === "/captain/earnings"
                      ? "bg-secondary text-accent"
                      : "text-accent hover:bg-dark-primary"
                  }`}
                >
                  Earnings
                </Link>
                {user && (
                  <button
                    onClick={handleLogout}
                    className="text-accent px-3 py-2 rounded-md text-lg font-medium hover:bg-dark-primary"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* User info */}
          {user && captainData && (
            <div className="hidden md:flex items-center">
              <div className="text-right mr-3">
                <p className="text-accent text-sm">{captainData.name}</p>
                <p className="text-gray-400 text-xs">
                  {captainData.isOnline ? "Online" : "Offline"}
                </p>
              </div>
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-accent font-bold">
                {captainData.name?.charAt(0) || "C"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-primary px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/captain/dashboard"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              location.pathname === "/captain/dashboard"
                ? "bg-secondary text-accent"
                : "text-accent hover:bg-dark-primary"
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/captain/rides"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              location.pathname === "/captain/rides"
                ? "bg-secondary text-accent"
                : "text-accent hover:bg-dark-primary"
            }`}
          >
            Ride History
          </Link>
          <Link
            to="/captain/profile"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              location.pathname === "/captain/profile"
                ? "bg-secondary text-accent"
                : "text-accent hover:bg-dark-primary"
            }`}
          >
            Profile
          </Link>
          <Link
            to="/captain/earnings"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              location.pathname === "/captain/earnings"
                ? "bg-secondary text-accent"
                : "text-accent hover:bg-dark-primary"
            }`}
          >
            Earnings
          </Link>
          {user && (
            <button
              onClick={handleLogout}
              className="text-accent block px-3 py-2 rounded-md text-base font-medium hover:bg-dark-primary w-full text-left"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default CaptainNavbar;
