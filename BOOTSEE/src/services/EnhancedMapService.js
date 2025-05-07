/**
 * Enhanced Map Service
 * Provides advanced map functionality with multiple providers and fallbacks
 */

import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet.markercluster";
import "leaflet-contextmenu";
import "leaflet-offline";
import { toast } from "react-toastify";

// Map provider configurations
const MAP_PROVIDERS = {
  openStreetMap: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  mapbox: {
    name: "Mapbox Streets",
    url: "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}",
    attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>',
    accessToken: process.env.REACT_APP_MAPBOX_TOKEN || "pk.eyJ1IjoiYm9vdHNlZSIsImEiOiJjbHRxcWVxbGUwMGRqMmtvNXB1cXRvZnRrIn0.Jst9gj-AK5bxKQyV_0q0Ug",
    maxZoom: 22
  },
  mapboxSatellite: {
    name: "Mapbox Satellite",
    url: "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}",
    attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>',
    accessToken: process.env.REACT_APP_MAPBOX_TOKEN || "pk.eyJ1IjoiYm9vdHNlZSIsImEiOiJjbHRxcWVxbGUwMGRqMmtvNXB1cXRvZnRrIn0.Jst9gj-AK5bxKQyV_0q0Ug",
    maxZoom: 22
  },
  googleMaps: {
    name: "Google Maps",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
    maxZoom: 20
  },
  googleSatellite: {
    name: "Google Satellite",
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
    maxZoom: 20
  },
  esri: {
    name: "ESRI World Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>',
    maxZoom: 19
  }
};

// Routing provider configurations
const ROUTING_PROVIDERS = {
  osrm: {
    name: "OSRM",
    serviceUrl: "https://router.project-osrm.org/route/v1",
    profile: "driving",
    timeout: 10000
  },
  graphhopper: {
    name: "GraphHopper",
    serviceUrl: "https://graphhopper.com/api/1/route",
    apiKey: process.env.REACT_APP_GRAPHHOPPER_KEY || "3a2e0c4a-b568-4e99-8929-d9e2e4e948b6",
    profile: "car",
    timeout: 10000
  },
  mapbox: {
    name: "Mapbox Directions",
    serviceUrl: "https://api.mapbox.com/directions/v5/mapbox",
    accessToken: process.env.REACT_APP_MAPBOX_TOKEN || "pk.eyJ1IjoiYm9vdHNlZSIsImEiOiJjbHRxcWVxbGUwMGRqMmtvNXB1cXRvZnRrIn0.Jst9gj-AK5bxKQyV_0q0Ug",
    profile: "driving",
    timeout: 10000
  }
};

// Minimum distance to consider a position change (in km)
const MIN_DISTANCE_THRESHOLD = 0.01; // 10 meters

class EnhancedMapService {
  constructor() {
    this.maps = new Map(); // Store multiple map instances
    this.routes = new Map(); // Store active routes
    this.markers = new Map(); // Store markers
    this.markerClusters = new Map(); // Store marker clusters
    this.cachedTiles = new Set(); // Track cached tiles
    this.offlineMode = false;
    this.defaultProvider = 'openStreetMap';
    this.defaultRoutingProvider = 'osrm';
    this.mapBounds = null; // Current map bounds for multitasking
    this.safetyZones = []; // Geofenced safety zones
    this.listeners = {
      route: [],
      safety: [],
      offline: [],
      click: []
    };
    
    // Initialize offline capabilities
    this.setupOfflineCapabilities();
  }

