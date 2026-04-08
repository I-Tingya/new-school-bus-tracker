/**
 * Utility functions for Parent App map features
 * Includes ETA calculation, distance formatting, and geofencing
 */

import { Coordinates } from 'shared-types';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  from: Coordinates,
  to: Coordinates
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (to.latitude - from.latitude) * (Math.PI / 180);
  const dLng = (to.longitude - from.longitude) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.latitude * (Math.PI / 180)) *
      Math.cos(to.latitude * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Fetch ETA from Google Distance Matrix API
 * Uses fastest route estimation
 */
export const fetchETA = async (
  from: Coordinates,
  to: Coordinates
) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${from.latitude},${from.longitude}&` +
      `destinations=${to.latitude},${to.longitude}&` +
      `mode=driving&` +
      `key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (
      data.status === 'OK' &&
      data.rows?.[0]?.elements?.[0]?.status === 'OK'
    ) {
      const element = data.rows[0].elements[0];
      return {
        distanceMeters: element.distance.value,
        durationSeconds: element.duration.value,
        distanceText: element.distance.text,
        durationText: element.duration.text
      };
    }

    return null;
  } catch (error) {
    console.error('ETA fetch error:', error);
    return null;
  }
};

/**
 * Format time in seconds to readable string
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.ceil(seconds / 60);

  if (minutes < 1) return 'Less than a minute';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours}h ${mins}m`;
};

/**
 * Format distance in meters to readable string
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Check if device is within geofence radius of a coordinate
 */
export const isWithinGeofence = (
  currentLocation: Coordinates,
  center: Coordinates,
  radiusMeters: number = 100
): boolean => {
  const distanceKm = calculateDistance(currentLocation, center);
  return distanceKm * 1000 <= radiusMeters;
};

/**
 * Calculate bearing between two coordinates (for directional info)
 * Returns angle in degrees (0-360)
 */
export const calculateBearing = (
  from: Coordinates,
  to: Coordinates
): number => {
  const dLng = to.longitude - from.longitude;
  const y = Math.sin(dLng * (Math.PI / 180)) * Math.cos(to.latitude * (Math.PI / 180));
  const x =
    Math.cos(from.latitude * (Math.PI / 180)) *
    Math.sin(to.latitude * (Math.PI / 180)) -
    Math.sin(from.latitude * (Math.PI / 180)) *
    Math.cos(to.latitude * (Math.PI / 180)) *
    Math.cos(dLng * (Math.PI / 180));

  const bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
};

/**
 * Get cardinal direction from bearing
 */
export const getCardinalDirection = (bearing: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
};
