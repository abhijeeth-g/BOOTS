/**
 * Enhanced Map Service
 * Provides advanced map functionality including offline maps,
 * multiple map providers, caching, and advanced routing.
 */

import L from 'leaflet';
import 'leaflet-routing-machine';
import locationService from './LocationService';

// Map tile providers
const MAP_PROVIDERS = {
  openStreetMap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'OpenStreetMap'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>',
    name: 'Satellite'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Dark Mode'
  },
  googleStreets: {
    url: 'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    name: 'Google Streets'
  },
  googleHybrid: {
    url: 'http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    name: 'Google Hybrid'
  }
};

// Routing providers
const ROUTING_PROVIDERS = {
  osrm: {
    name: 'OSRM',
    serviceUrl: 'https://router.project-osrm.org/route/v1',
    profile: 'driving'
  },
  graphhopper: {
    name: 'GraphHopper',
    serviceUrl: 'https://graphhopper.com/api/1/route',
    profile: 'car'
  }
};

class MapService {
  constructor() {
    this.maps = new Map(); // Store multiple map instances
    this.routes = new Map(); // Store active routes
    this.cachedTiles = new Set(); // Track cached tiles
    this.offlineMode = false;
    this.defaultProvider = 'openStreetMap';
    this.defaultRoutingProvider = 'osrm';
    this.mapBounds = null; // Current map bounds for multitasking
    this.safetyZones = []; // Geofenced safety zones
    this.listeners = {
      route: [],
      safety: [],
      offline: []
    };
  }

  /**
   * Initialize a map instance
   */
  initMap(containerId, options = {}) {
    const {
      center = [20.5937, 78.9629], // Default to center of India
      zoom = 5,
      provider = this.defaultProvider,
      zoomControl = true,
      attributionControl = true,
      minZoom = 3,
      maxZoom = 18
    } = options;

    // Check if map already exists
    if (this.maps.has(containerId)) {
      return this.maps.get(containerId);
    }

    // Create map instance
    const map = L.map(containerId, {
      center,
      zoom,
      zoomControl,
      attributionControl,
      minZoom,
      maxZoom,
      preferCanvas: true // Better performance
    });

    // Add tile layer
    const providerConfig = MAP_PROVIDERS[provider] || MAP_PROVIDERS.openStreetMap;
    const tileLayer = L.tileLayer(providerConfig.url, {
      attribution: providerConfig.attribution,
      subdomains: providerConfig.subdomains || ['a', 'b', 'c'],
      maxZoom,
      minZoom
    }).addTo(map);

    // Store map instance
    this.maps.set(containerId, {
      map,
      tileLayer,
      markers: new Map(),
      circles: new Map(),
      polygons: new Map(),
      provider
    });

    // Set up offline tile caching
    this.setupTileCaching(map, tileLayer);

    // Listen for bounds changes
    map.on('moveend', () => {
      this.mapBounds = map.getBounds();
      this.checkSafetyZones(map);
    });

    return this.maps.get(containerId);
  }

  /**
   * Set up tile caching for offline use
   */
  setupTileCaching(map, tileLayer) {
    // Listen for tile load events
    tileLayer.on('tileload', (event) => {
      const tile = event.tile;
      const tileUrl = tile.src;

      // Cache the tile if not already cached
      if (!this.cachedTiles.has(tileUrl) && !this.offlineMode) {
        this.cacheTile(tileUrl).then(() => {
          this.cachedTiles.add(tileUrl);
        }).catch(error => {
          console.error('Failed to cache tile:', error);
        });
      }
    });

    // Override tile loading to use cached tiles when offline
    const originalTileLoad = tileLayer._loadTile;
    tileLayer._loadTile = (tile, tilePoint) => {
      if (this.offlineMode) {
        // Try to load from cache first
        const tileUrl = tileLayer.getTileUrl(tilePoint);
        this.getCachedTile(tileUrl).then(cachedUrl => {
          if (cachedUrl) {
            tile.src = cachedUrl;
            tile.onload = function() {
              tile.loaded = true;
              tileLayer._tileLoaded();
            };
          } else {
            // Fall back to original loading if not cached
            originalTileLoad.call(tileLayer, tile, tilePoint);
          }
        }).catch(() => {
          // Fall back to original loading if cache fails
          originalTileLoad.call(tileLayer, tile, tilePoint);
        });
      } else {
        // Normal loading when online
        originalTileLoad.call(tileLayer, tile, tilePoint);
      }
    };
  }

