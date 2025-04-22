import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { gsap } from 'gsap';
import './HeatmapLayer.css';

// HeatmapLayer component for showing high-demand areas
const HeatmapLayer = ({
  points = [],
  enabled = false,
  radius = 25,
  blur = 15,
  maxZoom = 18,
  gradient = { 0.4: '#FFC0CB', 0.65: '#FF69B4', 1: '#FF1493' },
  onToggle
}) => {
  const map = useMap();
  const heatLayerRef = useRef(null);
  const controlRef = useRef(null);
  const [isVisible, setIsVisible] = useState(enabled);
  
  // Create mock data if no points are provided
  const getMockData = () => {
    // If real points are provided, use them
    if (points && points.length > 0) {
      return points;
    }
    
    // Otherwise generate mock data around the current map center
    const center = map.getCenter();
    const mockPoints = [];
    
    // Generate 50 random points around the center
    for (let i = 0; i < 50; i++) {
      // Random offset from center (within ~2km)
      const latOffset = (Math.random() - 0.5) * 0.02;
      const lngOffset = (Math.random() - 0.5) * 0.02;
      
      // Random intensity (0.3 to 1.0)
      const intensity = 0.3 + Math.random() * 0.7;
      
      mockPoints.push([
        center.lat + latOffset,
        center.lng + lngOffset,
        intensity
      ]);
    }
    
    // Add a few hotspots with higher intensity
    for (let i = 0; i < 5; i++) {
      const latOffset = (Math.random() - 0.5) * 0.015;
      const lngOffset = (Math.random() - 0.5) * 0.015;
      
      mockPoints.push([
        center.lat + latOffset,
        center.lng + lngOffset,
        1.0 // Maximum intensity
      ]);
    }
    
    return mockPoints;
  };

  // Initialize heatmap layer
  useEffect(() => {
    if (!map || !L.heatLayer) return;
    
    // Create heatmap layer with provided or mock data
    const heatData = getMockData();
    
    // Create the heat layer
    const heatLayer = L.heatLayer(heatData, {
      radius,
      blur,
      maxZoom,
      gradient
    });
    
    // Store reference
    heatLayerRef.current = heatLayer;
    
    // Add to map if enabled
    if (isVisible) {
      heatLayer.addTo(map);
    }
    
    // Create custom control for toggling heatmap
    const HeatmapControl = L.Control.extend({
      options: {
        position: 'topright'
      },
      onAdd: function() {
        const container = L.DomUtil.create('div', 'heatmap-control');
        container.innerHTML = `
          <button class="heatmap-toggle ${isVisible ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="heatmap-icon">
              <path d="M8 2h8l4 4-4 4H8l-4-4 4-4z"/>
              <path d="M16 14h-8l-4 4 4 4h8l4-4-4-4z"/>
              <path d="M8 10V6"/>
              <path d="M16 10V6"/>
              <path d="M12 14v-4"/>
              <path d="M12 22v-4"/>
            </svg>
            <span class="heatmap-label">Demand</span>
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
          const button = container.querySelector('.heatmap-toggle');
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
    const control = new HeatmapControl();
    map.addControl(control);
    controlRef.current = control;
    
    // Animate in the control
    const controlElement = control.getContainer();
    gsap.fromTo(
      controlElement,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.2, ease: 'power2.out' }
    );
    
    // Cleanup
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
      
      if (controlRef.current) {
        map.removeControl(controlRef.current);
      }
    };
  }, [map, radius, blur, maxZoom, points]);
  
  // Update layer visibility when isVisible changes
  useEffect(() => {
    if (!map || !heatLayerRef.current) return;
    
    if (isVisible) {
      heatLayerRef.current.addTo(map);
    } else {
      map.removeLayer(heatLayerRef.current);
    }
  }, [isVisible, map]);
  
  return null;
};

export default HeatmapLayer;
