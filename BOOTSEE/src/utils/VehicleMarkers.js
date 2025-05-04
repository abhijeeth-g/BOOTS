/**
 * Vehicle Markers Utility
 * Provides professional marker icons for different vehicle types
 * Using embedded SVG data to avoid CORS and loading issues
 */

import L from "leaflet";

// SVG icons embedded as data URLs to avoid CORS issues
const VEHICLE_ICONS = {
  // Cars
  car: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNjZGRiI+PHBhdGggZD0iTTIxLDEwLjVsLTEuMzgtNS40M0EzLDMsMCwwLDAsMTYuNzEsM0g3LjI5QTMsMywwLDAsMCw0LjM4LDUuMDdMMyxMTAuNWEzLDMsMCwwLDAsMyAzLjVoMXYzYTEsMSwwLDAsMCwxLDFoMmExLDEsMCwwLDAsMS0xVjE0aDR2M2ExLDEsMCwwLDAsMS0xVjE0aDFhMywzLDAsMCwwLDMtMy41Wk02LjgzLDYuMjRhMSwxLDAsMCwxLC45My0uNzRoOC40OGExLDEsMCwwLDEsLjkzLjc0TDE4LDEwSDZaIi8+PC9zdmc+",
  sedan: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNjZGRiI+PHBhdGggZD0iTTIxLDEwLjVsLTEuMzgtNS40M0EzLDMsMCwwLDAsMTYuNzEsM0g3LjI5QTMsMywwLDAsMCw0LjM4LDUuMDdMMyxMTAuNWEzLDMsMCwwLDAsMyAzLjVoMXYzYTEsMSwwLDAsMCwxLDFoMmExLDEsMCwwLDAsMS0xVjE0aDR2M2ExLDEsMCwwLDAsMS0xVjE0aDFhMywzLDAsMCwwLDMtMy41Wk02LjgzLDYuMjRhMSwxLDAsMCwxLC45My0uNzRoOC40OGExLDEsMCwwLDEsLjkzLjc0TDE4LDEwSDZaIi8+PC9zdmc+",
  suv: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNTVDQyI+PHBhdGggZD0iTTIxLDEwLjVsLTEuMzgtNS40M0EzLDMsMCwwLDAsMTYuNzEsM0g3LjI5QTMsMywwLDAsMCw0LjM4LDUuMDdMMyxMTAuNWEzLDMsMCwwLDAsMyAzLjVoMXYzYTEsMSwwLDAsMCwxLDFoMmExLDEsMCwwLDAsMS0xVjE0aDR2M2ExLDEsMCwwLDAsMS0xVjE0aDFhMywzLDAsMCwwLDMtMy41Wk02LjgzLDYuMjRhMSwxLDAsMCwxLC45My0uNzRoOC40OGExLDEsMCwwLDEsLjkzLjc0TDE4LDEwSDZaIi8+PC9zdmc+",
  taxi: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGQ0MwMCI+PHBhdGggZD0iTTIxLDEwLjVsLTEuMzgtNS40M0EzLDMsMCwwLDAsMTYuNzEsM0g3LjI5QTMsMywwLDAsMCw0LjM4LDUuMDdMMyxMTAuNWEzLDMsMCwwLDAsMyAzLjVoMXYzYTEsMSwwLDAsMCwxLDFoMmExLDEsMCwwLDAsMS0xVjE0aDR2M2ExLDEsMCwwLDAsMS0xVjE0aDFhMywzLDAsMCwwLDMtMy41Wk02LjgzLDYuMjRhMSwxLDAsMCwxLC45My0uNzRoOC40OGExLDEsMCwwLDEsLjkzLjc0TDE4LDEwSDZaIi8+PC9zdmc+",

  // Two-wheelers
  bike: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGNDVBNiI+PHBhdGggZD0iTTE1LjUsOEExLjUsMS41LDAsMSwwLDE0LDYuNSwxLjUsMS41LDAsMCwwLDE1LjUsOFptLTguMjUsMEg5LjVsMS41LDQuNUw2LjUsMTdIMy43NUEuNzUuNzUsMCwwLDEsMywxNi4yNWEuNzUuNzUsMCwwLDEsLjc1LS43NUg1LjI1TDksMTEuMjUsNy4yNSw4Wm0xMC41LDEuNWgtMUwxNS41LDEzLjVsLTIuMjUtNEgxMkwxNSwxNGwtMi4yNSw0aDEuNWwyLjI1LTRMMTksMThoMS41YS43NS43NSwwLDAsMCwuNzUtLjc1LjcuNywwLDAsMC0uNzUtLjc1SDIwTDE3Ljc1LDkuNVoiLz48L3N2Zz4=",
  motorcycle: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGNDVBNiI+PHBhdGggZD0iTTE1LjUsOEExLjUsMS41LDAsMSwwLDE0LDYuNSwxLjUsMS41LDAsMCwwLDE1LjUsOFptLTguMjUsMEg5LjVsMS41LDQuNUw2LjUsMTdIMy43NUEuNzUuNzUsMCwwLDEsMywxNi4yNWEuNzUuNzUsMCwwLDEsLjc1LS43NUg1LjI1TDksMTEuMjUsNy4yNSw4Wm0xMC41LDEuNWgtMUwxNS41LDEzLjVsLTIuMjUtNEgxMkwxNSwxNGwtMi4yNSw0aDEuNWwyLjI1LTRMMTksMThoMS41YS43NS43NSwwLDAsMCwuNzUtLjc1LjcuNywwLDAsMC0uNzUtLjc1SDIwTDE3Ljc1LDkuNVoiLz48L3N2Zz4=",
  scooter: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGNDVBNiI+PHBhdGggZD0iTTcuNSwyMmE0LjUsNC41LDAsMSwxLDQuNS00LjVBNC41LDQuNSwwLDAsMSw3LjUsMjJabTAtN0EyLjUsMi41LDAsMSwwLDEwLDE3LjUsMi41LDIuNSwwLDAsMCw3LjUsMTVabTksMGE0LjUsNC41LDAsMSwxLDQuNS00LjVBNC41LDQuNSwwLDAsMSwxNi41LDE1Wm0wLTdBMi41LDIuNSwwLDEsMCwxOSwxMC41LDIuNSwyLjUsMCwwLDAsMTYuNSw4Wk0xMCw3VjVIMTJWM0g4VjdaIi8+PC9zdmc+",

  // Other vehicles
  auto: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGQTUwMCI+PHBhdGggZD0iTTIxLDEwLjVsLTEuMzgtNS40M0EzLDMsMCwwLDAsMTYuNzEsM0g3LjI5QTMsMywwLDAsMCw0LjM4LDUuMDdMMyxMMS41YTMsMywwLDAsMCwzLDMuNWgxdjNhMSwxLDAsMCwwLDEsMWgyYTEsMSwwLDAsMCwxLTFWMTVoNHYzYTEsMSwwLDAsMCwxLTFWMTVoMWEzLDMsMCwwLDAsMy0zLjVabS0xNC4xNy00LjI2YTEsMSwwLDAsMSwuOTMtLjc0aDguNDhhMSwxLDAsMCwxLC45My43NEwxOCwxMUg2WiIvPjwvc3ZnPg==",
  rickshaw: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGQTUwMCI+PHBhdGggZD0iTTIxLDEwLjVsLTEuMzgtNS40M0EzLDMsMCwwLDAsMTYuNzEsM0g3LjI5QTMsMywwLDAsMCw0LjM4LDUuMDdMMyxMMS41YTMsMywwLDAsMCwzLDMuNWgxdjNhMSwxLDAsMCwwLDEsMWgyYTEsMSwwLDAsMCwxLTFWMTVoNHYzYTEsMSwwLDAsMCwxLTFWMTVoMWEzLDMsMCwwLDAsMy0zLjVabS0xNC4xNy00LjI2YTEsMSwwLDAsMSwuOTMtLjc0aDguNDhhMSwxLDAsMCwxLC45My43NEwxOCwxMUg2WiIvPjwvc3ZnPg==",

  // Default/fallback
  default: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGMTQ5MyI+PHBhdGggZD0iTTE1LjUsOEExLjUsMS41LDAsMSwwLDE0LDYuNSwxLjUsMS41LDAsMCwwLDE1LjUsOFptLTguMjUsMEg5LjVsMS41LDQuNUw2LjUsMTdIMy43NUEuNzUuNzUsMCwwLDEsMywxNi4yNWEuNzUuNzUsMCwwLDEsLjc1LS43NUg1LjI1TDksMTEuMjUsNy4yNSw4Wm0xMC41LDEuNWgtMUwxNS41LDEzLjVsLTIuMjUtNEgxMkwxNSwxNGwtMi4yNSw0aDEuNWwyLjI1LTRMMTksMThoMS41YS43NS43NSwwLDAsMCwuNzUtLjc1LjcuNywwLDAsMC0uNzUtLjc1SDIwTDE3Ljc1LDkuNVoiLz48L3N2Zz4=",

  // User and destination
  user: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNjZGRiI+PHBhdGggZD0iTTEyLDJBMTAsMTAsMCwxLDAsMjIsMTIsMTAsMTAsMCwwLDAsMTIsMlptMCwxOGE4LDgsMCwxLDEsOC04QTgsOCwwLDAsMSwxMiwyMFptNC0xMWExLDEsMCwxLDEtMS0xQTEsMSwwLDAsMSwxNiw5Wk04LDlhMSwxLDAsMSwxLTEtMUExLDEsMCwwLDEsOCw5Wm04LDRIMTJhMSwxLDAsMCwxLTEtMUgxMWExLDEsMCwwLDEtMS0xSDhhMSwxLDAsMCwwLTEsMSw1LDUsMCwwLDAsMTAsMCwxLDEsMCwwLDAtMS0xWiIvPjwvc3ZnPg==",
  destination: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGMDAwMCI+PHBhdGggZD0iTTEyLDJBMTAsMTAsMCwxLDAsMjIsMTIsMTAsMTAsMCwwLDAsMTIsMlptMCwxOGE4LDgsMCwxLDEsOC04QTgsOCwwLDAsMSwxMiwyMFptMC0xMmE0LDQsMCwxLDAsNCw0QTQsNCwwLDAsMCwxMiw4Wm0wLDZhMiwyLDAsMSwxLDItMkEyLDIsMCwwLDEsMTIsMTRaIi8+PC9zdmc+"
};

