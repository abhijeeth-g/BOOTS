/**
 * Enhanced Location Service
 * Provides high-precision location tracking with fallback mechanisms,
 * background tracking, and location prediction.
 */

// Default options for high accuracy tracking
const HIGH_ACCURACY_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 5000,
  timeout: 10000
};

// Default options for balanced tracking (less battery usage)
const BALANCED_ACCURACY_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 15000,
  timeout: 15000
};

// Default options for low power tracking
const LOW_POWER_OPTIONS = {
  enableHighAccuracy: false,
  maximumAge: 30000,
  timeout: 20000
};

// Minimum distance (in meters) to trigger location update
const MIN_DISTANCE_THRESHOLD = 10;

class LocationService {
  constructor() {
    this.watchId = null;
    this.lastPosition = null;
    this.listeners = [];
    this.errorListeners = [];
    this.isTracking = false;
    this.trackingMode = 'high'; // 'high', 'balanced', 'low'
    this.locationHistory = [];
    this.maxHistoryLength = 10;
    this.predictionEnabled = true;
  }

  /**
   * Calculate distance between two points in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = 
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get current position with high accuracy
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      // Try with high accuracy first
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.lastPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          };
          resolve(this.lastPosition);
        },
        (error) => {
          // If high accuracy fails, try with lower accuracy
          console.warn('High accuracy position failed, trying with lower accuracy', error);
          navigator.geolocation.getCurrentPosition(
            (position) => {
              this.lastPosition = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: position.timestamp
              };
              resolve(this.lastPosition);
            },
            (fallbackError) => {
              reject(fallbackError);
            },
            LOW_POWER_OPTIONS
          );
        },
        HIGH_ACCURACY_OPTIONS
      );
    });
  }

  /**
   * Start tracking location with specified accuracy mode
   */
  startTracking(mode = 'high') {
    if (this.isTracking) {
      this.stopTracking();
    }

    this.trackingMode = mode;
    this.isTracking = true;

    // Select options based on mode
    let options;
    switch (mode) {
      case 'high':
        options = HIGH_ACCURACY_OPTIONS;
        break;
      case 'balanced':
        options = BALANCED_ACCURACY_OPTIONS;
        break;
      case 'low':
        options = LOW_POWER_OPTIONS;
        break;
      default:
        options = HIGH_ACCURACY_OPTIONS;
    }

    if (!navigator.geolocation) {
      this.notifyError(new Error('Geolocation is not supported by this browser'));
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      options
    );

    return this.watchId;
  }

