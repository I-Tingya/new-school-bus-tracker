/**
 * Utility functions for Driver App map features
 * Includes distance calculation, next stop logic, and route navigation
 */

import { Coordinates, Stop, RouteWithStops } from 'shared-types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export const calculateDistance = (
  from: Coordinates,
  to: Coordinates
): number => {
  const R = 6371000; // Earth's radius in meters
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
 * Find the next stop based on current location
 * Assumes stops are in sequence order
 */
export const findNextStop = (
  currentLocation: Coordinates,
  stops: Stop[],
  currentStopIndex: number = 0,
  proximityThresholdMeters: number = 200
): { nextStop: Stop; nextStopIndex: number; distanceToNext: number } | null => {
  if (!stops || stops.length === 0) return null;

  let nextIndex = currentStopIndex;

  // Auto-advance to next stop if within proximity threshold
  while (nextIndex < stops.length - 1) {
    const distanceToCurrent = calculateDistance(
      currentLocation,
      stops[nextIndex]
    );
    if (distanceToNext < proximityThresholdMeters) {
      nextIndex++;
    } else {
      break;
    }
  }

  const nextStop = stops[nextIndex];
  const distanceToNext = calculateDistance(currentLocation, nextStop);

  return { nextStop, nextStopIndex: nextIndex, distanceToNext };
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
 * Estimate time to reach destination based on average speed
 * Returns minutes
 */
export const estimateTimeToDestination = (
  distanceMeters: number,
  averageSpeedMps: number = 10 // ~36 km/h average bus speed
): number => {
  return Math.ceil((distanceMeters / averageSpeedMps) / 60);
};

/**
 * Check if location is approaching a stop (within threshold)
 */
export const isApproachingStop = (
  currentLocation: Coordinates,
  stop: Stop,
  approachThresholdMeters: number = 500
): boolean => {
  return calculateDistance(currentLocation, stop) <= approachThresholdMeters;
};

/**
 * Check if location is at a stop (very close)
 */
export const isAtStop = (
  currentLocation: Coordinates,
  stop: Stop,
  arrivalThresholdMeters: number = 100
): boolean => {
  return calculateDistance(currentLocation, stop) <= arrivalThresholdMeters;
};

/**
 * Calculate the completion percentage of a route
 */
export const getRouteProgress = (
  currentStopIndex: number,
  totalStops: number
): number => {
  if (totalStops === 0) return 0;
  return Math.min(100, Math.round((currentStopIndex / totalStops) * 100));
};

/**
 * Get remaining stops in route
 */
export const getRemainingStops = (
  stops: Stop[],
  currentStopIndex: number
): number => {
  return Math.max(0, stops.length - currentStopIndex - 1);
};

/**
 * Calculate total route distance
 */
export const calculateTotalRouteDistance = (stops: Stop[]): number => {
  if (stops.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    totalDistance += calculateDistance(stops[i], stops[i + 1]);
  }
  return totalDistance;
};

/**
 * Get friendly route summary
 */
export const getRouteSummary = (route: RouteWithStops): string => {
  const distance = calculateTotalRouteDistance(route.stops);
  const distanceKm = (distance / 1000).toFixed(1);
  return `${route.name} • ${route.stops.length} stops • ${distanceKm} km`;
};