  /**
   * Initialize a map in the specified container
   */
  initMap(containerId, options = {}) {
    // Check if map already exists
    if (this.maps.has(containerId)) {
      return this.maps.get(containerId);
    }

    const {
      center = [20.5937, 78.9629], // Default to center of India
      zoom = 5,
      minZoom = 3,
      maxZoom = 19,
      provider = this.defaultProvider,
      zoomControl = true,
      attributionControl = true,
      contextMenu = true,
      contextMenuItems = []
    } = options;

    // Create map instance
    const mapOptions = {
      center,
      zoom,
      minZoom,
      maxZoom,
      zoomControl,
      attributionControl,
      contextmenu: contextMenu,
      contextmenuItems: [
        {
          text: 'Set as pickup location',
          callback: (e) => this.notifyListeners('click', { type: 'pickup', latlng: e.latlng })
        },
        {
          text: 'Set as destination',
          callback: (e) => this.notifyListeners('click', { type: 'destination', latlng: e.latlng })
        },
        ...contextMenuItems
      ]
    };

    const map = L.map(containerId, mapOptions);

    // Add tile layer
    const providerConfig = MAP_PROVIDERS[provider] || MAP_PROVIDERS.openStreetMap;
    const tileLayer = L.tileLayer(providerConfig.url, {
      attribution: providerConfig.attribution,
      subdomains: providerConfig.subdomains || ['a', 'b', 'c'],
      maxZoom,
      minZoom,
      accessToken: providerConfig.accessToken
    }).addTo(map);

    // Create marker cluster group
    const markerCluster = L.markerClusterGroup({
      disableClusteringAtZoom: 14,
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 40
    });
    map.addLayer(markerCluster);
    this.markerClusters.set(containerId, markerCluster);

    // Store map instance
    this.maps.set(containerId, {
      map,
      tileLayer,
      provider,
      containerId
    });

    // Set up offline tile caching
    this.setupTileCaching(map, tileLayer);

    // Listen for bounds changes
    map.on('moveend', () => {
      this.mapBounds = map.getBounds();
      this.checkSafetyZones(map);
    });

    // Listen for clicks
    map.on('click', (e) => {
      this.notifyListeners('click', { type: 'map', latlng: e.latlng });
    });

    return this.maps.get(containerId);
  }

  /**
   * Set up offline capabilities
   */
  setupOfflineCapabilities() {
    // Check if offline storage is available
    if ('caches' in window) {
      // Initialize offline storage
      this.offlineStorage = {
        tileCache: 'bootseeTileCache',
        dataCache: 'bootseeDataCache',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      };
    } else {
      console.warn('Cache API not available. Offline mode will be limited.');
      this.offlineStorage = null;
    }
  }

  /**
   * Set up tile caching for offline use
   */
  setupTileCaching(map, tileLayer) {
    if (!this.offlineStorage) return;

    // Add event listeners for tile loading
    tileLayer.on('tileload', (e) => {
      const tile = e.tile;
      const src = tile.src;
      
      // Cache the tile
      if (src && !this.cachedTiles.has(src)) {
        this.cachedTiles.add(src);
        this.cacheTile(src);
      }
    });
  }

  /**
   * Cache a tile for offline use
   */
  async cacheTile(url) {
    if (!this.offlineStorage) return;

    try {
      const cache = await caches.open(this.offlineStorage.tileCache);
      await cache.add(url);
    } catch (error) {
      console.warn('Failed to cache tile:', error);
    }
  }