// Fallback icons in case the CDN fails
const FALLBACK_ICONS = {
  car: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNjZGRiI+PHBhdGggZD0iTTIxLDEwLjVsLTEuMzgtNS40M0EzLDMsMCwwLDAsMTYuNzEsM0g3LjI5QTMsMywwLDAsMCw0LjM4LDUuMDdMMyxMTAuNWEzLDMsMCwwLDAsMyAzLjVoMXYzYTEsMSwwLDAsMCwxLDFoMmExLDEsMCwwLDAsMS0xVjE0aDR2M2ExLDEsMCwwLDAsMS0xVjE0aDFhMywzLDAsMCwwLDMtMy41Wk02LjgzLDYuMjRhMSwxLDAsMCwxLC45My0uNzRoOC40OGExLDEsMCwwLDEsLjkzLjc0TDE4LDEwSDZaTTcuNSwxM0E1LjUsNS41LDAsMSwxLDEzLDcuNSw1LjUsNS41LDAsMCwxLDcuNSwxM1ptMTEsMGE1LjUsNS41LDAsMSwxLDUuNS01LjVBNS41LDUuNSwwLDAsMSwxOC41LDEzWiIvPjwvc3ZnPg==",
  bike: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGNDVBNiI+PHBhdGggZD0iTTE1LjUsOEExLjUsMS41LDAsMSwwLDE0LDYuNSwxLjUsMS41LDAsMCwwLDE1LjUsOFptLTguMjUsMEg5LjVsMS41LDQuNUw2LjUsMTdIMy43NUEuNzUuNzUsMCwwLDEsMywxNi4yNWEuNzUuNzUsMCwwLDEsLjc1LS43NUg1LjI1TDksMTEuMjUsNy4yNSw4Wm0xMC41LDEuNWgtMUwxNS41LDEzLjVsLTIuMjUtNEgxMkwxNSwxNGwtMi4yNSw0aDEuNWwyLjI1LTRMMTksMThoMS41YS43NS43NSwwLDAsMCwuNzUtLjc1LjcuNywwLDAsMC0uNzUtLjc1SDIwTDE3Ljc1LDkuNVoiLz48L3N2Zz4=",
  scooter: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGNDVBNiI+PHBhdGggZD0iTTcuNSwyMmE0LjUsNC41LDAsMSwxLDQuNS00LjVBNC41LDQuNSwwLDAsMSw3LjUsMjJabTAtN0EyLjUsMi41LDAsMSwwLDEwLDE3LjUsMi41LDIuNSwwLDAsMCw3LjUsMTVabTksMGE0LjUsNC41LDAsMSwxLDQuNS00LjVBNC41LDQuNSwwLDAsMSwxNi41LDE1Wm0wLTdBMi41LDIuNSwwLDEsMCwxOSwxMC41LDIuNSwyLjUsMCwwLDAsMTYuNSw4Wk0xMCw3VjVIMTJWM0g4VjdaIi8+PC9zdmc+",
  auto: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGQTUwMCI+PHBhdGggZD0iTTIxLDEwLjVsLTEuMzgtNS40M0EzLDMsMCwwLDAsMTYuNzEsM0g3LjI5QTMsMywwLDAsMCw0LjM4LDUuMDdMMyxMMS41YTMsMywwLDAsMCwzLDMuNWgxdjNhMSwxLDAsMCwwLDEsMWgyYTEsMSwwLDAsMCwxLTFWMTVoNHYzYTEsMSwwLDAsMCwxLTFWMTVoMWEzLDMsMCwwLDAsMy0zLjVabS0xNC4xNy00LjI2YTEsMSwwLDAsMSwuOTMtLjc0aDguNDhhMSwxLDAsMCwxLC45My43NEwxOCwxMUg2WiIvPjwvc3ZnPg==",
  user: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNjZGRiI+PHBhdGggZD0iTTEyLDJBMTAsMTAsMCwxLDAsMjIsMTIsMTAsMTAsMCwwLDAsMTIsMlptMCwxOGE4LDgsMCwxLDEsOC04QTgsOCwwLDAsMSwxMiwyMFptNC0xMWExLDEsMCwxLDEtMS0xQTEsMSwwLDAsMSwxNiw5Wk04LDlhMSwxLDAsMSwxLTEtMUExLDEsMCwwLDEsOCw5Wm04LDRIMTJhMSwxLDAsMCwxLTEtMUgxMWExLDEsMCwwLDEtMS0xSDhhMSwxLDAsMCwwLTEsMSw1LDUsMCwwLDAsMTAsMCwxLDEsMCwwLDAtMS0xWiIvPjwvc3ZnPg==",
  destination: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGMDAwMCI+PHBhdGggZD0iTTEyLDJBMTAsMTAsMCwxLDAsMjIsMTIsMTAsMTAsMCwwLDAsMTIsMlptMCwxOGE4LDgsMCwxLDEsOC04QTgsOCwwLDAsMSwxMiwyMFptMC0xMmE0LDQsMCwxLDAsNCw0QTQsNCwwLDAsMCwxMiw4Wm0wLDZhMiwyLDAsMSwxLDItMkEyLDIsMCwwLDEsMTIsMTRaIi8+PC9zdmc+"
};

