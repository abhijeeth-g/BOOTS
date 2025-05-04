import { useState, useEffect } from "react";

const CaptainEarningsCalculator = ({ 
  totalAmount = 0, 
  commissionPercentage = 10, 
  showDetails = true,
  className = ""
}) => {
  const [breakdown, setBreakdown] = useState({
    totalAmount: 0,
    commissionAmount: 0,
    captainEarnings: 0
  });

  useEffect(() => {
    // Calculate the breakdown
    const commissionAmount = (totalAmount * commissionPercentage) / 100;
    const captainEarnings = totalAmount - commissionAmount;

    setBreakdown({
      totalAmount,
      commissionAmount,
      captainEarnings
    });
  }, [totalAmount, commissionPercentage]);

  if (!showDetails) {
    // Just return the captain's earnings amount
    return (
      <span className={className}>
        ₹{breakdown.captainEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </span>
    );
  }

  return (
    <div className={`bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-secondary mb-3">Earnings Breakdown</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-gray-400">Total Ride Amount</p>
          <p className="text-white font-medium">
            ₹{breakdown.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-gray-400">Company Commission ({commissionPercentage}%)</p>
          <p className="text-red-400">
            - ₹{breakdown.commissionAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="border-t border-gray-700 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <p className="text-gray-300 font-medium">Your Earnings</p>
            <p className="text-green-400 font-bold">
              ₹{breakdown.captainEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 bg-gray-900 bg-opacity-50 p-3 rounded-lg">
        <p className="text-xs text-gray-400 text-center">
          Your earnings will be transferred to your account at the end of the month
        </p>
      </div>
    </div>
  );
};

export default CaptainEarningsCalculator;
