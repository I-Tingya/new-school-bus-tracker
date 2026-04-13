import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Platform, StyleSheet, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import { Coordinates, BusMarker, Student } from 'shared-types';

import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Coordinates, BusMarker, Student } from 'shared-types';

interface DriverMapProps {
  currentLocation?: Coordinates & BusMarker;
  tripStatus?: 'ACTIVE' | 'ENDED';
  students?: Student[];
}

export const DriverMap: React.FC<DriverMapProps> = ({
  currentLocation,
  tripStatus,
  students = []
}) => {
  const mapRef = useRef<MapView>(null);
  const lastAnimatedLoc = useRef<Coordinates | null>(null);

  // Auto-animate to current location
  useEffect(() => {
    if (currentLocation && mapRef.current && Platform.OS !== 'web') {
      const { latitude, longitude } = currentLocation;
      
      // Only animate if moved more than ~5 meters (approx 0.00005 deg)
      const last = lastAnimatedLoc.current;
      const movedEnough = !last || 
        Math.abs(last.latitude - latitude) > 0.00005 || 
        Math.abs(last.longitude - longitude) > 0.00005;

      if (movedEnough) {
        lastAnimatedLoc.current = { latitude, longitude };
        mapRef.current.animateCamera({
          center: { latitude, longitude },
          zoom: 16
        }, { duration: 800 });
      }
    }
  }, [currentLocation]);

  // Generate Google Maps URL with all stops as waypoints in route order
  const generateGoogleMapsUrl = () => {
    if (!currentLocation) return 'https://maps.google.com';

    const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
    
    // Debug: log what students we have
    console.log('GoogleMapsUrl Debug - Students received:', students.length);

    // Try using addresses first, fall back to coordinates
    let stops = students
      .filter(s => (s.address && s.address.trim()) || (s.latitude && s.longitude))
      .map(s => {
        if (s.address && s.address.trim()) {
          return encodeURIComponent(s.address.trim());
        } else if (s.latitude && s.longitude) {
          return `${s.latitude},${s.longitude}`;
        }
        return null;
      })
      .filter((stop): stop is string => stop !== null);

    if (stops.length === 0) {
      return `https://www.google.com/maps/search/${origin}`;
    }

    if (stops.length === 1) {
      const destination = stops[0];
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    }

    // Multiple stops: all but last are waypoints, last is destination
    const destination = stops[stops.length - 1];
    const waypoints = stops.slice(0, -1).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;
    return url;
  };

  const googleMapsUrl = generateGoogleMapsUrl();

  // Web fallback - show map location link
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webMapContainer}>
          <View style={styles.webMapContent}>
            {currentLocation ? (
              <>
                {students.filter(s => s.latitude && s.longitude).length > 0 && (
                  <Text style={[styles.webMapCoords, { marginTop: 12, fontSize: 12, color: '#666' }]}>
                    Route includes {students.filter(s => s.latitude && s.longitude).length} stop{students.filter(s => s.latitude && s.longitude).length !== 1 ? 's' : ''}
                  </Text>
                )}
                <TouchableOpacity 
                  style={styles.webMapButton}
                  onPress={() => Linking.openURL(googleMapsUrl)}
                >
                  <Text style={styles.webMapButtonText}>View on Google Maps</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ActivityIndicator color="#2196F3" size="large" />
                <Text style={styles.webMapCoords}>Waiting for GPS signal...</Text>
              </>
            )}
          </View>
        </View>

        {/* Bottom Info Panel */}
        <View style={styles.infoPanel}>
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot,
              tripStatus === 'ACTIVE' ? styles.statusActive : styles.statusInactive
            ]} />
            <Text style={styles.statusText}>
              {tripStatus === 'ACTIVE' ? 'On Route' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation?.latitude || 40.7128,
          longitude: currentLocation?.longitude || -74.0060,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        mapType="standard"
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title={`Bus #${currentLocation.busNumber}`}
            description="Current GPS Position"
          >
            <View style={styles.currentLocationMarker} />
          </Marker>
        )}
        
        {students.map((student, idx) => (
          student.latitude && student.longitude && (
            <Marker
              key={student.id || idx}
              coordinate={{
                latitude: student.latitude,
                longitude: student.longitude
              }}
              title={student.name}
              description={student.address || 'Student location'}
            >
              <View style={styles.studentMarker}>
                <Text style={styles.studentMarkerText}>👤</Text>
              </View>
            </Marker>
          )
        ))}
      </MapView>

      {/* Bottom Info Panel */}
      <View style={styles.infoPanel}>
        {!currentLocation && (
          <View style={styles.locatingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.locatingText}>Waiting for GPS signal...</Text>
          </View>
        )}

        {currentLocation && (
          <>
            <View style={styles.routeInfo}>
              <Text style={styles.routeName}>Bus #{currentLocation.busNumber}</Text>
              <Text style={styles.routeStats}>
                Position: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </Text>
            </View>
          </>
        )}

        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot,
            tripStatus === 'ACTIVE' ? styles.statusActive : styles.statusInactive
          ]} />
          <Text style={styles.statusText}>
            {tripStatus === 'ACTIVE' ? 'On Route' : 'Inactive'}
          </Text>
        </View>
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
  webMapEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  webMapTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  webMapCoords: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  webMapBus: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF5722',
    marginBottom: 24,
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
  },
  currentLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF5722',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5
  },
  studentMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5
  },
  studentMarkerText: {
    fontSize: 18,
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#111827'
  },
  webPlaceholderText: {
    color: '#F9FAFB',
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 26
  },
  infoPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  locatingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20
  },
  locatingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    marginBottom: 20
  },
  routeInfo: {
    marginBottom: 16
  },
  routeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4
  },
  routeStats: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500'
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  statusActive: {
    backgroundColor: '#10B981'
  },
  statusInactive: {
    backgroundColor: '#94A3B8'
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151'
  }
});
