import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, ZoomControl, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "../styles/MapStyles.css"; // Import shared map styles
import "../styles/VehicleMarkers.css"; // Import vehicle marker styles
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
import VehicleMarkers, { createVehicleIcon, createColoredDotIcon, getVehicleColor, getIconSizeByZoom } from "../utils/VehicleMarkers";

// Fix Leaflet marker icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Enhanced Map center component
const MapCenter = ({
  position,
  zoom = null,
  animate = true,
  animationDuration = 1.0,
  minDistanceChange = 0.0001, // Minimum distance change to trigger recenter (about 10 meters)
  followMode = false // If true, will always recenter on position changes
}) => {
  const map = useMap();
  const positionRef = useRef(position);
  const followModeRef = useRef(followMode);

  // Update follow mode ref when prop changes
  useEffect(() => {
    followModeRef.current = followMode;
  }, [followMode]);

  // Calculate distance between two points
  const calculateDistance = useCallback((pos1, pos2) => {
    if (!pos1 || !pos2) return Infinity;
    return Math.sqrt(
      Math.pow(pos1[0] - pos2[0], 2) +
      Math.pow(pos1[1] - pos2[1], 2)
    );
  }, []);

  // Handle map centering
  useEffect(() => {
    // Skip if no position
    if (!position) return;

    // Calculate distance from current center
    const distance = calculateDistance(position, positionRef.current);

    // Only recenter if in follow mode or position has changed significantly
    if (followModeRef.current || !positionRef.current || distance > minDistanceChange) {
      // Update position reference
      positionRef.current = position;

      // Get current or specified zoom level
      const zoomLevel = zoom !== null ? zoom : map.getZoom();

      try {
        if (animate) {
          // Use flyTo for smoother animation
          map.flyTo(position, zoomLevel, {
            duration: animationDuration,
            easeLinearity: 0.5
          });
        } else {
          // Instant update
          map.setView(position, zoomLevel);
        }
      } catch (error) {
        console.error("Error recentering map:", error);
        // Fallback to setView if flyTo fails
        map.setView(position, zoomLevel);
      }
    }
  }, [position, map, zoom, animate, animationDuration, minDistanceChange, calculateDistance]);

  // Add map event listeners to detect user interaction
  useEffect(() => {
    // When user drags the map, disable follow mode
    const handleDragStart = () => {
      followModeRef.current = false;
    };

    // Add event listeners
    map.on('dragstart', handleDragStart);

    // Cleanup
    return () => {
      map.off('dragstart', handleDragStart);
    };
  }, [map]);

  return null;
};

