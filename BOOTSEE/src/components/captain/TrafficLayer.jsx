import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { gsap } from 'gsap';
import './TrafficLayer.css';

// TrafficLayer component for showing traffic conditions
const TrafficLayer = ({
  enabled = false,
  onToggle
}) => {
  const map = useMap();
  const [isVisible, setIsVisible] = useState(enabled);
  const trafficLayerRef = useRef(null);
  const controlRef = useRef(null);
  
  // Create mock traffic data
  const createMockTrafficData = () => {
    const center = map.getCenter();
    const bounds = map.getBounds();
    const trafficData = [];
    
    // Create main roads
    const mainRoads = [
      // North-South road
      {
        path: [
          [bounds.getNorth(), center.lng],
          [bounds.getSouth(), center.lng]
        ],
        congestion: 'medium'
      },
      // East-West road
      {
        path: [
          [center.lat, bounds.getWest()],
          [center.lat, bounds.getEast()]
        ],
        congestion: 'high'
      },
      // Diagonal road 1
      {
        path: [
          [bounds.getNorth() - 0.01, bounds.getWest() + 0.01],
          [bounds.getSouth() + 0.01, bounds.getEast() - 0.01]
        ],
        congestion: 'low'
      },
      // Diagonal road 2
      {
        path: [
          [bounds.getNorth() - 0.01, bounds.getEast() - 0.01],
          [bounds.getSouth() + 0.01, bounds.getWest() + 0.01]
        ],
        congestion: 'medium'
      }
    ];
    
    // Add some random roads
    for (let i = 0; i < 10; i++) {
      const startLat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());
      const startLng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
      const length = 0.01 + Math.random() * 0.02;
      const angle = Math.random() * Math.PI * 2;
      
      const endLat = startLat + Math.cos(angle) * length;
      const endLng = startLng + Math.sin(angle) * length;
      
      // Random congestion level
      const congestionLevels = ['low', 'medium', 'high'];
      const congestion = congestionLevels[Math.floor(Math.random() * congestionLevels.length)];
      
      mainRoads.push({
        path: [
          [startLat, startLng],
          [endLat, endLng]
        ],
        congestion
      });
    }
    
    return mainRoads;
  };
  
  // Initialize traffic layer
  useEffect(() => {
    if (!map) return;
    
    // Create traffic layer group
    const trafficGroup = L.layerGroup();
    trafficLayerRef.current = trafficGroup;
    
    // Get mock traffic data
    const trafficData = createMockTrafficData();
    
    // Create traffic lines
    trafficData.forEach(road => {
      // Set line style based on congestion
      let color, weight, opacity, dashArray;
      
      switch(road.congestion) {
        case 'high':
          color = '#FF0000'; // Red
          weight = 5;
          opacity = 0.8;
          dashArray = null;
          break;
        case 'medium':
          color = '#FFA500'; // Orange
          weight = 4;
          opacity = 0.7;
          dashArray = null;
          break;
        case 'low':
        default:
          color = '#4CAF50'; // Green
          weight = 4;
          opacity = 0.6;
          dashArray = null;
      }
      
      // Create polyline
      const trafficLine = L.polyline(road.path, {
        color,
        weight,
        opacity,
        dashArray,
        className: `traffic-line traffic-${road.congestion}`
      });
      
      // Add tooltip with traffic info
      trafficLine.bindTooltip(`Traffic: ${road.congestion.charAt(0).toUpperCase() + road.congestion.slice(1)}`, {
        permanent: false,
        direction: 'top',
        className: 'traffic-tooltip'
      });
      
      // Add to layer group
      trafficGroup.addLayer(trafficLine);
    });
    
    // Add to map if enabled
    if (isVisible) {
      trafficGroup.addTo(map);
    }
    
    // Create custom control for toggling traffic
    const TrafficControl = L.Control.extend({
      options: {
        position: 'topright'
      },
      onAdd: function() {
        const container = L.DomUtil.create('div', 'traffic-control');
        container.innerHTML = `
          <button class="traffic-toggle ${isVisible ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="traffic-icon">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            <span class="traffic-label">Traffic</span>
          </button>
        `;
        
        // Add click handler
        L.DomEvent.on(container, 'click', function(e) {
          L.DomEvent.stopPropagation(e);
          
          // Toggle visibility
          const newState = !isVisible;
          setIsVisible(newState);
          
          // Call onToggle callback if provided
          if (onToggle) {
            onToggle(newState);
          }
          
          // Update button state
          const button = container.querySelector('.traffic-toggle');
          if (newState) {
            button.classList.add('active');
          } else {
            button.classList.remove('active');
          }
        });
        
        return container;
      }
    });
    
    // Add control to map
    const control = new TrafficControl();
    map.addControl(control);
    controlRef.current = control;
    
    // Animate in the control
    const controlElement = control.getContainer();
    gsap.fromTo(
      controlElement,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: 'power2.out' }
    );
    
    // Cleanup
    return () => {
      if (trafficLayerRef.current) {
        map.removeLayer(trafficLayerRef.current);
      }
      
      if (controlRef.current) {
        map.removeControl(controlRef.current);
      }
    };
  }, [map]);
  
  // Update layer visibility when isVisible changes
  useEffect(() => {
    if (!map || !trafficLayerRef.current) return;
    
    if (isVisible) {
      trafficLayerRef.current.addTo(map);
    } else {
      map.removeLayer(trafficLayerRef.current);
    }
  }, [isVisible, map]);
  
  return null;
};

export default TrafficLayer;
