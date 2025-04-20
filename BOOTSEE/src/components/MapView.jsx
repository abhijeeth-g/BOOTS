import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import LocationSearch from "./LocationSearch";
import PaymentOptions from "./PaymentOptions";
import AnimatedWrapper from "./AnimatedWrapper";
import { calculateFare } from "../utils/calculateFare";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp, query, where, getDocs, getDoc, doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { gsap } from "gsap";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
// Use default icon URL if the local asset isn't available
const bikeIconUrl = "https://cdn-icons-png.flaticon.com/512/2972/2972185.png";

// Create a function to generate colored dot icons
const createColoredDotIcon = (color, size = 12) => {
  return L.divIcon({
    className: 'colored-dot-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// Custom icons
const createCustomIcon = (iconUrl, size = [32, 32]) => {
  return L.icon({
    iconUrl,
    iconSize: size,
    iconAnchor: [size[0]/2, size[1]],
    popupAnchor: [0, -size[1]]
  });
};

// Fix Leaflet marker icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Map center component
const MapCenter = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return null;
};

const RoutingMachine = ({ from, to, onDistanceCalculated }) => {
  const map = useMap();

  useEffect(() => {
    if (!from || !to || !map) return;

    // Calculate direct distance using Haversine formula
    const calculateDirectDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Calculate direct distance
    const directDistance = calculateDirectDistance(from[0], from[1], to[0], to[1]);

    // Add 20% to account for road routes being longer than direct distance
    const estimatedRoadDistance = directDistance * 1.2;

    // Calculate estimated time (3 min per km for urban areas)
    const estimatedTime = Math.ceil(estimatedRoadDistance * 3);

    // Call the distance callback immediately with the estimated distance and time
    onDistanceCalculated(estimatedRoadDistance, estimatedTime);

    // Create a polyline for direct path (fallback)
    const directPath = L.polyline([from, to], {
      color: '#FF1493',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10',
      lineJoin: 'round'
    }).addTo(map);

    // Add distance markers along the path
    const midPoint = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2
    ];

    // Add a tooltip showing the distance and time
    const tooltip = L.tooltip({
      permanent: true,
      direction: 'center',
      className: 'route-tooltip'
    })
    .setLatLng(midPoint)
    .setContent(`<div class="route-info"><strong>${estimatedRoadDistance.toFixed(1)} km</strong> · ${estimatedTime} mins</div>`)
    .addTo(map);

    // Try to use Leaflet Routing Machine for actual road routing
    try {
      // Set a timeout for the routing request
      let routingTimeout = setTimeout(() => {
        console.log("Routing request timed out, using direct path instead");
        // We'll keep the direct path visible since the routing request timed out
      }, 5000); // 5 second timeout

      const routingControl = L.Routing.control({
        waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
        routeWhileDragging: false,
        show: false,
        showAlternatives: false, // Focus on shortest route only
        router: L.Routing.osrmv1({
          serviceUrl: 'https://api.openrouteservice.org/v2/directions/driving-car',
          profile: 'driving-car', // Using OpenRouteService instead of OSRM
          suppressDemoServerWarning: true,
          geometryOnly: false,
          timeout: 5000 // 5 second timeout
        }),
        createMarker: function() { return null; }, // Don't create default markers
        addWaypoints: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [
            { color: '#FF1493', opacity: 0.9, weight: 7 }, // Thicker, more visible main route
            { color: '#FF69B4', opacity: 0.6, weight: 3 }
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0
        }
      }).addTo(map);

      routingControl.on("routesfound", function (e) {
        // Clear the timeout since we got a response
        clearTimeout(routingTimeout);

        console.log("Route found:", e.routes[0]);
        const distanceInKm = e.routes[0].summary.totalDistance / 1000;
        const timeInSeconds = e.routes[0].summary.totalTime;
        const timeInMinutes = Math.ceil(timeInSeconds / 60);

        console.log("Actual route distance:", distanceInKm, "km, time:", timeInMinutes, "mins");

        // Update the tooltip with actual route information
        map.removeLayer(tooltip);
        const routeMidPoint = e.routes[0].coordinates[Math.floor(e.routes[0].coordinates.length / 2)];

        // Create a new tooltip with updated information
        L.tooltip({
          permanent: true,
          direction: 'center',
          className: 'route-tooltip'
        })
        .setLatLng([routeMidPoint.lat, routeMidPoint.lng])
        .setContent(`<div class="route-info"><strong>${distanceInKm.toFixed(1)} km</strong> · ${timeInMinutes} mins</div>`)
        .addTo(map);

        // Call the callback with actual distance and time
        onDistanceCalculated(distanceInKm, timeInMinutes);

        // Remove the direct path once we have the actual route
        map.removeLayer(directPath);

        // Add custom markers for turns and instructions
        const route = e.routes[0];
        const turnMarkers = [];
        if (route.instructions && route.instructions.length > 0) {
          // Add markers for major turns (filter out some to avoid clutter)
          route.instructions.forEach((instruction, idx) => {
            // Only add markers for significant turns (not for straight segments)
            if (instruction.type !== "WaypointReached" &&
                instruction.type !== "Straight" &&
                idx % 3 === 0) { // Add only every 3rd instruction to avoid clutter

              const turnIcon = L.divIcon({
                className: 'turn-icon',
                html: `<div class="turn-marker"></div>`,
                iconSize: [10, 10]
              });

              const marker = L.marker([instruction.coordinate.lat, instruction.coordinate.lng], { icon: turnIcon })
                .addTo(map)
                .bindTooltip(instruction.text, { direction: 'top' });

              turnMarkers.push(marker);
            }
          });
        }

        // Update cleanup function to remove turn markers
        routingControl._cleanup = () => {
          turnMarkers.forEach(marker => map.removeLayer(marker));
        };
      });

      routingControl.on("routingerror", function (e) {
        // Clear the timeout since we got a response (even if it's an error)
        clearTimeout(routingTimeout);

        console.error("Routing error:", e.error);
        // Keep the direct path and tooltip visible if routing fails
        // Use the estimated distance and time we calculated earlier
        console.log("Using estimated distance instead:", estimatedRoadDistance, "km, time:", estimatedTime, "mins");
      });

      return () => {
        // Clear the timeout if component unmounts
        clearTimeout(routingTimeout);

        if (routingControl._cleanup) {
          routingControl._cleanup();
        }
        map.removeControl(routingControl);
        if (map.hasLayer(directPath)) {
          map.removeLayer(directPath);
        }
        if (map.hasLayer(tooltip)) {
          map.removeLayer(tooltip);
        }
      };
    } catch (error) {
      console.error("Error setting up routing:", error);
      // If routing fails completely, at least we have the direct path and tooltip
      return () => {
        if (map.hasLayer(directPath)) {
          map.removeLayer(directPath);
        }
        if (map.hasLayer(tooltip)) {
          map.removeLayer(tooltip);
        }
      };
    }
  }, [from, to, map, onDistanceCalculated]);

  // Add CSS for the route tooltip and markers
  useEffect(() => {
    // Add custom CSS for the route tooltip
    const style = document.createElement('style');
    style.textContent = `
      .route-tooltip {
        background: rgba(0, 0, 0, 0.7) !important;
        border: 1px solid #FF1493 !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
      }
      .route-tooltip .leaflet-tooltip-content {
        color: white !important;
        font-weight: 500 !important;
        padding: 4px 8px !important;
      }
      .route-info {
        white-space: nowrap;
        font-size: 12px;
      }
      .turn-marker {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #FF1493;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
      }
      .colored-dot-icon div {
        transition: transform 0.2s ease-in-out;
      }
      .colored-dot-icon:hover div {
        transform: scale(1.2);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

const MapView = () => {
  const { user } = useAuth();
  const [pickup, setPickup] = useState(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [drop, setDrop] = useState(null);
  const [dropAddress, setDropAddress] = useState("");
  const [fare, setFare] = useState(null);
  const [distance, setDistance] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [nearbyCaptains, setNearbyCaptains] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [captainIcons, setCaptainIcons] = useState({});
  const [selectedCaptainId, setSelectedCaptainId] = useState(null);
  const mapRef = useRef(null);

  // Get current location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const loc = [latitude, longitude];
        setPickup(loc);
      },
      (err) => {
        console.error("Error getting location:", err);
        setError("Could not get your location. Please allow location access or enter it manually.");
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // Fetch nearby captains
  useEffect(() => {
    if (!pickup) return;

    const fetchNearbyCaptains = async () => {
      try {
        const q = query(
          collection(db, "captains"),
          where("isOnline", "==", true)
        );

        // Real-time updates for captain locations
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const captains = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Filter captains that are within 10km of pickup location
          const nearbyCaptainsData = captains.filter(captain => {
            if (!captain.currentLocation) return false;

            // Calculate distance between captain and pickup
            const distance = calculateDistance(
              pickup[0], pickup[1],
              captain.currentLocation[0], captain.currentLocation[1]
            );

            return distance <= 10; // 10km radius
          });

          setNearbyCaptains(nearbyCaptainsData);

          // Create captain icons
          const icons = {};
          nearbyCaptainsData.forEach(captain => {
            if (captain.currentLocation) {
              // Use bike icon for captains
              icons[captain.id] = createCustomIcon(bikeIconUrl, [32, 32]);
            }
          });
          setCaptainIcons(icons);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching nearby captains:", error);
      }
    };

    fetchNearbyCaptains();
  }, [pickup]);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleDistance = (km, minutes) => {
    console.log("Distance calculated:", km, "km, time:", minutes, "mins");
    const calculatedFare = calculateFare(km).toFixed(2);
    setDistance(km.toFixed(2));
    setFare(calculatedFare);
    setEstimatedTime(minutes);
    console.log("Fare set to:", calculatedFare, "Time set to:", minutes, "mins");
  };

  const handlePickupSelect = (loc, address) => {
    setPickup(loc);
    setPickupAddress(address);
  };

  const handleDropSelect = (loc, address) => {
    setDrop(loc);
    setDropAddress(address);
  };

  const requestRide = async () => {
    if (!user) {
      setError("You must be logged in to request a ride");
      return;
    }

    if (!pickup || !drop) {
      setError("Please select both pickup and drop locations");
      return;
    }

    if (!fare || !distance) {
      setError("Unable to calculate fare. Please try again.");
      return;
    }

    if (showPaymentOptions && !selectedPaymentMethod) {
      setError("Please select a payment method");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Submitting ride request with:", {
        userId: user.uid,
        pickup,
        pickupAddress,
        drop,
        dropAddress,
        fare: parseFloat(fare),
        distance: parseFloat(distance),
        paymentMethod: selectedPaymentMethod || "cash" // Default to cash if payment method not selected
      });

      // Add user information to the ride request
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userName = userDoc.exists() ? userDoc.data().name || user.displayName || "User" : user.displayName || "User";

      // Use the calculated estimated time or calculate it if not available
      const tripTime = estimatedTime || Math.ceil(parseFloat(distance) * 3); // 3 minutes per km

      await addDoc(collection(db, "rides"), {
        userId: user.uid,
        userName: userName,
        pickup,
        pickupAddress,
        drop,
        dropAddress,
        fare: parseFloat(fare),
        distance: parseFloat(distance),
        estimatedTime: tripTime,
        status: "pending",
        paymentMethod: selectedPaymentMethod || "cash", // Default to cash if payment method not selected
        paymentStatus: "pending",
        createdAt: serverTimestamp(),
      });
      setSuccess("Ride request sent successfully! Waiting for a captain to accept.");
      // Don't reset the form to allow the user to see their request details
    } catch (err) {
      console.error("Error saving ride:", err);
      setError("Failed to send ride request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Panel - Location Inputs */}
        <AnimatedWrapper delay={0.2} className="md:col-span-1 bg-dark-primary p-4 rounded-xl shadow-md border border-gray-700">
          <h2 className="text-xl font-bold text-secondary mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Book Your Ride
          </h2>

          <LocationSearch
            label="Pickup Location"
            onSelect={handlePickupSelect}
            selected={pickup}
            placeholder="Enter pickup location"
          />

          <LocationSearch
            label="Drop Location"
            onSelect={handleDropSelect}
            selected={drop}
            placeholder="Enter destination"
          />

          {/* Distance and Fare Information */}
          {pickup && drop && fare && distance && (
            <AnimatedWrapper delay={0.4} className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-xl mt-4 border border-gray-700 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Trip Details
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center border border-gray-700 hover:border-secondary transition-all duration-300 transform hover:-translate-y-1">
                  <p className="text-xs text-gray-300 mb-1 uppercase tracking-wider">Distance</p>
                  <p className="text-xl font-semibold text-white">{distance} <span className="text-sm">km</span></p>
                </div>
                <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center border border-gray-700 hover:border-secondary transition-all duration-300 transform hover:-translate-y-1">
                  <p className="text-xs text-gray-300 mb-1 uppercase tracking-wider">Fare</p>
                  <p className="text-xl font-semibold text-secondary">₹{fare}</p>
                </div>
                <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center border border-gray-700 hover:border-secondary transition-all duration-300 transform hover:-translate-y-1">
                  <p className="text-xs text-gray-300 mb-1 uppercase tracking-wider">Time</p>
                  <p className="text-xl font-semibold text-white">{estimatedTime || Math.ceil(distance * 3)} <span className="text-sm">mins</span></p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center bg-black bg-opacity-30 p-2 rounded-lg">Fare includes base fare, distance, and time charges</p>

              <div className="mt-4">
                <button
                  onClick={() => {
                    setShowPaymentOptions(!showPaymentOptions);
                    // Add a little animation when toggling
                    if (!showPaymentOptions) {
                      gsap.from(".payment-options-container", {
                        y: 20,
                        opacity: 0,
                        duration: 0.5,
                        ease: "power3.out"
                      });
                    }
                  }}
                  className="w-full bg-secondary hover:bg-pink-700 text-white py-3 rounded-lg font-medium transition duration-200 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPaymentOptions ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                  {showPaymentOptions ? "Hide Payment Options" : "View Payment Options"}
                </button>
              </div>
            </AnimatedWrapper>
          )}

          {/* Payment Options */}
          {showPaymentOptions && pickup && drop && fare && distance && (
            <div className="payment-options-container">
              <PaymentOptions
                fare={parseFloat(fare)}
                onSelectPayment={(method) => setSelectedPaymentMethod(method)}
                captainId={selectedCaptainId || (nearbyCaptains.length > 0 ? nearbyCaptains[0].id : null)}
                rideId="preview"
              />
            </div>
          )}

          {/* Error and Success Messages */}
          {error && (
            <AnimatedWrapper delay={0.1} className="bg-red-900 bg-opacity-30 border border-red-500 text-red-300 p-4 rounded-lg mt-4 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </AnimatedWrapper>
          )}

          {success && (
            <AnimatedWrapper delay={0.1} className="bg-green-900 bg-opacity-30 border border-green-500 text-green-300 p-4 rounded-lg mt-4 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </AnimatedWrapper>
          )}

          {/* Confirm Ride Button */}
          {pickup && drop && fare && (
            <AnimatedWrapper delay={0.6} className="mt-4">
              <button
                onClick={requestRide}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-secondary to-pink-600 text-white py-4 px-4 rounded-xl hover:from-pink-600 hover:to-secondary transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:-translate-y-1 hover:shadow-xl"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Request...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Confirm Ride Request</span>
                    {selectedPaymentMethod && (
                      <span className="ml-2 bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-medium">
                        {selectedPaymentMethod === "upi" && "Pay with UPI"}
                        {selectedPaymentMethod === "card" && "Pay with Card"}
                        {selectedPaymentMethod === "cash" && "Pay with Cash"}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </AnimatedWrapper>
          )}

          {/* Nearby Captains Info */}
          {nearbyCaptains.length > 0 && (
            <AnimatedWrapper delay={0.8} className="mt-6 bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{nearbyCaptains.length} Captains Nearby</span>
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {nearbyCaptains.map((captain) => (
                  <div
                    key={captain.id}
                    className={`flex items-center bg-white bg-opacity-5 p-3 rounded-lg cursor-pointer transition-all duration-300 hover:bg-opacity-10 ${selectedCaptainId === captain.id ? 'border-2 border-secondary shadow-lg' : 'border border-gray-700'}`}
                    onClick={() => {
                      setSelectedCaptainId(captain.id);
                      // Add a little animation when selecting
                      gsap.fromTo(
                        `#captain-${captain.id}`,
                        { scale: 0.95 },
                        { scale: 1, duration: 0.3, ease: "back.out(1.7)" }
                      );
                    }}
                    id={`captain-${captain.id}`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-secondary to-pink-600 rounded-full flex items-center justify-center text-sm font-bold text-white mr-3 shadow-md">
                      {captain.name?.charAt(0) || "C"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{captain.name}</p>
                      <div className="flex items-center text-xs text-gray-300 mt-1">
                        <span className="flex items-center bg-black bg-opacity-30 px-2 py-0.5 rounded-full">
                          <span className="text-yellow-400 mr-1">★</span>
                          {captain.rating?.toFixed(1) || "New"}
                        </span>
                        <span className="mx-1">•</span>
                        <span className="bg-black bg-opacity-30 px-2 py-0.5 rounded-full">{captain.vehicleModel}</span>
                      </div>
                    </div>
                    {selectedCaptainId === captain.id ? (
                      <div className="bg-secondary text-white text-xs px-3 py-1 rounded-full shadow-md">
                        Selected
                      </div>
                    ) : (
                      <div className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full opacity-60">
                        Select
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center bg-black bg-opacity-30 p-2 rounded-lg">
                Select a captain to pay directly through their UPI ID
              </p>
            </AnimatedWrapper>
          )}
        </AnimatedWrapper>

        {/* Right Panel - Map */}
        <div className="md:col-span-2">
          {pickup ? (
            <div className="h-[70vh] rounded-xl overflow-hidden shadow-lg">
              <MapContainer
                center={pickup}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                ref={mapRef}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* User's current location with circle */}
                {pickup && (
                  <>
                    <Marker position={pickup} icon={createColoredDotIcon('#FF1493', 16)}>
                      <Popup>Pickup: {pickupAddress || "Your Location"}</Popup>
                    </Marker>
                    <Circle
                      center={pickup}
                      radius={300}
                      pathOptions={{ color: "#FF1493", fillColor: "#FF1493", fillOpacity: 0.1 }}
                    />
                  </>
                )}

                {/* Destination marker */}
                {drop && (
                  <Marker position={drop} icon={createColoredDotIcon('#4CAF50', 16)}>
                    <Popup>Destination: {dropAddress || "Drop Location"}</Popup>
                  </Marker>
                )}

                {/* Nearby captains */}
                {nearbyCaptains.map(captain => (
                  captain.currentLocation && (
                    <Marker
                      key={captain.id}
                      position={captain.currentLocation}
                      icon={captainIcons[captain.id]}
                    >
                      <Popup>
                        <div>
                          <strong>{captain.name}</strong><br />
                          <span>{captain.vehicleModel} ({captain.vehicleNumber})</span><br />
                          <span>Rating: {captain.rating?.toFixed(1) || "New"} ★</span>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}

                {/* Route between pickup and drop */}
                {pickup && drop && (
                  <RoutingMachine
                    from={pickup}
                    to={drop}
                    onDistanceCalculated={handleDistance}
                  />
                )}

                {/* Keep map centered on pickup */}
                <MapCenter position={pickup} />
              </MapContainer>
            </div>
          ) : (
            <div className="h-[70vh] rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-gray-700 shadow-lg">
              <div className="text-center p-6">
                <svg className="animate-spin h-12 w-12 text-secondary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-300 text-lg font-medium">Loading map...</p>
                <p className="text-sm text-gray-400 mt-2">Please allow location access when prompted</p>
                <div className="mt-4 bg-black bg-opacity-30 p-3 rounded-lg max-w-md mx-auto">
                  <p className="text-xs text-gray-400">If the map doesn't load, please check your internet connection and try refreshing the page.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FF1493;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #FF69B4;
        }
      `}</style>
    </div>
  );
};

export default MapView;