// Enhanced Routing Machine component
const RoutingMachine = ({
  from,
  to,
  onDistanceCalculated,
  routeType = "default", // pickup, dropoff, default
  fitBounds = true,
  animateFit = true
}) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  const routeLineRef = useRef(null);
  const tooltipRef = useRef(null);

  // Get route color based on type
  const getRouteColors = useCallback(() => {
    switch(routeType) {
      case "pickup":
        return {
          primary: "#4F46E5", // Indigo
          secondary: "#818CF8"
        };
      case "dropoff":
        return {
          primary: "#10B981", // Emerald
          secondary: "#34D399"
        };
      default:
        return {
          primary: "#FF1493", // Pink
          secondary: "#FF69B4"
        };
    }
  }, [routeType]);

  useEffect(() => {
    if (!from || !to || !map) return;

    // Get route colors
    const { primary, secondary } = getRouteColors();

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

    // Clean up any existing routes
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (e) {
        console.error("Error removing routing control:", e);
      }
    }

    if (routeLineRef.current) {
      try {
        map.removeLayer(routeLineRef.current);
      } catch (e) {
        console.error("Error removing route line:", e);
      }
    }

    if (tooltipRef.current) {
      try {
        map.removeLayer(tooltipRef.current);
      } catch (e) {
        console.error("Error removing tooltip:", e);
      }
    }

    // Create a polyline for direct path (fallback)
    const mainLine = L.polyline([from, to], {
      color: primary,
      weight: 5,
      opacity: 0.8,
      dashArray: '10, 10',
      lineJoin: 'round',
      className: 'route-line'
    }).addTo(map);

    // Add glow effect
    const glowLine = L.polyline([from, to], {
      color: secondary,
      weight: 9,
      opacity: 0.3,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(map);

    // Store both lines for cleanup
    routeLineRef.current = L.layerGroup([glowLine, mainLine]).addTo(map);

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

    // Store tooltip for cleanup
    tooltipRef.current = tooltip;

    // Try to use Leaflet Routing Machine for actual road routing
    try {
      // Set a timeout for the routing request
      let routingTimeout = setTimeout(() => {
        console.log("Routing request timed out, using direct path instead");
        // We'll keep the direct path visible since the routing request timed out

        // If requested, fit bounds to show the route
        if (fitBounds) {
          if (animateFit) {
            map.flyToBounds([from, to], {
              padding: [50, 50],
              duration: 1.5
            });
          } else {
            map.fitBounds([from, to], {
              padding: [50, 50]
            });
          }
        }
      }, 5000); // 5 second timeout

      // Create a more sophisticated route simulation
      try {
        // Create a curved path between points with multiple segments
        const createAdvancedPath = (from, to) => {
          // Calculate direct distance
          const dx = to[1] - from[1];
          const dy = to[0] - from[0];
          const directDist = Math.sqrt(dx * dx + dy * dy);

          // Determine number of segments based on distance
          const numSegments = Math.max(3, Math.min(8, Math.ceil(directDist * 100)));

          // Create intermediate waypoints with slight randomness
          const waypoints = [];
          waypoints.push(from);

          // Add intermediate points
          for (let i = 1; i < numSegments; i++) {
            const ratio = i / numSegments;

            // Base point along the direct line
            const baseX = from[1] + dx * ratio;
            const baseY = from[0] + dy * ratio;

            // Add some randomness to simulate real roads
            // More randomness in the middle, less at the ends
            const randomFactor = Math.sin(ratio * Math.PI) * 0.005;
            const offsetX = (Math.random() - 0.5) * randomFactor * directDist;
            const offsetY = (Math.random() - 0.5) * randomFactor * directDist;

            waypoints.push([baseY + offsetY, baseX + offsetX]);
          }

          waypoints.push(to);

          // Now create a smooth path through these waypoints
          const smoothPath = [];

          // Add first point
          smoothPath.push(waypoints[0]);

          // For each segment between waypoints, create a curved path
          for (let i = 0; i < waypoints.length - 1; i++) {
            const start = waypoints[i];
            const end = waypoints[i + 1];

            // Skip the first point for all but the first segment (to avoid duplicates)
            const segmentPoints = createCurvedSegment(start, end, i === 0 ? 0 : 1);
            smoothPath.push(...segmentPoints);
          }

          return smoothPath;
        };

        // Create a curved segment between two points
        const createCurvedSegment = (from, to, startIndex = 0) => {
          // Calculate midpoint
          const midX = (from[1] + to[1]) / 2;
          const midY = (from[0] + to[0]) / 2;

          // Calculate perpendicular offset for curve
          const dx = to[1] - from[1];
          const dy = to[0] - from[0];
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Create offset point (perpendicular to line)
          // Random curve direction
          const curveDir = Math.random() > 0.5 ? 1 : -1;
          const curveIntensity = 0.1 + Math.random() * 0.1; // Random intensity

          const offsetX = -dy * dist * curveIntensity * curveDir;
          const offsetY = dx * dist * curveIntensity * curveDir;

          // Control point for the curve
          const ctrlX = midX + offsetX;
          const ctrlY = midY + offsetY;

          // Generate points along the curve
          const points = [];
          const steps = 10; // Fewer steps per segment

          for (let i = startIndex; i <= steps; i++) {
            const t = i / steps;

            // Quadratic Bezier curve formula
            const x = Math.pow(1-t, 2) * from[1] +
                     2 * (1-t) * t * ctrlX +
                     Math.pow(t, 2) * to[1];

            const y = Math.pow(1-t, 2) * from[0] +
                     2 * (1-t) * t * ctrlY +
                     Math.pow(t, 2) * to[0];

            points.push([y, x]);
          }

          return points;
        };

        // Generate an advanced path between the points
        const routePath = createAdvancedPath(from, to);

        // Create a polyline with the curved path
        const routeLine = L.polyline(routePath, {
          color: primary,
          weight: 7,
          opacity: 0.9,
          className: 'route-line',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        // Add glow effect
        const glowLine = L.polyline(routePath, {
          color: secondary,
          weight: 12,
          opacity: 0.3,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        // Add animated dots along the route
        const routeMarkers = [];

        // Add turn markers at some of the waypoints
        for (let i = 1; i < routePath.length - 1; i += Math.floor(routePath.length / 5)) {
          if (i % 2 === 0) { // Only add at some points
            const turnIcon = L.divIcon({
              className: 'turn-icon',
              html: `<div class="turn-marker"></div>`,
              iconSize: [10, 10]
            });

            const marker = L.marker(routePath[i], { icon: turnIcon }).addTo(map);
            routeMarkers.push(marker);
          }
        }

        // Store everything for cleanup
        routingControlRef.current = {
          _routes: [{ coordinates: routePath.map(p => ({ lat: p[0], lng: p[1] })) }],
          _line: L.layerGroup([glowLine, routeLine]),
          _plan: { _waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])] },
          _markers: routeMarkers,
          remove: function() {
            map.removeLayer(glowLine);
            map.removeLayer(routeLine);
            routeMarkers.forEach(marker => map.removeLayer(marker));
            if (this._cleanup) this._cleanup();
          }
        };

        // Add a tooltip showing the distance and time at the midpoint of the route
        const routeMidPoint = routePath[Math.floor(routePath.length / 2)];

        // Create a tooltip with the distance and time information
        const tooltip = L.tooltip({
          permanent: true,
          direction: 'center',
          className: 'route-tooltip'
        })
        .setLatLng(routeMidPoint)
        .setContent(`<div class="route-info"><strong>${estimatedRoadDistance.toFixed(1)} km</strong> · ${estimatedTime} mins</div>`)
        .addTo(map);

        // Store tooltip for cleanup
        tooltipRef.current = tooltip;

        // Call the distance callback with the estimated distance and time
        onDistanceCalculated(estimatedRoadDistance, estimatedTime);

        // If requested, fit bounds to show the route
        if (fitBounds && animateFit) {
          map.flyToBounds([from, to], {
            padding: [50, 50],
            duration: 1.5
          });
        }

        // Clear the timeout since we're handling it ourselves
        clearTimeout(routingTimeout);
      } catch (error) {
        console.error("Error creating route:", error);

        // Fallback to simple direct line if advanced path fails
        const routeLine = L.polyline([from, to], {
          color: primary,
          weight: 5,
          opacity: 0.8,
          dashArray: '10, 10',
          className: 'route-line'
        }).addTo(map);

        // Store for cleanup
        routingControlRef.current = {
          _line: routeLine,
          remove: function() {
            map.removeLayer(routeLine);
          }
        };

        // Add a simple tooltip
        const midPoint = [
          (from[0] + to[0]) / 2,
          (from[1] + to[1]) / 2
        ];

        const tooltip = L.tooltip({
          permanent: true,
          direction: 'center',
          className: 'route-tooltip'
        })
        .setLatLng(midPoint)
        .setContent(`<div class="route-info"><strong>${estimatedRoadDistance.toFixed(1)} km</strong> · ${estimatedTime} mins</div>`)
        .addTo(map);

        tooltipRef.current = tooltip;

        // Call the distance callback
        onDistanceCalculated(estimatedRoadDistance, estimatedTime);

        // Clear the timeout
        clearTimeout(routingTimeout);
      }

      return () => {
        // Clear the timeout if component unmounts
        clearTimeout(routingTimeout);

        // Clean up routing control
        if (routingControlRef.current) {
          if (routingControlRef.current._cleanup) {
            try {
              routingControlRef.current._cleanup();
            } catch (e) {
              console.error("Error cleaning up routing control:", e);
            }
          }

          try {
            map.removeControl(routingControlRef.current);
          } catch (e) {
            console.error("Error removing routing control:", e);
          }
        }

        // Clean up route lines
        if (routeLineRef.current) {
          try {
            map.removeLayer(routeLineRef.current);
          } catch (e) {
            console.error("Error removing route line:", e);
          }
        }

        // Clean up tooltip
        if (tooltipRef.current) {
          try {
            map.removeLayer(tooltipRef.current);
          } catch (e) {
            console.error("Error removing tooltip:", e);
          }
        }
      };
    } catch (error) {
      console.error("Error setting up routing:", error);
      // If routing fails completely, at least we have the direct path and tooltip

      // If requested, fit bounds to show the route
      if (fitBounds) {
        if (animateFit) {
          map.flyToBounds([from, to], {
            padding: [50, 50],
            duration: 1.5
          });
        } else {
          map.fitBounds([from, to], {
            padding: [50, 50]
          });
        }
      }

      return () => {
        // Clean up route lines
        if (routeLineRef.current) {
          try {
            map.removeLayer(routeLineRef.current);
          } catch (e) {
            console.error("Error removing route line:", e);
          }
        }

        // Clean up tooltip
        if (tooltipRef.current) {
          try {
            map.removeLayer(tooltipRef.current);
          } catch (e) {
            console.error("Error removing tooltip:", e);
          }
        }
      };
    }
  }, [from, to, map, onDistanceCalculated, fitBounds, animateFit, getRouteColors]);

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
  const [vehicleIcons, setVehicleIcons] = useState({});
  const mapRef = useRef(null);

  // Initialize vehicle icons
  useEffect(() => {
    try {
      // Create icons for different vehicle types using direct SVG data URLs
      const icons = {
        car: L.icon({
          iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNjZGRiI+PHBhdGggZD0iTTIxLDEwLjVsLTEuMzgtNS40M0EzLDMsMCwwLDAsMTYuNzEsM0g3LjI5QTMsMywwLDAsMCw0LjM4LDUuMDdMMyxMTAuNWEzLDMsMCwwLDAsMyAzLjVoMXYzYTEsMSwwLDAsMCwxLDFoMmExLDEsMCwwLDAsMS0xVjE0aDR2M2ExLDEsMCwwLDAsMS0xVjE0aDFhMywzLDAsMCwwLDMtMy41Wk02LjgzLDYuMjRhMSwxLDAsMCwxLC45My0uNzRoOC40OGExLDEsMCwwLDEsLjkzLjc0TDE4LDEwSDZaIi8+PC9zdmc+",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
          className: "vehicle-marker car-marker animated"
        }),
        bike: L.icon({
          iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGNDVBNiI+PHBhdGggZD0iTTE1LjUsOEExLjUsMS41LDAsMSwwLDE0LDYuNSwxLjUsMS41LDAsMCwwLDE1LjUsOFptLTguMjUsMEg5LjVsMS41LDQuNUw2LjUsMTdIMy43NUEuNzUuNzUsMCwwLDEsMywxNi4yNWEuNzUuNzUsMCwwLDEsLjc1LS43NUg1LjI1TDksMTEuMjUsNy4yNSw4Wm0xMC41LDEuNWgtMUwxNS41LDEzLjVsLTIuMjUtNEgxMkwxNSwxNGwtMi4yNSw0aDEuNWwyLjI1LTRMMTksMThoMS41YS43NS43NSwwLDAsMCwuNzUtLjc1LjcuNywwLDAsMC0uNzUtLjc1SDIwTDE3Ljc1LDkuNVoiLz48L3N2Zz4=",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
          className: "vehicle-marker bike-marker animated"
        }),
        auto: L.icon({
          iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGQTUwMCI+PHBhdGggZD0iTTIxLDEwLjVsLTEuMzgtNS40M0EzLDMsMCwwLDAsMTYuNzEsM0g3LjI5QTMsMywwLDAsMCw0LjM4LDUuMDdMMyxMMS41YTMsMywwLDAsMCwzLDMuNWgxdjNhMSwxLDAsMCwwLDEsMWgyYTEsMSwwLDAsMCwxLTFWMTVoNHYzYTEsMSwwLDAsMCwxLTFWMTVoMWEzLDMsMCwwLDAsMy0zLjVabS0xNC4xNy00LjI2YTEsMSwwLDAsMSwuOTMtLjc0aDguNDhhMSwxLDAsMCwxLC45My43NEwxOCwxMUg2WiIvPjwvc3ZnPg==",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
          className: "vehicle-marker auto-marker animated"
        }),
        user: L.icon({
          iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNjZGRiI+PHBhdGggZD0iTTEyLDJBMTAsMTAsMCwxLDAsMjIsMTIsMTAsMTAsMCwwLDAsMTIsMlptMCwxOGE4LDgsMCwxLDEsOC04QTgsOCwwLDAsMSwxMiwyMFptNC0xMWExLDEsMCwxLDEtMS0xQTEsMSwwLDAsMSwxNiw5Wk04LDlhMSwxLDAsMSwxLTEtMUExLDEsMCwwLDEsOCw5Wm04LDRIMTJhMSwxLDAsMCwxLTEtMUgxMWExLDEsMCwwLDEtMS0xSDhhMSwxLDAsMCwwLTEsMSw1LDUsMCwwLDAsMTAsMCwxLDEsMCwwLDAtMS0xWiIvPjwvc3ZnPg==",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20],
          className: "vehicle-marker user-marker animated"
        }),
        destination: L.icon({
          iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGMDAwMCI+PHBhdGggZD0iTTEyLDJBMTAsMTAsMCwxLDAsMjIsMTIsMTAsMTAsMCwwLDAsMTIsMlptMCwxOGE4LDgsMCwxLDEsOC04QTgsOCwwLDAsMSwxMiwyMFptMC0xMmE0LDQsMCwxLDAsNCw0QTQsNCwwLDAsMCwxMiw4Wm0wLDZhMiwyLDAsMSwxLDItMkEyLDIsMCwwLDEsMTIsMTRaIi8+PC9zdmc+",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20],
          className: "vehicle-marker destination-marker"
        })
      };

      // Add more vehicle types
      icons.sedan = icons.car;
      icons.suv = icons.car;
      icons.taxi = icons.car;
      icons.motorcycle = icons.bike;
      icons.scooter = icons.bike;
      icons.rickshaw = icons.auto;

      setVehicleIcons(icons);
      console.log("Vehicle icons initialized successfully");
    } catch (error) {
      console.error("Error initializing vehicle icons:", error);

      // Fallback to colored dots if icon creation fails
      const fallbackIcons = {
        car: createColoredDotIcon('#0066FF', 24),
        bike: createColoredDotIcon('#FF45A6', 24),
        auto: createColoredDotIcon('#FFA500', 24),
        user: createColoredDotIcon('#0066FF', 28),
        destination: createColoredDotIcon('#FF0000', 28)
      };

      // Add more vehicle types
      fallbackIcons.sedan = fallbackIcons.car;
      fallbackIcons.suv = fallbackIcons.car;
      fallbackIcons.taxi = fallbackIcons.car;
      fallbackIcons.motorcycle = fallbackIcons.bike;
      fallbackIcons.scooter = fallbackIcons.bike;
      fallbackIcons.rickshaw = fallbackIcons.auto;

      setVehicleIcons(fallbackIcons);
    }
  }, []);

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
              // Use appropriate vehicle icon based on captain's vehicle type
              const vehicleType = captain.vehicleType?.toLowerCase() || 'bike';

              // Use the pre-created vehicle icons
              if (vehicleIcons[vehicleType]) {
                icons[captain.id] = vehicleIcons[vehicleType];
              } else {
                // Fallback to one of the main types if specific type not found
                if (vehicleType.includes('car') || vehicleType.includes('sedan') || vehicleType.includes('suv')) {
                  icons[captain.id] = vehicleIcons.car;
                } else if (vehicleType.includes('bike') || vehicleType.includes('cycle') || vehicleType.includes('moto')) {
                  icons[captain.id] = vehicleIcons.bike;
                } else if (vehicleType.includes('auto') || vehicleType.includes('rick')) {
                  icons[captain.id] = vehicleIcons.auto;
                } else {
                  // Default to bike if no match
                  icons[captain.id] = vehicleIcons.bike;
                }
              }
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
        <AnimatedWrapper delay={0.2} className="md:col-span-1 bg-gradient-to-br from-gray-900 to-black p-5 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Book Your Ride
          </h2>

          <div className="bg-black bg-opacity-50 p-4 rounded-lg mb-4 border border-gray-700">
            <p className="text-white text-sm mb-2">How to book a ride:</p>
            <ol className="text-gray-300 text-sm list-decimal pl-5 space-y-1">
              <li>Enter your pickup location</li>
              <li>Enter your destination</li>
              <li>Select a captain from the list</li>
              <li>Choose your payment method</li>
              <li>Confirm your ride</li>
            </ol>
          </div>

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
                <div className="bg-black bg-opacity-10 p-4 rounded-lg text-center border border-gray-700 hover:border-secondary transition-all duration-300 transform hover:-translate-y-1">
                  <p className="text-xs text-gray-300 mb-1 uppercase tracking-wider">Distance</p>
                  <p className="text-xl font-semibold text-white">{distance} <span className="text-sm">km</span></p>
                </div>
                <div className="bg-black bg-opacity-10 p-4 rounded-lg text-center border border-gray-700 hover:border-secondary transition-all duration-300 transform hover:-translate-y-1">
                  <p className="text-xs text-gray-300 mb-1 uppercase tracking-wider">Fare</p>
                  <p className="text-xl text-white font-semibold text-secondary">₹{fare}</p>
                </div>
                <div className="bg-black bg-opacity-10 p-4 rounded-lg text-center border border-gray-700 hover:border-secondary transition-all duration-300 transform hover:-translate-y-1">
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
            <AnimatedWrapper delay={0.1} className="bg-red-900 bg-opacity-30 border border-red-500 text-white p-4 rounded-lg mt-4 flex items-start">
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
                    className={`flex items-center bg-black bg-opacity-5 p-3 rounded-lg cursor-pointer transition-all duration-300 hover:bg-opacity-10 ${selectedCaptainId === captain.id ? 'border-2 border-secondary shadow-lg' : 'border border-gray-700'}`}
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
                      <div className="bg-secondary text-green-500 text-base px-3 py-1 rounded-full shadow-md">
                        Selected
                      </div>
                    ) : (
                      <div className="bg-gray-700 text-gray-300 text-base px-3 py-1 rounded-full opacity-60">
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
        <div className="md:col-span-2 relative">
          {/* Map Instructions */}
          {pickup && !drop && (
            <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-80 text-white p-3 rounded-lg shadow-lg border border-secondary max-w-xs">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">Now select your <span className="text-secondary font-medium">destination</span> to see available routes and fare estimates</p>
              </div>
            </div>
          )}

          {!pickup && (
            <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-80 text-white p-3 rounded-lg shadow-lg border border-secondary max-w-xs">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">Start by selecting your <span className="text-secondary font-medium">pickup location</span> using the search box</p>
              </div>
            </div>
          )}
          {pickup ? (
            <div className="h-[70vh] rounded-xl overflow-hidden shadow-lg border border-gray-700 relative">
              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-80 p-3 rounded-lg shadow-lg border border-gray-700">
                <div className="text-xs text-white mb-2 font-medium">Map Legend:</div>
                <div className="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"/>
                    <path d="M12,6a3,3,0,1,0,3,3A3,3,0,0,0,12,6Zm0,4a1,1,0,1,1,1-1A1,1,0,0,1,12,10Z"/>
                    <path d="M12,12a5,5,0,0,0-5,5h10A5,5,0,0,0,12,12Z"/>
                  </svg>
                  <span className="text-xs text-white">Your Location</span>
                </div>
                <div className="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"/>
                    <path d="M12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z"/>
                  </svg>
                  <span className="text-xs text-white">Destination</span>
                </div>
                <div className="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5,8A1.5,1.5,0,1,0,14,6.5,1.5,1.5,0,0,0,15.5,8Zm-8.25,0H9.5l1.5,4.5L6.5,17H3.75A.75.75,0,0,1,3,16.25a.75.75,0,0,1,.75-.75H5.25L9,11.25,7.25,8Zm10.5,1.5h-1L15.5,13.5l-2.25-4H12L15,14l-2.25,4h1.5l2.25-4L19,18h1.5a.75.75,0,0,0,.75-.75.7.7,0,0,0-.75-.75H20L17.75,9.5Z"/>
                  </svg>
                  <span className="text-xs text-white">Bike Captains</span>
                </div>
                <div className="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21,10.5l-1.38-5.43A3,3,0,0,0,16.71,3H7.29A3,3,0,0,0,4.38,5.07L3,10.5a3,3,0,0,0,3,3.5h1v3a1,1,0,0,0,1,1h2a1,1,0,0,0,1-1V14h4v3a1,1,0,0,0,1-1V14h1a3,3,0,0,0,3-3.5ZM6.83,6.24a1,1,0,0,1,.93-.74h8.48a1,1,0,0,1,.93.74L18,10H6Z"/>
                  </svg>
                  <span className="text-xs text-white">Car Captains</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21,10.5l-1.38-5.43A3,3,0,0,0,16.71,3H7.29A3,3,0,0,0,4.38,5.07L3,11.5a3,3,0,0,0,3,3.5h1v3a1,1,0,0,0,1,1h2a1,1,0,0,0,1-1V15h4v3a1,1,0,0,0,1-1V15h1a3,3,0,0,0,3-3.5Zm-14.17-4.26a1,1,0,0,1,.93-.74h8.48a1,1,0,0,1,.93.74L18,11H6Z"/>
                  </svg>
                  <span className="text-xs text-white">Auto Captains</span>
                </div>
              </div>
              <MapContainer
                center={pickup}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                ref={mapRef}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ZoomControl position="bottomright" />

                {/* User's current location with circle */}
                {pickup && (
                  <>
                    <Marker
                      position={pickup}
                      icon={vehicleIcons.user || createColoredDotIcon('#FF1493', 16)}
                    >
                      <Popup className="vehicle-popup">
                        <div className="vehicle-popup-header">
                          <div className="vehicle-popup-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0066FF">
                              <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"/>
                              <path d="M12,6a3,3,0,1,0,3,3A3,3,0,0,0,12,6Zm0,4a1,1,0,1,1,1-1A1,1,0,0,1,12,10Z"/>
                              <path d="M12,12a5,5,0,0,0-5,5h10A5,5,0,0,0,12,12Z"/>
                            </svg>
                          </div>
                          <div className="vehicle-popup-title">Pickup Location</div>
                        </div>
                        <div className="vehicle-popup-content">
                          {pickupAddress || "Your Location"}
                        </div>
                      </Popup>
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
                  <Marker
                    position={drop}
                    icon={vehicleIcons.destination || createColoredDotIcon('#4CAF50', 16)}
                  >
                    <Popup className="vehicle-popup">
                      <div className="vehicle-popup-header">
                        <div className="vehicle-popup-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF0000">
                            <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"/>
                            <path d="M12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z"/>
                          </svg>
                        </div>
                        <div className="vehicle-popup-title">Destination</div>
                      </div>
                      <div className="vehicle-popup-content">
                        {dropAddress || "Drop Location"}
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Nearby captains */}
                {nearbyCaptains.map(captain => (
                  captain.currentLocation && (
                    <Marker
                      key={captain.id}
                      position={captain.currentLocation}
                      icon={captainIcons[captain.id]}
                      className={selectedCaptainId === captain.id ? 'active' : ''}
                    >
                      <Popup className="vehicle-popup">
                        <div className="vehicle-popup-header">
                          <div className="vehicle-popup-icon">
                            {captain.vehicleType?.toLowerCase() === 'car' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0066FF">
                                <path d="M21,10.5l-1.38-5.43A3,3,0,0,0,16.71,3H7.29A3,3,0,0,0,4.38,5.07L3,10.5a3,3,0,0,0,3,3.5h1v3a1,1,0,0,0,1,1h2a1,1,0,0,0,1-1V14h4v3a1,1,0,0,0,1-1V14h1a3,3,0,0,0,3-3.5ZM6.83,6.24a1,1,0,0,1,.93-.74h8.48a1,1,0,0,1,.93.74L18,10H6Z"/>
                              </svg>
                            ) : captain.vehicleType?.toLowerCase() === 'auto' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFA500">
                                <path d="M21,10.5l-1.38-5.43A3,3,0,0,0,16.71,3H7.29A3,3,0,0,0,4.38,5.07L3,11.5a3,3,0,0,0,3,3.5h1v3a1,1,0,0,0,1,1h2a1,1,0,0,0,1-1V15h4v3a1,1,0,0,0,1-1V15h1a3,3,0,0,0,3-3.5Zm-14.17-4.26a1,1,0,0,1,.93-.74h8.48a1,1,0,0,1,.93.74L18,11H6Z"/>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF45A6">
                                <path d="M15.5,8A1.5,1.5,0,1,0,14,6.5,1.5,1.5,0,0,0,15.5,8Zm-8.25,0H9.5l1.5,4.5L6.5,17H3.75A.75.75,0,0,1,3,16.25a.75.75,0,0,1,.75-.75H5.25L9,11.25,7.25,8Zm10.5,1.5h-1L15.5,13.5l-2.25-4H12L15,14l-2.25,4h1.5l2.25-4L19,18h1.5a.75.75,0,0,0,.75-.75.7.7,0,0,0-.75-.75H20L17.75,9.5Z"/>
                              </svg>
                            )}
                          </div>
                          <div className="vehicle-popup-title">{captain.name}</div>
                        </div>
                        <div className="vehicle-popup-content">
                          <div>{captain.vehicleModel} ({captain.vehicleNumber})</div>
                          <div className="mt-1">
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                              Rating: {captain.rating?.toFixed(1) || "New"} ★
                            </span>
                          </div>
                        </div>
                        <div className="vehicle-popup-footer">
                          {captain.isOnline ? 'Available Now' : 'Currently Busy'}
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
                    routeType="default"
                    fitBounds={true}
                    animateFit={true}
                  />
                )}

                {/* Keep map centered on pickup */}
                <MapCenter
                  position={pickup}
                  animate={true}
                  followMode={true}
                />
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

      <style>{`
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