  /**
   * Add a marker to the map
   */
  addMarker(mapId, position, options = {}) {
    const mapData = this.maps.get(mapId);
    if (!mapData) return null;

    const { map } = mapData;
    const markerCluster = this.markerClusters.get(mapId);

    const {
      icon,
      popup,
      tooltip,
      draggable = false,
      clustered = false,
      id = `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    } = options;

    // Create marker
    const marker = L.marker(position, {
      icon: icon,
      draggable: draggable
    });

    // Add popup if provided
    if (popup) {
      marker.bindPopup(popup);
    }

    // Add tooltip if provided
    if (tooltip) {
      marker.bindTooltip(tooltip);
    }

    // Add to cluster or directly to map
    if (clustered && markerCluster) {
      markerCluster.addLayer(marker);
    } else {
      marker.addTo(map);
    }

    // Store marker
    if (!this.markers.has(mapId)) {
      this.markers.set(mapId, new Map());
    }
    this.markers.get(mapId).set(id, marker);

    return id;
  }

  /**
   * Remove a marker from the map
   */
  removeMarker(mapId, markerId) {
    const mapData = this.maps.get(mapId);
    if (!mapData) return false;

    const { map } = mapData;
    const markerCluster = this.markerClusters.get(mapId);
    const mapMarkers = this.markers.get(mapId);

    if (mapMarkers && mapMarkers.has(markerId)) {
      const marker = mapMarkers.get(markerId);
      
      // Remove from cluster or map
      if (markerCluster && markerCluster.hasLayer(marker)) {
        markerCluster.removeLayer(marker);
      } else {
        map.removeLayer(marker);
      }
      
      // Remove from storage
      mapMarkers.delete(markerId);
      return true;
    }
    
    return false;
  }

  /**
   * Update a marker's position
   */
  updateMarkerPosition(mapId, markerId, position) {
    const mapMarkers = this.markers.get(mapId);
    if (mapMarkers && mapMarkers.has(markerId)) {
      const marker = mapMarkers.get(markerId);
      marker.setLatLng(position);
      return true;
    }
    return false;
  }

  /**
   * Create a route between two points
   */
  createRoute(mapId, from, to, options = {}) {
    const mapData = this.maps.get(mapId);
    if (!mapData) return null;

    const { map } = mapData;
    
    const {
      color = '#FF1493',
      weight = 5,
      opacity = 0.8,
      fitBounds = true,
      showMarkers = false,
      alternatives = false,
      provider = this.defaultRoutingProvider,
      routeId = `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      onRouteFound = null
    } = options;

    // Clean up existing route with same ID
    if (this.routes.has(routeId)) {
      this.removeRoute(mapId, routeId);
    }

    // Convert from/to to LatLng if they are arrays
    const fromLatLng = Array.isArray(from) ? L.latLng(from[0], from[1]) : from;
    const toLatLng = Array.isArray(to) ? L.latLng(to[0], to[1]) : to;

    // Get routing provider config
    const providerConfig = ROUTING_PROVIDERS[provider] || ROUTING_PROVIDERS.osrm;

    // Create routing control
    const routingControl = L.Routing.control({
      waypoints: [fromLatLng, toLatLng],
      routeWhileDragging: false,
      showAlternatives: alternatives,
      fitSelectedRoutes: fitBounds,
      show: false, // Don't show the routing panel
      lineOptions: {
        styles: [
          { color, opacity, weight }
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      createMarker: showMarkers ? undefined : function() { return null; },
      router: L.Routing.osrmv1({
        serviceUrl: providerConfig.serviceUrl,
        profile: providerConfig.profile,
        timeout: providerConfig.timeout
      })
    }).addTo(map);

    // Store route
    this.routes.set(routeId, {
      control: routingControl,
      mapId,
      from: fromLatLng,
      to: toLatLng
    });

    // Listen for route calculation
    routingControl.on('routesfound', (e) => {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const route = routes[0];
        const summary = route.summary;
        const coordinates = route.coordinates;
        
        // Calculate distance and time
        const distance = summary.totalDistance / 1000; // km
        const time = Math.ceil(summary.totalTime / 60); // minutes
        
        // Notify listeners
        this.notifyListeners('route', {
          routeId,
          distance,
          time,
          coordinates
        });
        
        // Call callback if provided
        if (onRouteFound) {
          onRouteFound({
            routeId,
            distance,
            time,
            coordinates
          });
        }
      }
    });

    return routeId;
  }

  /**
   * Remove a route from the map
   */
  removeRoute(mapId, routeId) {
    const mapData = this.maps.get(mapId);
    if (!mapData || !this.routes.has(routeId)) return false;

    const { map } = mapData;
    const route = this.routes.get(routeId);
    
    if (route && route.control) {
      map.removeControl(route.control);
      this.routes.delete(routeId);
      return true;
    }
    
    return false;
  }

  /**
   * Add a listener for events
   */
  addListener(type, callback) {
    if (this.listeners[type]) {
      this.listeners[type].push(callback);
      return true;
    }
    return false;
  }

  /**
   * Remove a listener
   */
  removeListener(type, callback) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
      return true;
    }
    return false;
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(type, data) {
    if (this.listeners[type]) {
      this.listeners[type].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${type} listener:`, error);
        }
      });
    }
  }

  /**
   * Check if a point is within any safety zone
   */
  checkSafetyZones(map) {
    if (!map || this.safetyZones.length === 0) return;
    
    const center = map.getCenter();
    
    for (const zone of this.safetyZones) {
      const distance = this.calculateDistance(
        center.lat, center.lng,
        zone.center[0], zone.center[1]
      );
      
      if (distance <= zone.radius) {
        this.notifyListeners('safety', {
          inZone: true,
          zone
        });
        return;
      }
    }
    
    this.notifyListeners('safety', {
      inZone: false
    });
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Remove all maps
    this.maps.forEach(({ map }) => {
      map.remove();
    });
    
    this.maps.clear();
    this.routes.clear();
    this.markers.clear();
    this.markerClusters.clear();
    this.safetyZones = [];
    
    // Clear all listeners
    Object.keys(this.listeners).forEach(type => {
      this.listeners[type] = [];
    });
  }
}

// Create singleton instance
const enhancedMapService = new EnhancedMapService();
export default enhancedMapService;
