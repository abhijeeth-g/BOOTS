import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Circle, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { gsap } from "gsap";

// Import marker icons directly
import bikeMarkerIcon from "../../assets/bike-marker.svg";
import userMarkerIcon from "../../assets/user-marker.svg";
import destinationMarkerIcon from "../../assets/destination-marker.svg";

// Import custom CSS for map styling
import "./CaptainMap.css";

// Try to import leaflet routing machine
// We'll use a fallback if it's not available
let LeafletRoutingMachine;

// Check if L.Routing exists after importing leaflet
try {
  // Dynamic import for leaflet-routing-machine
  import("leaflet-routing-machine").catch(e => console.error("Could not load leaflet-routing-machine:", e));

  // Use L.Routing if it exists
  LeafletRoutingMachine = L.Routing || null;
} catch (error) {
  console.error("Error accessing L.Routing:", error);
  LeafletRoutingMachine = null;
}

// Fallback implementation if the package fails to load
if (!LeafletRoutingMachine) {
  console.warn("Using fallback routing implementation");
  LeafletRoutingMachine = {
    control: function() {
      return {
        addTo: function() { return this; },
        getPlan: function() { return { setWaypoints: function() {} }; }
      };
    }
  };
}

// Create custom icons
const createCustomIcon = (iconUrl, iconSize) => {
  return L.icon({
    iconUrl,
    iconSize: iconSize || [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Enhanced Animated Marker component
const AnimatedMarker = ({
  position,
  icon,
  popupContent,
  tooltipContent,
  markerType = "default", // captain, user, destination
  animationDelay = 0,
  showPulse = false,
  pulseColor = "rgba(255, 20, 147, 0.4)",
  pulseRadius = 50
}) => {
  const markerRef = useRef(null);
  const animationRef = useRef(null);
  const pulseAnimationRef = useRef(null);
  const positionRef = useRef(position);
  const [isReady, setIsReady] = useState(false);

  // Get marker class based on type
  const getMarkerClass = useCallback(() => {
    switch(markerType) {
      case "captain":
        return "captain-marker";
      case "user":
        return "user-marker";
      case "destination":
        return "destination-marker";
      default:
        return "";
    }
  }, [markerType]);

  // Handle marker animation
  useEffect(() => {
    if (markerRef.current) {
      const markerElement = markerRef.current._icon;

      if (markerElement) {
        // Add custom class for styling
        markerElement.classList.add(getMarkerClass());

        // Ensure marker is visible initially
        gsap.set(markerElement, {
          opacity: 1,
          scale: 1,
          y: 0
        });

        try {
          // Kill any existing animations
          if (animationRef.current) {
            animationRef.current.kill();
          }

          if (pulseAnimationRef.current) {
            pulseAnimationRef.current.kill();
          }

          // Animate in with a subtle effect
          animationRef.current = gsap.fromTo(markerElement,
            { scale: 0.7, opacity: 0, y: -10 },
            {
              scale: 1,
              opacity: 1,
              y: 0,
              duration: 0.5,
              delay: animationDelay,
              ease: "back.out(1.5)",
              onComplete: () => setIsReady(true)
            }
          );

          // Add subtle pulse animation
          pulseAnimationRef.current = gsap.to(markerElement, {
            scale: 1.05,
            repeat: -1,
            yoyo: true,
            duration: 2,
            delay: animationDelay + 0.5,
            ease: "sine.inOut"
          });
        } catch (error) {
          console.error("Error animating marker:", error);
          // Ensure marker is visible even if animation fails
          setIsReady(true);
        }
      }
    }

    return () => {
      // Clean up animations on unmount
      if (animationRef.current) {
        animationRef.current.kill();
      }

      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.kill();
      }
    };
  }, [animationDelay, getMarkerClass]);

  // Handle position changes
  useEffect(() => {
    // Update position reference
    positionRef.current = position;
  }, [position]);

  return (
    <>
      {/* Location pulse effect (optional) */}
      {showPulse && isReady && (
        <Circle
          center={position}
          radius={pulseRadius}
          pathOptions={{
            color: pulseColor,
            fillColor: pulseColor,
            fillOpacity: 0.3,
            weight: 2,
            opacity: 0.5,
            className: "location-pulse"
          }}
        />
      )}

      {/* Marker with popup and/or tooltip */}
      <Marker
        position={position}
        icon={icon}
        ref={markerRef}
      >
        {popupContent && (
          <Popup className="custom-popup">
            {popupContent}
          </Popup>
        )}

        {tooltipContent && (
          <Tooltip
            direction="top"
            offset={[0, -10]}
            opacity={1}
            permanent={false}
          >
            {tooltipContent}
          </Tooltip>
        )}
      </Marker>
    </>
  );
};

// Enhanced Routing Machine component
const RoutingMachine = ({
  from,
  to,
  routeType = "default", // pickup, dropoff
  fitBounds = true,
  animateFit = true
}) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  const routeLineRef = useRef(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);

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

    try {
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

      // Check if routing machine is available
      if (!LeafletRoutingMachine || !LeafletRoutingMachine.control) {
        console.log("Using enhanced fallback route line");

        // Create a more visually appealing polyline
        // Main line
        const mainLine = L.polyline([from, to], {
          color: primary,
          weight: 5,
          opacity: 0.8,
          lineJoin: "round",
          lineCap: "round",
          className: "custom-route-line"
        }).addTo(map);

        // Glow effect line
        const glowLine = L.polyline([from, to], {
          color: secondary,
          weight: 9,
          opacity: 0.3,
          lineJoin: "round",
          lineCap: "round"
        }).addTo(map);

        // Store both lines for cleanup
        routeLineRef.current = L.layerGroup([glowLine, mainLine]).addTo(map);

        // Calculate straight-line distance (in km)
        const distance = map.distance(from, to) / 1000;
        setRouteDistance(distance.toFixed(1));

        // Estimate duration (3 mins per km)
        const duration = Math.ceil(distance * 3);
        setRouteDuration(duration);

        // Fit bounds to show the route if requested
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

        // Add direction arrow
        const arrowHead = L.polylineDecorator(mainLine, {
          patterns: [
            {
              offset: '50%',
              repeat: 0,
              symbol: L.Symbol.arrowHead({
                pixelSize: 15,
                polygon: false,
                pathOptions: {
                  color: primary,
                  fillOpacity: 1,
                  weight: 2
                }
              })
            }
          ]
        }).addTo(map);

        // Add to layer group for cleanup
        routeLineRef.current.addLayer(arrowHead);

        return () => {
          if (routeLineRef.current) {
            try {
              map.removeLayer(routeLineRef.current);
            } catch (e) {
              console.error("Error removing route line:", e);
            }
          }
        };
      }

      // Use the actual routing machine if available
      console.log("Using enhanced Leaflet Routing Machine");
      const fromLatLng = L.latLng(from[0], from[1]);
      const toLatLng = L.latLng(to[0], to[1]);

      const routingControl = LeafletRoutingMachine.control({
        waypoints: [fromLatLng, toLatLng],
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        fitSelectedRoutes: fitBounds,
        lineOptions: {
          styles: [
            { color: primary, opacity: 0.8, weight: 5, className: "custom-route-line" },
            { color: secondary, opacity: 0.3, weight: 9 }
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0
        },
        createMarker: function() { return null; }, // Disable default markers
        altLineOptions: {
          styles: [
            { color: '#9CA3AF', opacity: 0.4, weight: 4 },
            { color: '#D1D5DB', opacity: 0.2, weight: 8 }
          ]
        },
        router: LeafletRoutingMachine.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving',
          timeout: 5000
        })
      }).addTo(map);

      // Store the routing control for cleanup
      routingControlRef.current = routingControl;

      // Get route information when route is calculated
      routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          // Get distance in km
          const distance = (routes[0].summary.totalDistance / 1000).toFixed(1);
          setRouteDistance(distance);

          // Get duration in minutes
          const duration = Math.ceil(routes[0].summary.totalTime / 60);
          setRouteDuration(duration);
        }
      });

      // Animate the map to fit the route if requested
      if (fitBounds && animateFit) {
        map.flyToBounds([from, to], {
          padding: [50, 50],
          duration: 1.5
        });
      }

      return () => {
        if (routingControlRef.current) {
          try {
            map.removeControl(routingControlRef.current);
          } catch (e) {
            console.error("Error removing routing control:", e);
          }
        }
      };
    } catch (error) {
      console.error("Error creating route:", error);
      // Fallback to simple bounds
      if (fitBounds) {
        map.fitBounds([from, to], {
          padding: [50, 50]
        });
      }
      return () => {};
    }
  }, [from, to, map, routeType, fitBounds, animateFit, getRouteColors]);

  return null;
};

