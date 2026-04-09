import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Linking, TouchableOpacity } from 'react-native';
import { BusMarker, Coordinates, RouteWithStops, ETAInfo } from 'shared-types';

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
  } catch (error) {
    console.warn('react-native-maps not available:', error);
  }
}


interface ParentMapProps {
  busLocation?: BusMarker;
  studentRoute?: RouteWithStops;
  eta?: ETAInfo;
  isTracking?: boolean;
  studentName?: string;
}

export const ParentMap: React.FC<ParentMapProps> = ({
  busLocation,
  studentRoute,
  eta,
  isTracking = false,
  studentName
}) => {
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  // Auto-center on bus location when it updates
  useEffect(() => {
    if (busLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: Number(busLocation.latitude),
        longitude: Number(busLocation.longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 500);
    }
  }, [busLocation]);

  const formatETA = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 1) return 'Arriving';
    if (minutes === 1) return 'In 1 minute';
    return `In ${minutes} minutes`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.webMapContainer}>
        <View style={styles.webMapContent}>
          {busLocation ? (
            <>
              {studentRoute && studentRoute.stops.length > 0 && (
                <Text style={[styles.webMapCoords, { marginTop: 12, fontSize: 12, color: '#666' }]}>
                  Route tracking active. ETA: {eta ? formatETA(eta.durationSeconds) : 'Calculating...'}
                </Text>
              )}
              <TouchableOpacity 
                style={styles.webMapButton}
                onPress={() => {
                  const origin = `${busLocation.latitude},${busLocation.longitude}`;
                  const url = `https://www.google.com/maps/search/?api=1&query=${origin}`;
                  Linking.openURL(url);
                }}
              >
                <Text style={styles.webMapButtonText}>View on Google Maps</Text>
              </TouchableOpacity>
              <Text style={[styles.webMapCoords, { marginTop: 16, fontSize: 12, color: '#999' }]}>
                View the live GPS location of the bus!
              </Text>
            </>
          ) : (
            <>
              <ActivityIndicator color="#2196F3" size="large" />
              <Text style={styles.webMapCoords}>Waiting for bus to start...</Text>
            </>
          )}
        </View>
      </View>

      {/* Top Status Badge */}
      <View style={styles.statusBadge}>
        <View style={[
          styles.statusPulse,
          isTracking ? styles.trackingActive : styles.trackingInactive
        ]} />
        <Text style={styles.statusBadgeText}>
          {isTracking ? 'Tracking Live' : 'Bus Not Active'}
        </Text>
      </View>

      {/* Bottom Info Panel */}
      <View style={styles.infoPanel}>
        {!busLocation ? (
          <View style={styles.noTrackingContainer}>
            <Text style={styles.noTrackingText}>📍 Waiting for bus to start route...</Text>
          </View>
        ) : (
          <>
            <View style={styles.student}>
              <Text style={styles.studentLabel}>Student</Text>
              <Text style={styles.studentName}>{studentName || 'Child'}</Text>
            </View>

            {studentRoute && (
              <View style={styles.routeSection}>
                <Text style={styles.routeName}>{studentRoute.name}</Text>
                <Text style={styles.routeStats}>
                  {studentRoute.stops.length} stops • Live tracking
                </Text>
              </View>
            )}

            {eta && (
              <View style={styles.etaSection}>
                <View style={styles.etaBox}>
                  <Text style={styles.etaLabel}>Estimated Arrival</Text>
                  <Text style={styles.etaTime}>{formatETA(eta.durationSeconds)}</Text>
                  <Text style={styles.etaDistance}>{eta.distanceText}</Text>
                </View>
              </View>
            )}

            <View style={styles.locationInfo}>
              <Text style={styles.coordinatesLabel}>Bus Location</Text>
              <Text style={styles.coordinates}>
                {busLocation.latitude.toFixed(4)}° N, {Math.abs(busLocation.longitude).toFixed(4)}° W
              </Text>
              <Text style={styles.lastUpdate}>
                Last updated: {new Date(busLocation.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  map: {
    flex: 1
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10
  },
  statusPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  trackingActive: {
    backgroundColor: '#10B981'
  },
  trackingInactive: {
    backgroundColor: '#94A3B8'
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151'
  },
  busMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6
  },
  busEmoji: {
    fontSize: 20
  },
  stopMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3
  },
  startStopMarker: {
    backgroundColor: '#2196F3'
  },
  stopMarkerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  infoPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  noTrackingContainer: {
    alignItems: 'center',
    paddingVertical: 20
  },
  noTrackingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500'
  },
  student: {
    marginBottom: 12
  },
  studentLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B'
  },
  routeSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  routeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2
  },
  routeStats: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500'
  },
  etaSection: {
    marginBottom: 12
  },
  etaBox: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9'
  },
  etaLabel: {
    fontSize: 10,
    color: '#0EA5E9',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  etaTime: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0C4A6E',
    marginBottom: 2
  },
  etaDistance: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '500'
  },
  locationInfo: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  coordinatesLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  coordinates: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'monospace',
    fontWeight: '500',
    marginBottom: 2
  },
  lastUpdate: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500'
  },
  debugZoomPanel: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    padding: 8,
    zIndex: 99
  },
  debugZoomButton: {
    padding: 10,
    backgroundColor: '#0EA5E9',
    color: '#fff',
    fontWeight: 'bold',
    marginVertical: 4,
    borderRadius: 6,
    textAlign: 'center'
  },
  webMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    padding: 24,
  },
  webMapContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  webMapCoords: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  webMapButton: {
    backgroundColor: '#141414',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  webMapButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  }
});
