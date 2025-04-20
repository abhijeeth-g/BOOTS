import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";

// Create custom icons
const createCustomIcon = (iconUrl, iconSize) => {
  return L.icon({
    iconUrl,
    iconSize: iconSize || [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Routing Machine component
const RoutingMachine = ({ from, to }) => {
  const map = useMap();

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
      }
    }).addTo(map);

    map.fitBounds([from, to], { padding: [50, 50] });

    return () => map.removeControl(routingControl);
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

  // Load custom icons
  useEffect(() => {
    // In a real app, you would have these icons in your assets folder
    // For now, we'll use default Leaflet markers
    setCarMarker(L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    }));
    
    setUserMarker(L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    }));
    
    setDestinationMarker(L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    }));
  }, []);

  if (!currentLocation) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">Waiting for location...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={currentLocation}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Captain's current location */}
      {currentLocation && carMarker && (
        <Marker position={currentLocation} icon={carMarker}>
          <Popup>You are here</Popup>
        </Marker>
      )}
      
      {/* Active ride pickup location */}
      {activeRide?.pickup && userMarker && (
        <Marker position={activeRide.pickup} icon={userMarker}>
          <Popup>Pickup: {activeRide.pickupAddress || "Pickup Location"}</Popup>
        </Marker>
      )}
      
      {/* Active ride destination */}
      {activeRide?.drop && destinationMarker && (
        <Marker position={activeRide.drop} icon={destinationMarker}>
          <Popup>Destination: {activeRide.dropAddress || "Destination"}</Popup>
        </Marker>
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
    </MapContainer>
  );
};

export default CaptainMap;