/**
 * Create a professional vehicle marker icon
 * @param {string} vehicleType - Type of vehicle (car, bike, scooter, etc.)
 * @param {number} size - Size of the icon in pixels
 * @param {boolean} animated - Whether to add animation effects
 * @returns {L.Icon} Leaflet icon object
 */
export const createVehicleIcon = (vehicleType = 'default', size = 36, animated = true) => {
  // Normalize vehicle type to lowercase
  const type = vehicleType.toLowerCase();

  // Get icon URL based on vehicle type
  const iconUrl = VEHICLE_ICONS[type] || VEHICLE_ICONS.default;

  // Create icon options
  const iconOptions = {
    iconUrl,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
    className: animated ? `vehicle-marker ${type}-marker animated` : `vehicle-marker ${type}-marker`
  };

  // Add shadow for certain vehicle types
  if (['car', 'sedan', 'suv', 'taxi', 'auto', 'rickshaw'].includes(type)) {
    iconOptions.shadowUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0icmdiYSgwLDAsMCwwLjMpIj48ZWxsaXBzZSBjeD0iMTIiIGN5PSIxMiIgcng9IjEwIiByeT0iNCIvPjwvc3ZnPg==';
    iconOptions.shadowSize = [size * 1.2, size * 0.4];
    iconOptions.shadowAnchor = [size/2, size/2];
  }

  // Create and return the icon
  try {
    return L.icon(iconOptions);
  } catch (error) {
    console.error("Error creating vehicle icon:", error);

    // Use fallback icon if available
    if (FALLBACK_ICONS[type]) {
      return L.icon({
        iconUrl: FALLBACK_ICONS[type],
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
        popupAnchor: [0, -size/2],
        className: animated ? `vehicle-marker ${type}-marker animated` : `vehicle-marker ${type}-marker`
      });
    }

    // Last resort: create a colored dot icon
    return createColoredDotIcon(getVehicleColor(type), size);
  }
};