// Enhanced Map Recenter component
const MapRecenter = ({
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

// Map Controls component for additional map functionality
const MapControls = ({ onRecenter, onToggleFollowMode, followMode, onToggleMapType, mapType }) => {
  const map = useMap();
  const [showControls, setShowControls] = useState(true);

  // Toggle map controls visibility
  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      {/* Toggle button for controls */}
      <button
        onClick={toggleControls}
        className="bg-black bg-opacity-70 p-2 rounded-lg shadow-lg border border-gray-700 mb-2 hover:bg-opacity-90 transition-all duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {/* Control buttons */}
      {showControls && (
        <div className="flex flex-col space-y-2">
          {/* Recenter button */}
          <button
            onClick={onRecenter}
            className="bg-black bg-opacity-70 p-2 rounded-lg shadow-lg border border-gray-700 hover:bg-opacity-90 transition-all duration-200 tooltip-container"
            title="Recenter Map"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v10.764a1 1 0 01-1.447.894L15 18M5 18l-4.553-2.276A1 1 0 010 14.618V3.382a1 1 0 011.447-.894L5 4m0 14V4m0 0L9 2m0 0l4 2m0-2v18m0 0l-4-2m4 2l4.553 2.276A1 1 0 0018 20.618V9.382a1 1 0 00-1.447-.894L12 10" />
            </svg>
            <span className="tooltip">Recenter Map</span>
          </button>

          {/* Toggle follow mode */}
          <button
            onClick={onToggleFollowMode}
            className={`p-2 rounded-lg shadow-lg border border-gray-700 hover:bg-opacity-90 transition-all duration-200 tooltip-container ${followMode ? 'bg-secondary bg-opacity-70' : 'bg-black bg-opacity-70'}`}
            title={followMode ? "Follow Mode On" : "Follow Mode Off"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="tooltip">{followMode ? "Follow Mode On" : "Follow Mode Off"}</span>
          </button>

          {/* Toggle map type */}
          <button
            onClick={onToggleMapType}
            className="bg-black bg-opacity-70 p-2 rounded-lg shadow-lg border border-gray-700 hover:bg-opacity-90 transition-all duration-200 tooltip-container"
            title={`Map Type: ${mapType}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="tooltip">{`Map Type: ${mapType}`}</span>
          </button>

          {/* Zoom in */}
          <button
            onClick={() => map.zoomIn()}
            className="bg-black bg-opacity-70 p-2 rounded-lg shadow-lg border border-gray-700 hover:bg-opacity-90 transition-all duration-200 tooltip-container"
            title="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span className="tooltip">Zoom In</span>
          </button>

          {/* Zoom out */}
          <button
            onClick={() => map.zoomOut()}
            className="bg-black bg-opacity-70 p-2 rounded-lg shadow-lg border border-gray-700 hover:bg-opacity-90 transition-all duration-200 tooltip-container"
            title="Zoom Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
            <span className="tooltip">Zoom Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Enhanced CaptainMap component
const CaptainMap = ({
  currentLocation,
  activeRide,
  onRouteCalculated,
  initialZoom = 15,
  showLegend = true,
  showControls = true
}) => {
  // State for markers and map
  const [captainMarker, setCaptainMarker] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [mapType, setMapType] = useState('streets'); // streets, satellite
  const [routeInfo, setRouteInfo] = useState(null);

  // Refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Load custom icons with better error handling
  useEffect(() => {
    try {
      // Use our custom SVG icons with appropriate sizes
      setCaptainMarker(createCustomIcon(bikeMarkerIcon, [36, 36]));
      setUserMarker(createCustomIcon(userMarkerIcon, [36, 36]));
      setDestinationMarker(createCustomIcon(destinationMarkerIcon, [36, 36]));
    } catch (error) {
      console.error("Error loading marker icons:", error);
      // Fallback to default markers with custom styling
      const defaultIconOptions = {
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        className: 'default-marker'
      };

      setCaptainMarker(L.icon({
        ...defaultIconOptions,
        className: 'captain-marker'
      }));

      setUserMarker(L.icon({
        ...defaultIconOptions,
        className: 'user-marker'
      }));

      setDestinationMarker(L.icon({
        ...defaultIconOptions,
        className: 'destination-marker'
      }));
    }
  }, []);

  // Add map loading animation
  useEffect(() => {
    if (mapContainerRef.current) {
      gsap.fromTo(mapContainerRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out"
        }
      );
    }
  }, []);

  // Handle route calculation callback
  const handleRouteCalculated = useCallback((distance, duration) => {
    const routeData = { distance, duration };
    setRouteInfo(routeData);

    // Call parent callback if provided
    if (onRouteCalculated) {
      onRouteCalculated(routeData);
    }
  }, [onRouteCalculated]);

  // Map control handlers
  const handleRecenter = useCallback(() => {
    if (mapRef.current && currentLocation) {
      mapRef.current.flyTo(currentLocation, initialZoom, {
        duration: 1.5,
        easeLinearity: 0.5
      });
      setFollowMode(true);
    }
  }, [currentLocation, initialZoom]);

  const handleToggleFollowMode = useCallback(() => {
    setFollowMode(prev => !prev);
  }, []);

  const handleToggleMapType = useCallback(() => {
    setMapType(prev => prev === 'streets' ? 'satellite' : 'streets');
  }, []);

  // When the map is ready
  const handleMapReady = useCallback((map) => {
    console.log("Map is ready");
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

  // Loading state
  if (!currentLocation) {
    return (
      <div className="h-full flex items-center justify-center bg-black bg-opacity-30 rounded-xl">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-secondary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-300">Waiting for location...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className="h-full w-full rounded-xl overflow-hidden relative">
      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[2000]">
          <div className="text-center bg-black bg-opacity-70 p-6 rounded-xl border border-gray-700">
            <div className="animate-spin h-10 w-10 border-4 border-secondary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white font-medium">Loading map...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while we prepare your navigation</p>
          </div>
        </div>
      )}

      <MapContainer
        center={currentLocation}
        zoom={initialZoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        whenReady={(e) => handleMapReady(e.target)}
        attributionControl={false}
      >
        {/* Map tile layer based on selected map type */}
        {mapType === 'streets' ? (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        ) : (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com">Esri</a>'
          />
        )}

        {/* Captain's current location with pulse effect */}
        {currentLocation && captainMarker && mapLoaded && (
          <AnimatedMarker
            position={currentLocation}
            icon={captainMarker}
            popupContent={
              <div className="text-center">
                <div className="font-medium mb-1">Your Current Location</div>
                <div className="text-xs text-gray-300">{currentLocation[0].toFixed(6)}, {currentLocation[1].toFixed(6)}</div>
              </div>
            }
            tooltipContent="You are here"
            markerType="captain"
            animationDelay={0.2}
            showPulse={true}
            pulseColor="rgba(255, 20, 147, 0.4)"
            pulseRadius={30}
          />
        )}

        {/* Active ride pickup location */}
        {activeRide?.pickup && userMarker && mapLoaded && (
          <AnimatedMarker
            position={activeRide.pickup}
            icon={userMarker}
            popupContent={
              <div>
                <div className="font-medium mb-1">Pickup Location</div>
                <div className="text-sm">{activeRide.pickupAddress || "Pickup Location"}</div>
                {activeRide.userName && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="text-xs text-gray-300">Passenger</div>
                    <div className="text-sm font-medium">{activeRide.userName}</div>
                  </div>
                )}
              </div>
            }
            tooltipContent="Pickup Location"
            markerType="user"
            animationDelay={0.4}
          />
        )}

        {/* Active ride destination */}
        {activeRide?.drop && destinationMarker && mapLoaded && (
          <AnimatedMarker
            position={activeRide.drop}
            icon={destinationMarker}
            popupContent={
              <div>
                <div className="font-medium mb-1">Destination</div>
                <div className="text-sm">{activeRide.dropAddress || "Destination"}</div>
                {routeInfo && (
                  <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between text-xs">
                    <div>
                      <span className="text-gray-300">Distance:</span> {routeInfo.distance} km
                    </div>
                    <div>
                      <span className="text-gray-300">ETA:</span> {routeInfo.duration} mins
                    </div>
                  </div>
                )}
              </div>
            }
            tooltipContent="Destination"
            markerType="destination"
            animationDelay={0.6}
          />
        )}

        {/* Routing between captain and pickup */}
        {currentLocation && activeRide?.pickup && activeRide.status === "accepted" && (
          <RoutingMachine
            from={currentLocation}
            to={activeRide.pickup}
            routeType="pickup"
            fitBounds={true}
            animateFit={true}
          />
        )}

        {/* Routing between pickup and destination */}
        {activeRide?.pickup && activeRide?.drop && activeRide.status === "in_progress" && (
          <RoutingMachine
            from={activeRide.pickup}
            to={activeRide.drop}
            routeType="dropoff"
            fitBounds={true}
            animateFit={true}
          />
        )}

        {/* Keep map centered on captain's location if in follow mode */}
        <MapRecenter
          position={currentLocation}
          followMode={followMode}
          animate={true}
          animationDuration={1.0}
        />

        {/* Map controls */}
        {showControls && (
          <MapControls
            onRecenter={handleRecenter}
            onToggleFollowMode={handleToggleFollowMode}
            followMode={followMode}
            onToggleMapType={handleToggleMapType}
            mapType={mapType}
          />
        )}

        {/* Map Legend */}
        {showLegend && (
          <div className="absolute bottom-4 left-4 z-[1000] bg-black bg-opacity-80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-700">
            <div className="text-xs text-white mb-2 font-medium">Map Legend</div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-[#FF1493] mr-2 border border-white"></div>
              <span className="text-xs text-white">Your Location</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-[#4F46E5] mr-2 border border-white"></div>
              <span className="text-xs text-white">Pickup Location</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#10B981] mr-2 border border-white"></div>
              <span className="text-xs text-white">Destination</span>
            </div>
          </div>
        )}

        {/* Attribution */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-black bg-opacity-60 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-300">
          © <a href="https://www.openstreetmap.org/copyright" className="text-secondary hover:underline">OpenStreetMap</a> contributors
        </div>
      </MapContainer>
    </div>
  );
};

export default CaptainMap;