  /**
   * Stop tracking location
   */
  stopTracking() {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
    }
  }

  /**
   * Handle position update from geolocation API
   */
  handlePositionUpdate(position) {
    const newPosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
      source: 'gps'
    };

    // Check if position has changed significantly
    if (this.lastPosition) {
      const distance = this.calculateDistance(
        this.lastPosition.latitude, this.lastPosition.longitude,
        newPosition.latitude, newPosition.longitude
      );

      // Only update if moved more than threshold or first update
      if (distance < MIN_DISTANCE_THRESHOLD) {
        // Still notify listeners with the same position but updated timestamp
        newPosition.timestamp = Date.now();
        this.notifyListeners(newPosition);
        return;
      }
    }

    // Update last position
    this.lastPosition = newPosition;

    // Add to history for prediction
    this.addToHistory(newPosition);

    // Notify all listeners
    this.notifyListeners(newPosition);
  }

  /**
   * Handle position error
   */
  handlePositionError(error) {
    console.error('Location tracking error:', error);

    // If high accuracy fails, try with lower accuracy
    if (this.trackingMode === 'high' && error.code === error.TIMEOUT) {
      console.warn('Switching to balanced accuracy mode');
      this.stopTracking();
      this.startTracking('balanced');
      return;
    }

    // If balanced accuracy fails, try with low power mode
    if (this.trackingMode === 'balanced' && error.code === error.TIMEOUT) {
      console.warn('Switching to low power mode');
      this.stopTracking();
      this.startTracking('low');
      return;
    }

    // If we still have a last position, use predicted position
    if (this.lastPosition && this.predictionEnabled) {
      const predictedPosition = this.predictNextPosition();
      if (predictedPosition) {
        predictedPosition.source = 'predicted';
        this.notifyListeners(predictedPosition);
      }
    }

    // Notify error listeners
    this.notifyError(error);
  }

  /**
   * Add position to history
   */
  addToHistory(position) {
    this.locationHistory.push(position);
    
    // Keep history at maximum length
    if (this.locationHistory.length > this.maxHistoryLength) {
      this.locationHistory.shift();
    }
  }

  /**
   * Predict next position based on history
   */
  predictNextPosition() {
    if (this.locationHistory.length < 2) {
      return null;
    }

    // Get last two positions
    const lastPos = this.locationHistory[this.locationHistory.length - 1];
    const prevPos = this.locationHistory[this.locationHistory.length - 2];

    // Calculate time difference
    const timeDiff = (lastPos.timestamp - prevPos.timestamp) / 1000; // in seconds
    
    // If time difference is too large, don't predict
    if (timeDiff > 30) {
      return null;
    }

    // Calculate speed and heading if not available
    const speed = lastPos.speed || 
      this.calculateDistance(
        prevPos.latitude, prevPos.longitude,
        lastPos.latitude, lastPos.longitude
      ) / timeDiff; // meters per second

    // Calculate heading if not available
    const heading = lastPos.heading || 
      Math.atan2(
        lastPos.longitude - prevPos.longitude,
        lastPos.latitude - prevPos.latitude
      ) * (180 / Math.PI);

    // Predict next position (simple linear prediction)
    // Assuming constant speed and direction
    const timeElapsed = (Date.now() - lastPos.timestamp) / 1000; // seconds since last update
    const distance = speed * timeElapsed; // meters
    
    // Convert heading to radians
    const headingRad = (heading * Math.PI) / 180;
    
    // Calculate new position
    const R = 6371e3; // Earth radius in meters
    const lat1 = (lastPos.latitude * Math.PI) / 180;
    const lon1 = (lastPos.longitude * Math.PI) / 180;
    
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / R) +
      Math.cos(lat1) * Math.sin(distance / R) * Math.cos(headingRad)
    );
    
    const lon2 = lon1 + 
      Math.atan2(
        Math.sin(headingRad) * Math.sin(distance / R) * Math.cos(lat1),
        Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
      );
    
    return {
      latitude: (lat2 * 180) / Math.PI,
      longitude: (lon2 * 180) / Math.PI,
      accuracy: lastPos.accuracy * 1.5, // Increase accuracy radius for predicted position
      heading: heading,
      speed: speed,
      timestamp: Date.now(),
      predicted: true
    };
  }

  /**
   * Add a listener for position updates
   */
  addListener(callback) {
    if (typeof callback === 'function' && !this.listeners.includes(callback)) {
      this.listeners.push(callback);
    }
    return () => this.removeListener(callback);
  }

  /**
   * Remove a position update listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Add an error listener
   */
  addErrorListener(callback) {
    if (typeof callback === 'function' && !this.errorListeners.includes(callback)) {
      this.errorListeners.push(callback);
    }
    return () => this.removeErrorListener(callback);
  }

  /**
   * Remove an error listener
   */
  removeErrorListener(callback) {
    this.errorListeners = this.errorListeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all position listeners
   */
  notifyListeners(position) {
    this.listeners.forEach(listener => {
      try {
        listener(position);
      } catch (error) {
        console.error('Error in location listener:', error);
      }
    });
  }

  /**
   * Notify all error listeners
   */
  notifyError(error) {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in location error listener:', err);
      }
    });
  }

  /**
   * Enable or disable location prediction
   */
  setPredictionEnabled(enabled) {
    this.predictionEnabled = enabled;
  }

  /**
   * Set minimum distance threshold for updates
   */
  setMinDistanceThreshold(meters) {
    if (typeof meters === 'number' && meters > 0) {
      MIN_DISTANCE_THRESHOLD = meters;
    }
  }

  /**
   * Get tracking status
   */
  getStatus() {
    return {
      isTracking: this.isTracking,
      trackingMode: this.trackingMode,
      lastPosition: this.lastPosition,
      watchId: this.watchId,
      predictionEnabled: this.predictionEnabled
    };
  }
}

// Create singleton instance
const locationService = new LocationService();
export default locationService;
