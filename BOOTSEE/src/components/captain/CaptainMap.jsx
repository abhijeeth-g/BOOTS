import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { gsap } from "gsap";
import bikeMarkerIcon from "../../assets/bike-marker.svg";
import userMarkerIcon from "../../assets/user-marker.svg";
import destinationMarkerIcon from "../../assets/destination-marker.svg";

// Create custom icons
const createCustomIcon = (iconUrl, iconSize) => {
  return L.icon({
    iconUrl,
    iconSize: iconSize || [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Animated Marker component
const AnimatedMarker = ({ position, icon, popupContent, animationDelay = 0 }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current) {
      const markerElement = markerRef.current._icon;

      if (markerElement) {
        // Set initial state
        gsap.set(markerElement, {
          scale: 0,
          opacity: 0,
          y: -20
        });

        // Animate in
        gsap.to(markerElement, {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: animationDelay,
          ease: "back.out(1.7)"
        });

        // Add pulse animation
        gsap.to(markerElement, {
          scale: 1.1,
          repeat: -1,
          yoyo: true,
          duration: 1.5,
          delay: animationDelay + 0.6,
          ease: "sine.inOut"
        });
      }
    }
  }, [animationDelay]);

  return (
    <Marker position={position} icon={icon} ref={markerRef}>
      {popupContent && <Popup>{popupContent}</Popup>}
    </Marker>
  );
};

// Routing Machine component
const RoutingMachine = ({ from, to }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!from || !to || !map) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(...from), L.latLng(...to)],
      routeWhileDragging: false,
      show: false,
      addWaypoints: false,
      lineOptions: {
        styles: [
          { color: "#FF1493", opacity: 0.8, weight: 6 },
          { color: "#FF69B4", opacity: 0.5, weight: 2 }
        ]
      },
      createMarker: function() { return null; } // Disable default markers
    }).addTo(map);

    routingControlRef.current = routingControl;

    // Animate the map to fit the route
    map.flyToBounds([from, to], {
      padding: [50, 50],
      duration: 1.5
    });

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [from, to, map]);

  return null;
};

// Map Recenter component
const MapRecenter = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return null;
};

const CaptainMap = ({ currentLocation, activeRide }) => {
  const [carMarker, setCarMarker] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef(null);

  // Load custom icons
  useEffect(() => {
    // Use our custom SVG icons
    setCarMarker(createCustomIcon(bikeMarkerIcon));
    setUserMarker(createCustomIcon(userMarkerIcon));
    setDestinationMarker(createCustomIcon(destinationMarkerIcon));
  }, []);

  // Add map loading animation
  useEffect(() => {
    if (mapContainerRef.current) {
      gsap.from(mapContainerRef.current, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.out"
      });
    }
  }, []);

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
    <div ref={mapContainerRef} className="h-full w-full rounded-xl overflow-hidden">
      <MapContainer
        center={currentLocation}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        whenReady={() => setMapLoaded(true)}
      >
        <ZoomControl position="bottomright" />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Captain's current location */}
        {currentLocation && carMarker && mapLoaded && (
          <AnimatedMarker
            position={currentLocation}
            icon={carMarker}
            popupContent="You are here"
            animationDelay={0.2}
          />
        )}

        {/* Active ride pickup location */}
        {activeRide?.pickup && userMarker && mapLoaded && (
          <AnimatedMarker
            position={activeRide.pickup}
            icon={userMarker}
            popupContent={`Pickup: ${activeRide.pickupAddress || "Pickup Location"}`}
            animationDelay={0.4}
          />
        )}

        {/* Active ride destination */}
        {activeRide?.drop && destinationMarker && mapLoaded && (
          <AnimatedMarker
            position={activeRide.drop}
            icon={destinationMarker}
            popupContent={`Destination: ${activeRide.dropAddress || "Destination"}`}
            animationDelay={0.6}
          />
        )}

      {/* Routing between captain and pickup */}
      {currentLocation && activeRide?.pickup && activeRide.status === "accepted" && (
        <RoutingMachine from={currentLocation} to={activeRide.pickup} />
      )}

      {/* Routing between pickup and destination */}
      {activeRide?.pickup && activeRide?.drop && activeRide.status === "in_progress" && (
        <RoutingMachine from={activeRide.pickup} to={activeRide.drop} />
      )}

      {/* Keep map centered on captain's location */}
      <MapRecenter position={currentLocation} />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-black bg-opacity-80 p-3 rounded-lg shadow-lg border border-gray-700">
        <div className="text-xs text-white mb-2 font-medium">Map Legend:</div>
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
    </MapContainer>
    </div>
  );
};

export default CaptainMap;