  /**
   * Cache a tile for offline use
   */
  async cacheTile(url) {
    if (!('caches' in window)) {
      return Promise.reject('Cache API not supported');
    }

    try {
      const cache = await caches.open('map-tiles-cache');
      await cache.add(url);
      return url;
    } catch (error) {
      console.error('Error caching tile:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Get a cached tile
   */
  async getCachedTile(url) {
    if (!('caches' in window)) {
      return Promise.reject('Cache API not supported');
    }

    try {
      const cache = await caches.open('map-tiles-cache');
      const response = await cache.match(url);
      
      if (response) {
        return URL.createObjectURL(await response.blob());
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached tile:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Toggle offline mode
   */
  toggleOfflineMode(enabled) {
    this.offlineMode = enabled;
    
    // Notify listeners
    this.notifyListeners('offline', { offlineMode: enabled });
    
    // Refresh all maps
    this.maps.forEach(({ map }) => {
      map.invalidateSize();
    });
    
    return this.offlineMode;
  }

  /**
   * Change map provider
   */
  changeMapProvider(containerId, provider) {
    const mapData = this.maps.get(containerId);
    if (!mapData) return null;

    const { map, tileLayer } = mapData;
    const providerConfig = MAP_PROVIDERS[provider] || MAP_PROVIDERS.openStreetMap;

    // Remove current tile layer
    map.removeLayer(tileLayer);

    // Add new tile layer
    const newTileLayer = L.tileLayer(providerConfig.url, {
      attribution: providerConfig.attribution,
      subdomains: providerConfig.subdomains || ['a', 'b', 'c'],
      maxZoom: map.getMaxZoom(),
      minZoom: map.getMinZoom()
    }).addTo(map);

    // Update map data
    mapData.tileLayer = newTileLayer;
    mapData.provider = provider;

    // Set up tile caching for new layer
    this.setupTileCaching(map, newTileLayer);

    return mapData;
  }

  /**
   * Add a marker to the map
   */
  addMarker(containerId, position, options = {}) {
    const mapData = this.maps.get(containerId);
    if (!mapData) return null;

    const { map, markers } = mapData;
    const {
      icon = null,
      popup = null,
      tooltip = null,
      draggable = false,
      id = Date.now().toString(),
      zIndexOffset = 0,
      opacity = 1.0,
      clickable = true
    } = options;

    // Create marker
    const marker = L.marker(position, {
      icon,
      draggable,
      zIndexOffset,
      opacity,
      clickable
    }).addTo(map);

    // Add popup if provided
    if (popup) {
      marker.bindPopup(popup);
    }

    // Add tooltip if provided
    if (tooltip) {
      marker.bindTooltip(tooltip);
    }

    // Store marker
    markers.set(id, marker);

    return { id, marker };
  }

  /**
   * Update marker position
   */
  updateMarkerPosition(containerId, markerId, position, options = {}) {
    const mapData = this.maps.get(containerId);
    if (!mapData) return false;

    const { markers } = mapData;
    const marker = markers.get(markerId);
    if (!marker) return false;

    const { animate = true, duration = 1000 } = options;

    if (animate) {
      // Animate marker movement
      this.animateMarkerMovement(marker, position, duration);
    } else {
      // Instant update
      marker.setLatLng(position);
    }

    return true;
  }

  /**
   * Animate marker movement
   */
  animateMarkerMovement(marker, newPosition, duration) {
    const startPosition = marker.getLatLng();
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Interpolate position
      const lat = startPosition.lat + (newPosition[0] - startPosition.lat) * easeProgress;
      const lng = startPosition.lng + (newPosition[1] - startPosition.lng) * easeProgress;
      
      marker.setLatLng([lat, lng]);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  /**
   * Remove a marker from the map
   */
  removeMarker(containerId, markerId) {
    const mapData = this.maps.get(containerId);
    if (!mapData) return false;

    const { map, markers } = mapData;
    const marker = markers.get(markerId);
    if (!marker) return false;

    map.removeLayer(marker);
    markers.delete(markerId);

    return true;
  }

  /**
   * Calculate and display a route
   */
  calculateRoute(containerId, from, to, options = {}) {
    const mapData = this.maps.get(containerId);
    if (!mapData) return null;

    const { map } = mapData;
    const {
      provider = this.defaultRoutingProvider,
      fitBounds = true,
      showMarkers = false,
      routeId = Date.now().toString(),
      color = '#3388ff',
      weight = 5,
      opacity = 0.7,
      alternatives = true,
      onCalculated = null
    } = options;

    // Get routing provider config
    const providerConfig = ROUTING_PROVIDERS[provider] || ROUTING_PROVIDERS.osrm;

    // Create routing control
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(from[0], from[1]),
        L.latLng(to[0], to[1])
      ],
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
        timeout: 15000
      })
    }).addTo(map);

    // Store route
    this.routes.set(routeId, {
      control: routingControl,
      from,
      to,
      containerId
    });

    // Listen for route calculation
    routingControl.on('routesfound', (e) => {
      const routes = e.routes;
      const summary = routes[0].summary;
      
      const routeInfo = {
        distance: summary.totalDistance,
        duration: summary.totalTime,
        coordinates: routes[0].coordinates,
        instructions: routes[0].instructions,
        alternatives: routes.slice(1).map(route => ({
          distance: route.summary.totalDistance,
          duration: route.summary.totalTime,
          coordinates: route.coordinates
        }))
      };
      
      // Notify route listeners
      this.notifyListeners('route', {
        routeId,
        routeInfo
      });
      
      // Call onCalculated callback if provided
      if (typeof onCalculated === 'function') {
        onCalculated(routeInfo);
      }
    });

    return routeId;
  }

  /**
   * Remove a route from the map
   */
  removeRoute(routeId) {
    const route = this.routes.get(routeId);
    if (!route) return false;

    const { control, containerId } = route;
    const mapData = this.maps.get(containerId);
    if (!mapData) return false;

    const { map } = mapData;
    map.removeControl(control);
    this.routes.delete(routeId);

    return true;
  }

  /**
   * Add a safety zone (geofence)
   */
  addSafetyZone(options = {}) {
    const {
      center,
      radius = 500, // meters
      name = 'Safety Zone',
      color = '#ff4081',
      fillColor = '#ff4081',
      fillOpacity = 0.2,
      id = Date.now().toString(),
      type = 'safe' // 'safe' or 'danger'
    } = options;

    const safetyZone = {
      id,
      center,
      radius,
      name,
      color,
      fillColor,
      fillOpacity,
      type,
      active: true
    };

    this.safetyZones.push(safetyZone);

    // Add circle to all maps
    this.maps.forEach(({ map, circles }) => {
      const circle = L.circle(center, {
        radius,
        color,
        fillColor,
        fillOpacity,
        weight: 2
      }).addTo(map);

      circle.bindTooltip(name);
      circles.set(id, circle);
    });

    // Check if any maps are currently in this zone
    this.checkSafetyZones();

    return safetyZone;
  }

  /**
   * Remove a safety zone
   */
  removeSafetyZone(id) {
    const index = this.safetyZones.findIndex(zone => zone.id === id);
    if (index === -1) return false;

    // Remove zone from list
    this.safetyZones.splice(index, 1);

    // Remove circles from all maps
    this.maps.forEach(({ map, circles }) => {
      const circle = circles.get(id);
      if (circle) {
        map.removeLayer(circle);
        circles.delete(id);
      }
    });

    return true;
  }

  /**
   * Check if a position is within any safety zones
   */
  checkPosition(position) {
    const results = [];

    for (const zone of this.safetyZones) {
      if (!zone.active) continue;

      const distance = this.calculateDistance(
        position[0], position[1],
        zone.center[0], zone.center[1]
      );

      const isInside = distance <= zone.radius;
      
      if (isInside) {
        results.push({
          zone,
          distance,
          isInside
        });
      }
    }

    return results;
  }

  /**
   * Check all safety zones against current map bounds
   */
  checkSafetyZones(specificMap = null) {
    if (!this.mapBounds && !specificMap) return;

    // Get current position from location service
    const position = locationService.lastPosition;
    if (!position) return;

    const currentPosition = [position.latitude, position.longitude];
    const zoneResults = this.checkPosition(currentPosition);

    // Notify safety listeners
    if (zoneResults.length > 0) {
      this.notifyListeners('safety', {
        position: currentPosition,
        zones: zoneResults
      });
    }
  }

  /**
   * Calculate distance between two points in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = 
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
    // Remove all maps
    this.maps.forEach(({ map }) => {
      map.remove();
    });
    
    this.maps.clear();
    this.routes.clear();
    this.safetyZones = [];
    
    // Clear all listeners
    Object.keys(this.listeners).forEach(type => {
      this.listeners[type] = [];
    });
  }
}

// Create singleton instance
const mapService = new MapService();
export default mapService;
