import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";

// Create a function to generate colored dot icons
const createColoredDotIcon = (color, size = 12) => {
  return L.divIcon({
    className: 'colored-dot-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// Create a bike icon for the captain
const createBikeIcon = (size = 32) => {
  return L.divIcon({
    className: 'bike-icon',
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px; background-color: #FF1493; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="${size*0.6}px" height="${size*0.6}px">
          <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// MapCenter component to keep the map centered on a position
const MapCenter = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return null;
};

// RoutingMachine component to show the route with turn-by-turn directions
const RoutingMachine = ({ from, to, showDirections = false }) => {
  const map = useMap();
  const [directionsVisible, setDirectionsVisible] = useState(false);
  const [directions, setDirections] = useState([]);

  useEffect(() => {
    if (!from || !to || !map) return;

    // Create a polyline for the route (fallback)
    const routePath = L.polyline([from, to], {
      color: '#FF1493',
      weight: 5,
      opacity: 0.7,
      lineJoin: 'round'
    }).addTo(map);

    // Calculate distance using Haversine formula
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

    // Calculate distance and time
    const distance = calculateDistance(from[0], from[1], to[0], to[1]);
    const estimatedTime = Math.ceil(distance * 3); // 3 minutes per km

    // Add a tooltip showing the distance and time
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
    .setContent(`<div class="route-info"><strong>${distance.toFixed(1)} km</strong> · ${estimatedTime} mins</div>`)
    .addTo(map);

    // Create a directions panel if showDirections is true
    let directionsPanel = null;
    if (showDirections) {
      directionsPanel = L.control({ position: 'bottomleft' });

      directionsPanel.onAdd = function() {
        const div = L.DomUtil.create('div', 'directions-panel');
        div.innerHTML = `
          <div class="directions-header">
            <h3>Directions</h3>
            <button class="directions-toggle">Show</button>
          </div>
          <div class="directions-content" style="display: none;">
            <div class="directions-list">Loading directions...</div>
          </div>
        `;
        return div;
      };

      directionsPanel.addTo(map);

      // Add event listener to toggle directions
      setTimeout(() => {
        const toggleBtn = document.querySelector('.directions-toggle');
        const content = document.querySelector('.directions-content');

        if (toggleBtn && content) {
          toggleBtn.addEventListener('click', () => {
            const isVisible = content.style.display !== 'none';
            content.style.display = isVisible ? 'none' : 'block';
            toggleBtn.textContent = isVisible ? 'Show' : 'Hide';
            setDirectionsVisible(!isVisible);
          });
        }
      }, 100);
    }

    // Try to use Leaflet Routing Machine for actual road routing
    try {
      const routingControl = L.Routing.control({
        waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
        routeWhileDragging: false,
        show: false,
        showAlternatives: false,
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving',
          suppressDemoServerWarning: true,
          geometryOnly: false
        }),
        createMarker: function() { return null; },
        addWaypoints: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [
            { color: '#FF1493', opacity: 0.9, weight: 6 },
            { color: '#FF69B4', opacity: 0.6, weight: 3 }
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0
        }
      }).addTo(map);

      // Handle route found event
      routingControl.on('routesfound', function(e) {
        // Remove the fallback route
        map.removeLayer(routePath);

        // Remove the estimated tooltip
        map.removeLayer(tooltip);

        // Get the actual route details
        const route = e.routes[0];
        const actualDistance = route.summary.totalDistance / 1000;
        const actualTime = Math.ceil(route.summary.totalTime / 60);

        // Add a new tooltip with actual information
        const routeMidPoint = route.coordinates[Math.floor(route.coordinates.length / 2)];
        L.tooltip({
          permanent: true,
          direction: 'center',
          className: 'route-tooltip'
        })
        .setLatLng([routeMidPoint.lat, routeMidPoint.lng])
        .setContent(`<div class="route-info"><strong>${actualDistance.toFixed(1)} km</strong> · ${actualTime} mins</div>`)
        .addTo(map);

        // Add turn markers
        const turnMarkers = [];
        if (route.instructions) {
          // Process directions for the panel
          const directionsList = route.instructions.map((instruction, idx) => {
            // Only add markers for significant turns
            if (instruction.type !== "WaypointReached" && instruction.type !== "Straight" && idx % 2 === 0) {
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

            // Return formatted direction for the panel
            return `
              <div class="direction-item">
                <div class="direction-number">${idx + 1}</div>
                <div class="direction-text">${instruction.text}</div>
                <div class="direction-distance">${
                  instruction.distance ? (instruction.distance > 1000 ?
                    (instruction.distance / 1000).toFixed(1) + ' km' :
                    instruction.distance.toFixed(0) + ' m') :
                  ''
                }</div>
              </div>
            `;
          });

          setDirections(directionsList);

          // Update the directions panel if it exists
          if (showDirections) {
            setTimeout(() => {
              const directionsList = document.querySelector('.directions-list');
              if (directionsList) {
                directionsList.innerHTML = directions.join('');
              }
            }, 200);
          }
        }

        // Update cleanup function to remove turn markers
        routingControl._cleanup = () => {
          turnMarkers.forEach(marker => map.removeLayer(marker));
        };
      });

      return () => {
        if (routingControl._cleanup) {
          routingControl._cleanup();
        }
        map.removeControl(routingControl);
        if (map.hasLayer(routePath)) {
          map.removeLayer(routePath);
        }
        if (map.hasLayer(tooltip)) {
          map.removeLayer(tooltip);
        }
        if (directionsPanel) {
          map.removeControl(directionsPanel);
        }
      };
    } catch (error) {
      console.error("Error setting up routing:", error);
      return () => {
        if (map.hasLayer(routePath)) {
          map.removeLayer(routePath);
        }
        if (map.hasLayer(tooltip)) {
          map.removeLayer(tooltip);
        }
        if (directionsPanel) {
          map.removeControl(directionsPanel);
        }
      };
    }
  }, [from, to, map, showDirections]);

  return null;
};

const CaptainMap = ({ currentLocation, activeRide }) => {
  const [mapCenter, setMapCenter] = useState(null);

  // Set map center based on current location or active ride
  useEffect(() => {
    if (currentLocation) {
      setMapCenter(currentLocation);
    }
  }, [currentLocation]);

  // Add CSS for the route tooltip and directions panel
  useEffect(() => {
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
      .directions-panel {
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 8px;
        max-width: 300px;
        max-height: 400px;
        overflow: auto;
        margin: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }
      .directions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background: #FF1493;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
      }
      .directions-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: bold;
      }
      .directions-toggle {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      .directions-content {
        padding: 10px 15px;
        max-height: 300px;
        overflow-y: auto;
      }
      .direction-item {
        display: flex;
        margin-bottom: 12px;
        align-items: flex-start;
      }
      .direction-number {
        background: #FF1493;
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        margin-right: 10px;
        flex-shrink: 0;
      }
      .direction-text {
        flex: 1;
        font-size: 12px;
      }
      .direction-distance {
        color: #ccc;
        font-size: 10px;
        margin-left: 5px;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!mapCenter) {
    return (
      <div className="h-full flex items-center justify-center bg-dark-primary">
        <p className="text-gray-400">Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Captain's current location */}
      {currentLocation && (
        <Marker position={currentLocation} icon={createBikeIcon(32)}>
          <Popup>Your current location</Popup>
        </Marker>
      )}

      {/* Active ride pickup and drop locations */}
      {activeRide && activeRide.pickup && (
        <Marker position={activeRide.pickup} icon={createColoredDotIcon('#FF1493', 16)}>
          <Popup>Pickup: {activeRide.pickupAddress}</Popup>
        </Marker>
      )}

      {activeRide && activeRide.drop && (
        <Marker position={activeRide.drop} icon={createColoredDotIcon('#4CAF50', 16)}>
          <Popup>Destination: {activeRide.dropAddress}</Popup>
        </Marker>
      )}

      {/* Route between current location and pickup/drop */}
      {currentLocation && activeRide && activeRide.status === "accepted" && activeRide.pickup && (
        <RoutingMachine
          from={currentLocation}
          to={activeRide.pickup}
          showDirections={true}
        />
      )}

      {currentLocation && activeRide && activeRide.status === "in_progress" && activeRide.drop && (
        <RoutingMachine
          from={currentLocation}
          to={activeRide.drop}
          showDirections={true}
        />
      )}

      {/* Keep map centered */}
      <MapCenter position={mapCenter} />
    </MapContainer>
  );
};

export default CaptainMap;
