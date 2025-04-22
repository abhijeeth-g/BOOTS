import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import './RideStatistics.css';

// RideStatistics component for visualizing ride data
const RideStatistics = ({
  captainData,
  className = '',
  delay = 0
}) => {
  const containerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('earnings');

  // Generate realistic data based on captain data
  const generateStatistics = () => {
    // Default empty data
    const defaultData = {
      earnings: {
        daily: [0, 0, 0, 0, 0, 0, 0],
        weekly: [0, 0, 0, 0, 0, 0, 0],
        monthly: [0, 0, 0, 0, 0, 0, 0]
      },
      rides: {
        daily: [0, 0, 0, 0, 0, 0, 0],
        weekly: [0, 0, 0, 0, 0, 0, 0],
        monthly: [0, 0, 0, 0, 0, 0, 0]
      },
      ratings: {
        distribution: [0, 0, 0, 0, 0], // 1-star to 5-star percentages
        recent: [] // Last 10 ratings
      }
    };

    // If no captain data, return default
    if (!captainData) return defaultData;

    // Use captain data to generate realistic statistics
    const totalRides = captainData.totalRides || 0;
    const rating = captainData.rating || 4.5;
    const todayEarnings = captainData.todayEarnings || 0;

    // Generate earnings data
    const dailyEarnings = [];
    for (let i = 0; i < 7; i++) {
      // Today's earnings is real, others are generated
      if (i === 6) {
        dailyEarnings.push(todayEarnings);
      } else {
        // Random earnings between 80% and 120% of today's earnings
        const randomFactor = 0.8 + Math.random() * 0.4;
        dailyEarnings.push(Math.round(todayEarnings * randomFactor));
      }
    }

    // Generate rides data based on earnings
    const dailyRides = dailyEarnings.map(earning => Math.max(1, Math.round(earning / 100)));

    // Generate rating distribution based on overall rating
    const ratingDistribution = [0, 0, 0, 0, 0];
    if (rating >= 4.5) {
      // Mostly 5 stars
      ratingDistribution[4] = 80;
      ratingDistribution[3] = 15;
      ratingDistribution[2] = 3;
      ratingDistribution[1] = 2;
      ratingDistribution[0] = 0;
    } else if (rating >= 4.0) {
      // Mostly 4 and 5 stars
      ratingDistribution[4] = 65;
      ratingDistribution[3] = 25;
      ratingDistribution[2] = 7;
      ratingDistribution[1] = 3;
      ratingDistribution[0] = 0;
    } else if (rating >= 3.5) {
      // Mixed ratings
      ratingDistribution[4] = 50;
      ratingDistribution[3] = 30;
      ratingDistribution[2] = 15;
      ratingDistribution[1] = 4;
      ratingDistribution[0] = 1;
    } else {
      // Lower ratings
      ratingDistribution[4] = 30;
      ratingDistribution[3] = 35;
      ratingDistribution[2] = 20;
      ratingDistribution[1] = 10;
      ratingDistribution[0] = 5;
    }

    // Generate recent ratings
    const recentRatings = [];
    for (let i = 0; i < 10; i++) {
      // Generate a rating close to the overall rating
      const randomOffset = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const generatedRating = Math.min(5, Math.max(1, Math.round(rating) + randomOffset));
      recentRatings.push(generatedRating);
    }

    // Generate weekly earnings based on daily pattern
    const weeklyEarnings = [];
    const weeklyRides = [];

    // Use the captain's total rides and earnings to generate realistic weekly data
    const weeklyAvgEarnings = (captainData.totalEarnings || 1000) / 10; // Assume 10 weeks of history
    const weeklyAvgRides = (captainData.totalRides || 40) / 10; // Assume 10 weeks of history

    // Generate 7 weeks of data with realistic variations
    for (let i = 0; i < 7; i++) {
      const randomFactor = 0.8 + Math.random() * 0.4; // 80% to 120% variation
      const weekEarning = Math.round(weeklyAvgEarnings * randomFactor);
      weeklyEarnings.push(weekEarning);

      const weekRides = Math.round(weeklyAvgRides * randomFactor);
      weeklyRides.push(weekRides);
    }

    // Generate monthly data based on weekly pattern
    const monthlyEarnings = [];
    const monthlyRides = [];

    // Use the captain's total rides and earnings to generate realistic monthly data
    const monthlyAvgEarnings = (captainData.totalEarnings || 4000) / 6; // Assume 6 months of history
    const monthlyAvgRides = (captainData.totalRides || 160) / 6; // Assume 6 months of history

    // Generate 7 months of data with realistic variations
    for (let i = 0; i < 7; i++) {
      const randomFactor = 0.85 + Math.random() * 0.3; // 85% to 115% variation
      const monthEarning = Math.round(monthlyAvgEarnings * randomFactor);
      monthlyEarnings.push(monthEarning);

      const monthRides = Math.round(monthlyAvgRides * randomFactor);
      monthlyRides.push(monthRides);
    }

    return {
      earnings: {
        daily: dailyEarnings,
        weekly: weeklyEarnings,
        monthly: monthlyEarnings
      },
      rides: {
        daily: dailyRides,
        weekly: weeklyRides,
        monthly: monthlyRides
      },
      ratings: {
        distribution: ratingDistribution,
        recent: recentRatings
      }
    };
  };

  // Generate statistics based on captain data
  const statsData = generateStatistics();

  // Animation on mount
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: delay,
          ease: 'power2.out'
        }
      );
    }
  }, [delay]);

  // Animate chart elements when tab changes
  useEffect(() => {
    if (!containerRef.current) return;

    const chartElements = containerRef.current.querySelectorAll('.chart-bar, .rating-star, .stat-value');

    gsap.fromTo(
      chartElements,
      { opacity: 0, y: 10, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: 'back.out(1.2)'
      }
    );
  }, [activeTab]);

  // Get day names for the last 7 days
  const getDayNames = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const index = (today - i + 7) % 7;
      result.push(days[index]);
    }

    return result.reverse();
  };

  // Render earnings chart
  const renderEarningsChart = () => {
    const dayNames = getDayNames();
    const data = statsData.earnings.daily;
    const maxValue = Math.max(...data) || 1; // Prevent division by zero

    return (
      <div className="chart-container">
        <div className="chart-title">Daily Earnings (Last 7 Days)</div>
        <div className="bar-chart">
          {data.map((value, index) => (
            <div key={index} className="chart-column">
              <div className="chart-bar-container">
                <div
                  className="chart-bar"
                  style={{ height: `${(value / maxValue) * 100}%` }}
                >
                  <div className="chart-value">₹{value}</div>
                </div>
              </div>
              <div className="chart-label">{dayNames[index]}</div>
            </div>
          ))}
        </div>
        <div className="chart-summary">
          <div className="summary-item">
            <div className="summary-label">Today</div>
            <div className="summary-value">₹{data[data.length - 1]}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Week</div>
            <div className="summary-value">₹{data.reduce((a, b) => a + b, 0)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Avg/Day</div>
            <div className="summary-value">₹{Math.round(data.reduce((a, b) => a + b, 0) / data.length)}</div>
          </div>
        </div>
      </div>
    );
  };

  // Render rides chart
  const renderRidesChart = () => {
    const dayNames = getDayNames();
    const data = statsData.rides.daily;
    const maxValue = Math.max(...data) || 1; // Prevent division by zero

    return (
      <div className="chart-container">
        <div className="chart-title">Daily Rides (Last 7 Days)</div>
        <div className="bar-chart">
          {data.map((value, index) => (
            <div key={index} className="chart-column">
              <div className="chart-bar-container">
                <div
                  className="chart-bar rides-bar"
                  style={{ height: `${(value / maxValue) * 100}%` }}
                >
                  <div className="chart-value">{value}</div>
                </div>
              </div>
              <div className="chart-label">{dayNames[index]}</div>
            </div>
          ))}
        </div>
        <div className="chart-summary">
          <div className="summary-item">
            <div className="summary-label">Today</div>
            <div className="summary-value">{data[data.length - 1]} rides</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Week</div>
            <div className="summary-value">{data.reduce((a, b) => a + b, 0)} rides</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Avg/Day</div>
            <div className="summary-value">{Math.round(data.reduce((a, b) => a + b, 0) / data.length)} rides</div>
          </div>
        </div>
      </div>
    );
  };

  // Render ratings chart
  const renderRatingsChart = () => {
    const { distribution, recent } = statsData.ratings;
    const averageRating = distribution.reduce((acc, val) => acc + val, 0) === 0 ? 0 : (
      distribution.reduce((acc, val, idx) => acc + val * (idx + 1), 0) /
      distribution.reduce((acc, val) => acc + val, 0)
    ).toFixed(1);

    return (
      <div className="chart-container">
        <div className="chart-title">Rating Distribution</div>
        <div className="rating-summary">
          <div className="average-rating">{averageRating}</div>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                className={`rating-star ${star <= Math.round(averageRating) ? 'active' : ''}`}
              >
                ★
              </span>
            ))}
          </div>
          <div className="rating-count">Based on {distribution.reduce((acc, val) => acc + val, 0)} ratings</div>
        </div>

        <div className="rating-distribution">
          {distribution.map((count, idx) => (
            <div key={idx} className="rating-row">
              <div className="rating-label">{idx + 1} ★</div>
              <div className="rating-bar-container">
                <div
                  className="rating-bar"
                  style={{ width: `${count}%` }}
                ></div>
              </div>
              <div className="rating-percentage">{count}%</div>
            </div>
          ))}
        </div>

        <div className="recent-ratings">
          <div className="recent-title">Recent Ratings</div>
          <div className="recent-stars">
            {recent.map((rating, idx) => (
              <div key={idx} className="recent-rating">
                <div className={`recent-star rating-${rating}`}>
                  {rating} ★
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`ride-statistics ${className}`}>
      <div className="stats-tabs">
        <button
          className={`tab-button ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          Earnings
        </button>
        <button
          className={`tab-button ${activeTab === 'rides' ? 'active' : ''}`}
          onClick={() => setActiveTab('rides')}
        >
          Rides
        </button>
        <button
          className={`tab-button ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('ratings')}
        >
          Ratings
        </button>
      </div>

      <div className="stats-content">
        {activeTab === 'earnings' && renderEarningsChart()}
        {activeTab === 'rides' && renderRidesChart()}
        {activeTab === 'ratings' && renderRatingsChart()}
      </div>
    </div>
  );
};

export default RideStatistics;
