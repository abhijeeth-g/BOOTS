import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import CaptainDashboardBackground from "../../components/CaptainDashboardBackground";
import CaptainCard from "../../components/CaptainCard";
import CaptainEarningsCalculator from "../../components/captain/CaptainEarningsCalculator";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const CaptainEarnings = () => {
  const { user } = useAuth();
  const [captainData, setCaptainData] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Refs for animations
  const headerRef = useRef(null);
  const statsRef = useRef(null);

  // Fetch captain data
  useEffect(() => {
    const fetchCaptainData = async () => {
      if (!user) return;

      try {
        const captainDoc = await getDoc(doc(db, "captains", user.uid));
        if (captainDoc.exists()) {
          setCaptainData(captainDoc.data());
        } else {
          setError("Captain profile not found");
        }
      } catch (err) {
        console.error("Error fetching captain data:", err);
        setError("Failed to load captain data");
      }
    };

    fetchCaptainData();
  }, [user]);

  // Fetch rides for the selected month
  useEffect(() => {
    const fetchRides = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Calculate start and end dates for the selected month
        const startDate = new Date(selectedYear, selectedMonth, 1);
        const endDate = new Date(selectedYear, selectedMonth + 1, 0);
        
        // Convert to Firestore timestamps
        const startTimestamp = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endTimestamp = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
        
        // Query completed rides for the selected month
        const ridesQuery = query(
          collection(db, "rides"),
          where("captainId", "==", user.uid),
          where("status", "==", "completed"),
          where("completedAt", ">=", startTimestamp),
          where("completedAt", "<=", endTimestamp),
          orderBy("completedAt", "desc")
        );
        
        const ridesSnapshot = await getDocs(ridesQuery);
        const ridesData = ridesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRides(ridesData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching rides:", err);
        setError("Failed to load rides data");
        setLoading(false);
      }
    };
    
    fetchRides();
  }, [user, selectedMonth, selectedYear]);

  // Calculate monthly earnings
  const calculateMonthlyEarnings = () => {
    if (!rides.length) return { gross: 0, commission: 0, net: 0 };
    
    const gross = rides.reduce((total, ride) => total + (ride.fare || 0), 0);
    const commission = gross * 0.1; // 10% commission
    const net = gross - commission;
    
    return { gross, commission, net };
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get month name
  const getMonthName = (month) => {
    const date = new Date();
    date.setMonth(month);
    return date.toLocaleString('en-US', { month: 'long' });
  };

  // Calculate payment date (last day of the month)
  const getPaymentDate = () => {
    // Payment is processed on the 1st of the next month
    const paymentDate = new Date(selectedYear, selectedMonth + 1, 1);
    return paymentDate.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    });
  };

  // Monthly earnings
  const monthlyEarnings = calculateMonthlyEarnings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative">
      {/* 3D Animated Background */}
      <CaptainDashboardBackground />

      {/* Header */}
      <div ref={headerRef} className="bg-black bg-opacity-80 backdrop-blur-xl p-4 shadow-lg border-b border-gray-800 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="mr-2 bg-secondary p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">
                Earnings & Payments
              </h1>
            </div>
          </div>

          {/* Month Selector */}
          <div className="flex items-center space-x-4 mb-4">
            <label className="text-gray-400">Select Month:</label>
            <div className="flex space-x-2">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{getMonthName(i)}</option>
                ))}
              </select>
              
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                {Array.from({ length: 3 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Monthly Earnings Summary */}
        <div className="lg:col-span-1">
          <CaptainCard
            title={`${getMonthName(selectedMonth)} ${selectedYear} Earnings`}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>}
            delay={0.2}
          >
            <CaptainEarningsCalculator 
              totalAmount={monthlyEarnings.gross}
              commissionPercentage={10}
              showDetails={true}
            />

            <div className="mt-4 bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-secondary mb-3">Payment Schedule</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Payment Date</p>
                  <p className="text-white font-medium">{getPaymentDate()}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Payment Method</p>
                  <p className="text-white font-medium">Bank Transfer</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Status</p>
                  <p className={`font-medium ${new Date() > new Date(selectedYear, selectedMonth + 1, 1) ? 'text-green-400' : 'text-yellow-400'}`}>
                    {new Date() > new Date(selectedYear, selectedMonth + 1, 1) ? 'Paid' : 'Pending'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 bg-gray-900 bg-opacity-50 p-3 rounded-lg">
                <p className="text-xs text-gray-400 text-center">
                  Payments are processed on the 1st day of the following month
                </p>
              </div>
            </div>
          </CaptainCard>
        </div>

        {/* Ride Details */}
        <div className="lg:col-span-2">
          <CaptainCard
            title="Ride Details"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>}
            delay={0.3}
          >
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
              </div>
            ) : rides.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700 mb-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-400">Total Rides</p>
                    <p className="text-white font-medium">{rides.length}</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-900 bg-opacity-50 rounded-lg overflow-hidden">
                    <thead className="bg-gray-800 bg-opacity-70">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">From → To</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fare</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Commission</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Your Earnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {rides.map((ride) => {
                        const fare = ride.fare || 0;
                        const commission = fare * 0.1;
                        const earnings = fare - commission;
                        
                        return (
                          <tr key={ride.id} className="hover:bg-gray-800 hover:bg-opacity-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                              {formatDate(ride.completedAt)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-400">From:</span>
                                <span className="truncate max-w-[200px]">{ride.pickupAddress}</span>
                                <span className="text-xs text-gray-400 mt-1">To:</span>
                                <span className="truncate max-w-[200px]">{ride.dropAddress}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                              ₹{fare.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-red-400">
                              -₹{commission.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-green-400 font-medium">
                              ₹{earnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No rides found for {getMonthName(selectedMonth)} {selectedYear}</p>
              </div>
            )}
          </CaptainCard>
        </div>
      </div>
    </div>
  );
};

export default CaptainEarnings;
