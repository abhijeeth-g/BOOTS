/**
 * Safety Service
 * Provides safety features including SOS, ride sharing,
 * trusted contacts, and automated safety alerts.
 */

import { db } from "../firebase/config";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import locationService from "./LocationService";
import mapService from "./MapService";

// Safety alert types
const ALERT_TYPES = {
  SOS: 'sos',
  SPEED: 'speed',
  ROUTE_DEVIATION: 'route_deviation',
  GEOFENCE: 'geofence',
  INACTIVITY: 'inactivity',
  BATTERY_LOW: 'battery_low'
};

class SafetyService {
  constructor() {
    this.user = null;
    this.activeRide = null;
    this.trustedContacts = [];
    this.activeAlerts = new Map();
    this.listeners = {
      alert: [],
      contact: [],
      share: []
    };
    this.rideShareLinks = new Map();
    this.sosActive = false;
    this.locationSubscription = null;
    this.rideSubscription = null;
    this.safetyCheckInterval = null;
    this.lastSafetyCheck = Date.now();
    this.safetyCheckFrequency = 30000; // 30 seconds
    this.speedThreshold = 80; // km/h
    this.routeDeviationThreshold = 500; // meters
    this.inactivityThreshold = 300000; // 5 minutes
    this.batteryThreshold = 15; // percent
  }

  /**
   * Initialize the safety service
   */
  init(user) {
    this.user = user;
    
    // Start location monitoring
    this.startLocationMonitoring();
    
    // Load trusted contacts
    this.loadTrustedContacts();
    
    // Start safety checks
    this.startSafetyChecks();
    
    return this;
  }

  /**
   * Start monitoring location for safety
   */
  startLocationMonitoring() {
    if (this.locationSubscription) {
      locationService.removeListener(this.locationSubscription);
    }
    
    this.locationSubscription = locationService.addListener(position => {
      // Check for speed alerts
      this.checkSpeedAlert(position);
      
      // Check for route deviation
      if (this.activeRide) {
        this.checkRouteDeviation(position);
      }
      
      // Update ride location if sharing
      if (this.activeRide && this.isRideShared(this.activeRide.id)) {
        this.updateSharedRideLocation(position);
      }
    });
  }

  /**
   * Start periodic safety checks
   */
  startSafetyChecks() {
    if (this.safetyCheckInterval) {
      clearInterval(this.safetyCheckInterval);
    }
    
    this.safetyCheckInterval = setInterval(() => {
      this.performSafetyChecks();
    }, this.safetyCheckFrequency);
  }

  /**
   * Perform all safety checks
   */
  performSafetyChecks() {
    this.lastSafetyCheck = Date.now();
    
    // Check battery level
    this.checkBatteryLevel();
    
    // Check for inactivity
    this.checkInactivity();
    
    // Check geofence status
    this.checkGeofenceStatus();
  }

  /**
   * Check for speed alerts
   */
  checkSpeedAlert(position) {
    if (!position || !position.speed) return;
    
    // Convert m/s to km/h
    const speedKmh = position.speed * 3.6;
    
    if (speedKmh > this.speedThreshold) {
      this.triggerAlert(ALERT_TYPES.SPEED, {
        speed: speedKmh,
        threshold: this.speedThreshold,
        position: [position.latitude, position.longitude],
        timestamp: position.timestamp
      });
    }
  }

