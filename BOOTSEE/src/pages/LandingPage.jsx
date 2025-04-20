import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary text-accent flex flex-col">
      {/* Header */}
      <header className="py-6 bg-dark-primary">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-secondary">RideShare</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Choose Your Experience</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Whether you're looking for a ride or want to earn money as a captain,
              we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Passenger Card */}
            <div className="bg-dark-primary rounded-xl shadow-lg overflow-hidden border border-gray-800 hover:border-secondary transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-48 bg-gradient-to-r from-secondary to-pink-700 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-24 w-24 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2 text-secondary">Passenger App</h3>
                <p className="text-gray-400 mb-6">
                  Need a ride? Book a trip with our trusted captains and get to your
                  destination safely and comfortably.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-secondary text-white py-3 rounded-lg font-medium hover:bg-pink-700 transition duration-200"
                >
                  Continue as Passenger
                </button>
              </div>
            </div>

            {/* Captain Card */}
            <div className="bg-dark-primary rounded-xl shadow-lg overflow-hidden border border-gray-800 hover:border-secondary transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-48 bg-gradient-to-r from-pink-700 to-secondary flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-24 w-24 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2 text-secondary">Captain App</h3>
                <p className="text-gray-400 mb-6">
                  Want to earn money on your own schedule? Join our team of captains
                  and start earning today.
                </p>
                <button
                  onClick={() => navigate("/captain/login")}
                  className="w-full bg-secondary text-white py-3 rounded-lg font-medium hover:bg-pink-700 transition duration-200"
                >
                  Continue as Captain
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-dark-primary">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} RideShare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
