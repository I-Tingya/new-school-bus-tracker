/**
 * Google Maps Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com
 * 2. Create a new project or select existing
 * 3. Enable "Maps JavaScript API" and "Distance Matrix API"
 * 4. Create API Key (Credentials > Create Credentials > API Key)
 * 5. Add your domain to the API Key's restrictions
 * 6. Paste the key below or add to .env.local
 */

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const DEFAULT_MAP_CENTER = {
  lat: 40.7128,  // New York City (replace with your default location)
  lng: -74.0060
};

export const DEFAULT_MAP_ZOOM = 13;

export const BUS_MARKER_ICON = {
  path: 'M 12 2 L 20 6 L 20 18 C 20 19.1 19.1 20 18 20 L 6 20 C 4.9 20 4 19.1 4 18 L 4 6 L 12 2 Z',
  fillColor: '#FF5722',
  fillOpacity: 1,
  strokeColor: '#FFFFFF',
  strokeWeight: 2,
  scale: 1.5
};

export const STOP_MARKER_ICON = {
  fillColor: '#4CAF50',
  fillOpacity: 1,
  strokeColor: '#FFFFFF',
  strokeWeight: 2,
  scale: 8
};

export const ROUTE_POLYLINE_OPTIONS = {
  strokeColor: '#2196F3',
  strokeOpacity: 0.8,
  strokeWeight: 3,
  geodesic: true,
  clickable: false,
  editable: false,
  draggable: false
};

/**
 * Color for bus status
 */
export const BUS_STATUS_COLORS = {
  active: '#FF5722',      // Orange/Red
  inactive: '#9E9E9E',    // Gray
  idle: '#2196F3',        // Blue
  sos: '#FF0000'          // Red
};