  /**
   * Check for route deviation
   */
  checkRouteDeviation(position) {
    if (!this.activeRide || !this.activeRide.route || !position) return;
    
    const currentPosition = [position.latitude, position.longitude];
    const route = this.activeRide.route;
    
    // Find closest point on route
    let minDistance = Infinity;
    let closestPoint = null;
    
    for (const point of route.coordinates) {
      const distance = mapService.calculateDistance(
        currentPosition[0], currentPosition[1],
        point.lat, point.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    
    // Check if deviation exceeds threshold
    if (minDistance > this.routeDeviationThreshold) {
      this.triggerAlert(ALERT_TYPES.ROUTE_DEVIATION, {
        distance: minDistance,
        threshold: this.routeDeviationThreshold,
        position: currentPosition,
        expectedPosition: [closestPoint.lat, closestPoint.lng],
        timestamp: position.timestamp
      });
    }
  }

  /**
   * Check battery level
   */
  checkBatteryLevel() {
    if (!navigator.getBattery) return;
    
    navigator.getBattery().then(battery => {
      const level = battery.level * 100;
      
      if (level <= this.batteryThreshold && !battery.charging) {
        this.triggerAlert(ALERT_TYPES.BATTERY_LOW, {
          level,
          threshold: this.batteryThreshold,
          timestamp: Date.now()
        });
      }
    }).catch(error => {
      console.error('Error checking battery:', error);
    });
  }

  /**
   * Check for inactivity
   */
  checkInactivity() {
    if (!locationService.lastPosition) return;
    
    const lastUpdateTime = locationService.lastPosition.timestamp;
    const now = Date.now();
    const timeSinceUpdate = now - lastUpdateTime;
    
    if (timeSinceUpdate > this.inactivityThreshold) {
      this.triggerAlert(ALERT_TYPES.INACTIVITY, {
        timeSinceUpdate,
        threshold: this.inactivityThreshold,
        lastPosition: [
          locationService.lastPosition.latitude,
          locationService.lastPosition.longitude
        ],
        timestamp: now
      });
    }
  }

  /**
   * Check geofence status
   */
  checkGeofenceStatus() {
    if (!locationService.lastPosition) return;
    
    const position = [
      locationService.lastPosition.latitude,
      locationService.lastPosition.longitude
    ];
    
    const zoneResults = mapService.checkPosition(position);
    
    for (const result of zoneResults) {
      if (result.zone.type === 'danger' && result.isInside) {
        this.triggerAlert(ALERT_TYPES.GEOFENCE, {
          zone: result.zone,
          position,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Trigger a safety alert
   */
  triggerAlert(type, data) {
    // Check if this alert is already active
    const existingAlert = this.activeAlerts.get(type);
    if (existingAlert) {
      // Only trigger again if enough time has passed
      const timeSinceLastAlert = Date.now() - existingAlert.timestamp;
      if (timeSinceLastAlert < 60000) { // 1 minute cooldown
        return;
      }
    }
    
    // Create alert object
    const alert = {
      id: `${type}_${Date.now()}`,
      type,
      data,
      timestamp: Date.now(),
      acknowledged: false
    };
    
    // Store alert
    this.activeAlerts.set(type, alert);
    
    // Notify listeners
    this.notifyListeners('alert', alert);
    
    // Save alert to database if user is authenticated
    if (this.user) {
      this.saveAlertToDatabase(alert);
    }
    
    // Notify trusted contacts for serious alerts
    if (type === ALERT_TYPES.SOS || type === ALERT_TYPES.ROUTE_DEVIATION) {
      this.notifyTrustedContacts(alert);
    }
    
    return alert;
  }

  /**
   * Save alert to database
   */
  async saveAlertToDatabase(alert) {
    try {
      await addDoc(collection(db, "safetyAlerts"), {
        userId: this.user.uid,
        type: alert.type,
        data: alert.data,
        timestamp: serverTimestamp(),
        acknowledged: false,
        rideId: this.activeRide ? this.activeRide.id : null
      });
    } catch (error) {
      console.error('Error saving alert to database:', error);
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId) {
    // Find alert by ID
    let foundType = null;
    for (const [type, alert] of this.activeAlerts.entries()) {
      if (alert.id === alertId) {
        foundType = type;
        break;
      }
    }
    
    if (!foundType) return false;
    
    // Update alert
    const alert = this.activeAlerts.get(foundType);
    alert.acknowledged = true;
    
    // Notify listeners
    this.notifyListeners('alert', alert);
    
    // Update in database if user is authenticated
    if (this.user) {
      try {
        const alertsRef = collection(db, "safetyAlerts");
        const q = query(
          alertsRef,
          where("userId", "==", this.user.uid),
          where("type", "==", alert.type),
          where("acknowledged", "==", false)
        );
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (document) => {
          await updateDoc(doc(db, "safetyAlerts", document.id), {
            acknowledged: true
          });
        });
      } catch (error) {
        console.error('Error acknowledging alert in database:', error);
      }
    }
    
    return true;
  }

  /**
   * Trigger SOS emergency
   */
  async triggerSOS(details = {}) {
    if (this.sosActive) return null;
    
    this.sosActive = true;
    
    // Get current location
    const position = locationService.lastPosition || { latitude: 0, longitude: 0 };
    
    // Create SOS data
    const sosData = {
      position: [position.latitude, position.longitude],
      timestamp: Date.now(),
      user: this.user ? {
        id: this.user.uid,
        name: this.user.displayName || 'User'
      } : null,
      ride: this.activeRide ? {
        id: this.activeRide.id,
        captainId: this.activeRide.captainId,
        captainName: this.activeRide.captainName
      } : null,
      details
    };
    
    // Trigger alert
    const alert = this.triggerAlert(ALERT_TYPES.SOS, sosData);
    
    // Save to database with high priority
    if (this.user) {
      try {
        await addDoc(collection(db, "emergencies"), {
          userId: this.user.uid,
          userName: this.user.displayName || 'User',
          position: {
            latitude: position.latitude,
            longitude: position.longitude
          },
          timestamp: serverTimestamp(),
          resolved: false,
          rideId: this.activeRide ? this.activeRide.id : null,
          captainId: this.activeRide ? this.activeRide.captainId : null,
          details
        });
      } catch (error) {
        console.error('Error saving SOS to database:', error);
      }
    }
    
    // Notify all trusted contacts
    this.notifyAllTrustedContacts(sosData);
    
    return alert;
  }

  /**
   * Resolve SOS emergency
   */
  async resolveSOS() {
    if (!this.sosActive) return false;
    
    this.sosActive = false;
    
    // Acknowledge alert
    for (const [type, alert] of this.activeAlerts.entries()) {
      if (type === ALERT_TYPES.SOS) {
        this.acknowledgeAlert(alert.id);
        break;
      }
    }
    
    // Update database
    if (this.user) {
      try {
        const emergenciesRef = collection(db, "emergencies");
        const q = query(
          emergenciesRef,
          where("userId", "==", this.user.uid),
          where("resolved", "==", false)
        );
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (document) => {
          await updateDoc(doc(db, "emergencies", document.id), {
            resolved: true,
            resolvedAt: serverTimestamp()
          });
        });
      } catch (error) {
        console.error('Error resolving SOS in database:', error);
      }
    }
    
    // Notify trusted contacts
    this.notifyTrustedContactsSOSResolved();
    
    return true;
  }

  /**
   * Load trusted contacts from database
   */
  async loadTrustedContacts() {
    if (!this.user) return [];
    
    try {
      const contactsRef = collection(db, "trustedContacts");
      const q = query(contactsRef, where("userId", "==", this.user.uid));
      
      const querySnapshot = await getDocs(q);
      const contacts = [];
      
      querySnapshot.forEach((doc) => {
        contacts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      this.trustedContacts = contacts;
      
      // Notify listeners
      this.notifyListeners('contact', { contacts: this.trustedContacts });
      
      return contacts;
    } catch (error) {
      console.error('Error loading trusted contacts:', error);
      return [];
    }
  }

  /**
   * Add a trusted contact
   */
  async addTrustedContact(contact) {
    if (!this.user) return null;
    
    try {
      const result = await addDoc(collection(db, "trustedContacts"), {
        userId: this.user.uid,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        relationship: contact.relationship,
        notifyOnRideStart: contact.notifyOnRideStart || false,
        notifyOnRideEnd: contact.notifyOnRideEnd || false,
        notifyOnEmergency: contact.notifyOnEmergency !== false, // Default to true
        createdAt: serverTimestamp()
      });
      
      const newContact = {
        id: result.id,
        userId: this.user.uid,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        relationship: contact.relationship,
        notifyOnRideStart: contact.notifyOnRideStart || false,
        notifyOnRideEnd: contact.notifyOnRideEnd || false,
        notifyOnEmergency: contact.notifyOnEmergency !== false
      };
      
      this.trustedContacts.push(newContact);
      
      // Notify listeners
      this.notifyListeners('contact', { contacts: this.trustedContacts });
      
      return newContact;
    } catch (error) {
      console.error('Error adding trusted contact:', error);
      return null;
    }
  }

  /**
   * Remove a trusted contact
   */
  async removeTrustedContact(contactId) {
    if (!this.user) return false;
    
    try {
      await updateDoc(doc(db, "trustedContacts", contactId), {
        deleted: true,
        deletedAt: serverTimestamp()
      });
      
      // Remove from local array
      this.trustedContacts = this.trustedContacts.filter(c => c.id !== contactId);
      
      // Notify listeners
      this.notifyListeners('contact', { contacts: this.trustedContacts });
      
      return true;
    } catch (error) {
      console.error('Error removing trusted contact:', error);
      return false;
    }
  }

  /**
   * Notify trusted contacts about an alert
   */
  async notifyTrustedContacts(alert) {
    if (!this.user || this.trustedContacts.length === 0) return;
    
    // Filter contacts that should be notified for emergencies
    const contactsToNotify = this.trustedContacts.filter(c => c.notifyOnEmergency);
    
    if (contactsToNotify.length === 0) return;
    
    try {
      // Create notification in database
      await addDoc(collection(db, "contactNotifications"), {
        userId: this.user.uid,
        userName: this.user.displayName || 'User',
        alertType: alert.type,
        alertData: alert.data,
        contacts: contactsToNotify.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email
        })),
        timestamp: serverTimestamp(),
        processed: false
      });
      
      // In a real app, this would trigger a cloud function to send SMS/email
      console.log('Notifying trusted contacts about alert:', alert.type);
    } catch (error) {
      console.error('Error notifying trusted contacts:', error);
    }
  }

  /**
   * Notify all trusted contacts about SOS
   */
  async notifyAllTrustedContacts(sosData) {
    if (!this.user || this.trustedContacts.length === 0) return;
    
    try {
      // Create notification in database
      await addDoc(collection(db, "contactNotifications"), {
        userId: this.user.uid,
        userName: this.user.displayName || 'User',
        alertType: ALERT_TYPES.SOS,
        alertData: sosData,
        contacts: this.trustedContacts.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email
        })),
        timestamp: serverTimestamp(),
        processed: false,
        highPriority: true
      });
      
      // In a real app, this would trigger a cloud function to send SMS/email
      console.log('Notifying ALL trusted contacts about SOS emergency');
    } catch (error) {
      console.error('Error notifying all trusted contacts:', error);
    }
  }

  /**
   * Notify trusted contacts that SOS is resolved
   */
  async notifyTrustedContactsSOSResolved() {
    if (!this.user || this.trustedContacts.length === 0) return;
    
    try {
      // Create notification in database
      await addDoc(collection(db, "contactNotifications"), {
        userId: this.user.uid,
        userName: this.user.displayName || 'User',
        alertType: 'sos_resolved',
        timestamp: serverTimestamp(),
        contacts: this.trustedContacts.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email
        })),
        processed: false
      });
      
      // In a real app, this would trigger a cloud function to send SMS/email
      console.log('Notifying trusted contacts that SOS is resolved');
    } catch (error) {
      console.error('Error notifying trusted contacts about SOS resolution:', error);
    }
  }

  /**
   * Set active ride for monitoring
   */
  setActiveRide(ride) {
    this.activeRide = ride;
    
    // Start monitoring ride
    if (ride) {
      this.startRideMonitoring(ride.id);
    } else if (this.rideSubscription) {
      // Stop monitoring previous ride
      this.rideSubscription();
      this.rideSubscription = null;
    }
    
    return this.activeRide;
  }

  /**
   * Start monitoring a ride
   */
  startRideMonitoring(rideId) {
    if (this.rideSubscription) {
      this.rideSubscription();
    }
    
    if (!this.user) return;
    
    // Listen for ride updates
    const rideRef = doc(db, "rides", rideId);
    this.rideSubscription = onSnapshot(rideRef, (snapshot) => {
      if (snapshot.exists()) {
        const rideData = {
          id: snapshot.id,
          ...snapshot.data()
        };
        
        this.activeRide = rideData;
      } else {
        this.activeRide = null;
        
        if (this.rideSubscription) {
          this.rideSubscription();
          this.rideSubscription = null;
        }
      }
    });
  }

  /**
   * Share ride with trusted contacts
   */
  async shareRideWithContacts(rideId, contactIds = []) {
    if (!this.user || !rideId) return null;
    
    // If no contacts specified, share with all trusted contacts
    const contactsToShare = contactIds.length > 0
      ? this.trustedContacts.filter(c => contactIds.includes(c.id))
      : this.trustedContacts;
    
    if (contactsToShare.length === 0) return null;
    
    try {
      // Get ride details
      const rideRef = doc(db, "rides", rideId);
      const rideSnapshot = await getDoc(rideRef);
      
      if (!rideSnapshot.exists()) {
        throw new Error('Ride not found');
      }
      
      const rideData = {
        id: rideSnapshot.id,
        ...rideSnapshot.data()
      };
      
      // Create share link
      const shareId = `share_${rideId}_${Date.now()}`;
      
      await addDoc(collection(db, "rideShares"), {
        shareId,
        rideId,
        userId: this.user.uid,
        userName: this.user.displayName || 'User',
        contacts: contactsToShare.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email
        })),
        createdAt: serverTimestamp(),
        active: true,
        rideData: {
          pickup: rideData.pickup,
          pickupAddress: rideData.pickupAddress,
          drop: rideData.drop,
          dropAddress: rideData.dropAddress,
          captainId: rideData.captainId,
          captainName: rideData.captainName,
          status: rideData.status
        }
      });
      
      // Store share link
      this.rideShareLinks.set(rideId, {
        shareId,
        contacts: contactsToShare,
        createdAt: Date.now()
      });
      
      // Notify listeners
      this.notifyListeners('share', {
        rideId,
        shareId,
        contacts: contactsToShare
      });
      
      // In a real app, this would trigger a cloud function to send SMS/email
      console.log('Sharing ride with contacts:', contactsToShare.map(c => c.name).join(', '));
      
      return {
        shareId,
        contacts: contactsToShare
      };
    } catch (error) {
      console.error('Error sharing ride with contacts:', error);
      return null;
    }
  }

  /**
   * Stop sharing ride
   */
  async stopSharingRide(rideId) {
    if (!this.user || !rideId) return false;
    
    const shareInfo = this.rideShareLinks.get(rideId);
    if (!shareInfo) return false;
    
    try {
      // Update share status in database
      const sharesRef = collection(db, "rideShares");
      const q = query(
        sharesRef,
        where("shareId", "==", shareInfo.shareId),
        where("active", "==", true)
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (document) => {
        await updateDoc(doc(db, "rideShares", document.id), {
          active: false,
          endedAt: serverTimestamp()
        });
      });
      
      // Remove from local map
      this.rideShareLinks.delete(rideId);
      
      // Notify listeners
      this.notifyListeners('share', {
        rideId,
        shareId: shareInfo.shareId,
        active: false
      });
      
      return true;
    } catch (error) {
      console.error('Error stopping ride share:', error);
      return false;
    }
  }

  /**
   * Check if ride is being shared
   */
  isRideShared(rideId) {
    return this.rideShareLinks.has(rideId);
  }

  /**
   * Update shared ride location
   */
  async updateSharedRideLocation(position) {
    if (!this.user || !this.activeRide) return;
    
    const rideId = this.activeRide.id;
    const shareInfo = this.rideShareLinks.get(rideId);
    
    if (!shareInfo) return;
    
    try {
      // Update location in database
      const sharesRef = collection(db, "rideShares");
      const q = query(
        sharesRef,
        where("shareId", "==", shareInfo.shareId),
        where("active", "==", true)
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (document) => {
        await updateDoc(doc(db, "rideShares", document.id), {
          currentLocation: {
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
            heading: position.heading,
            speed: position.speed,
            timestamp: position.timestamp
          },
          lastUpdated: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error updating shared ride location:', error);
    }
  }

  /**
   * Add a listener for events
   */
  addListener(type, callback) {
    if (!this.listeners[type]) return null;
    
    if (typeof callback === 'function' && !this.listeners[type].includes(callback)) {
      this.listeners[type].push(callback);
    }
    
    return () => this.removeListener(type, callback);
  }

  /**
   * Remove a listener
   */
  removeListener(type, callback) {
    if (!this.listeners[type]) return;
    
    this.listeners[type] = this.listeners[type].filter(listener => listener !== callback);
  }

  /**
   * Notify listeners of an event
   */
  notifyListeners(type, data) {
    if (!this.listeners[type]) return;
    
    this.listeners[type].forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in ${type} listener:`, error);
      }
    });
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Stop location monitoring
    if (this.locationSubscription) {
      locationService.removeListener(this.locationSubscription);
      this.locationSubscription = null;
    }
    
    // Stop ride monitoring
    if (this.rideSubscription) {
      this.rideSubscription();
      this.rideSubscription = null;
    }
    
    // Stop safety checks
    if (this.safetyCheckInterval) {
      clearInterval(this.safetyCheckInterval);
      this.safetyCheckInterval = null;
    }
    
    // Clear all data
    this.activeRide = null;
    this.trustedContacts = [];
    this.activeAlerts.clear();
    this.rideShareLinks.clear();
    this.sosActive = false;
    
    // Clear all listeners
    Object.keys(this.listeners).forEach(type => {
      this.listeners[type] = [];
    });
  }
}

// Create singleton instance
const safetyService = new SafetyService();
export default safetyService;
