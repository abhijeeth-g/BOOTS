import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const location = useLocation();

  // Don't show the navbar on captain routes or landing page
  if (location.pathname.startsWith("/captain") || location.pathname === "/") {
    return null;
  }

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
              <Link to="/home" className="text-secondary text-2xl font-bold">
                RideShare
              </Link>
            </div>
            <div className="hidden sm:block sm:ml-6">
              <div className="flex space-x-4">
                <Link
                  to="/home"
                  className={`px-3 py-2 rounded-md text-lg font-medium ${location.pathname === "/home" ? "bg-secondary text-accent" : "text-accent hover:bg-dark-primary"}`}
                >
                  Home
                </Link>
                <Link
                  to="/ridehistory"
                  className={`px-3 py-2 rounded-md text-lg font-medium ${location.pathname === "/ridehistory" ? "bg-secondary text-accent" : "text-accent hover:bg-dark-primary"}`}
                >
                  Ride History
                </Link>
                {user ? (
                  <>
                    <button
                      onClick={handleLogout}
                      className="text-accent px-3 py-2 rounded-md text-lg font-medium hover:bg-dark-primary"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className={`px-3 py-2 rounded-md text-lg font-medium ${location.pathname === "/login" ? "bg-secondary text-accent" : "text-accent hover:bg-dark-primary"}`}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className={`px-3 py-2 rounded-md text-lg font-medium ${location.pathname === "/signup" ? "bg-secondary text-accent" : "text-accent hover:bg-dark-primary"}`}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-primary px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/home"
            className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === "/home" ? "bg-secondary text-accent" : "text-accent hover:bg-dark-primary"}`}
          >
            Home
          </Link>
          <Link
            to="/ridehistory"
            className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === "/ridehistory" ? "bg-secondary text-accent" : "text-accent hover:bg-dark-primary"}`}
          >
            Ride History
          </Link>
          {user ? (
            <>
              <button
                onClick={handleLogout}
                className="text-accent block px-3 py-2 rounded-md text-base font-medium hover:bg-dark-primary w-full text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === "/login" ? "bg-secondary text-accent" : "text-accent hover:bg-dark-primary"}`}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === "/signup" ? "bg-secondary text-accent" : "text-accent hover:bg-dark-primary"}`}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