/**
 * Create a colored dot icon (fallback)
 * @param {string} color - CSS color value
 * @param {number} size - Size of the dot in pixels
 * @returns {L.DivIcon} Leaflet div icon object
 */
export const createColoredDotIcon = (color, size = 24) => {
  return L.divIcon({
    className: 'colored-dot-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

/**
 * Get color associated with vehicle type
 * @param {string} vehicleType - Type of vehicle
 * @returns {string} CSS color value
 */
export const getVehicleColor = (vehicleType) => {
  const colors = {
    car: '#0066FF',
    sedan: '#0066FF',
    suv: '#0055CC',
    taxi: '#FFCC00',
    bike: '#FF45A6',
    motorcycle: '#FF45A6',
    scooter: '#FF45A6',
    auto: '#FFA500',
    rickshaw: '#FFA500',
    user: '#0066FF',
    destination: '#FF0000',
    default: '#FF1493'
  };

  return colors[vehicleType.toLowerCase()] || colors.default;
};

/**
 * Get appropriate icon size based on zoom level
 * @param {number} zoom - Map zoom level
 * @returns {number} Icon size in pixels
 */
export const getIconSizeByZoom = (zoom) => {
  if (zoom >= 18) return 48;
  if (zoom >= 16) return 42;
  if (zoom >= 14) return 36;
  if (zoom >= 12) return 32;
  if (zoom >= 10) return 28;
  return 24;
};

export default {
  createVehicleIcon,
  createColoredDotIcon,
  getVehicleColor,
  getIconSizeByZoom
};
