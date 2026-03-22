import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { LocationUpdate } from 'shared-types';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [liveLocation, setLiveLocation] = useState<LocationUpdate | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveLocation({
        driverId: 'drv-123',
        tripId: 'trip-abc',
        latitude: 40.7128 + (Math.random() * 0.01),
        longitude: -74.0060 + (Math.random() * 0.01),
        timestamp: new Date().toISOString()
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* MAP BACKGROUND MOCK */}
      <View style={styles.mapMock}>
        {liveLocation ? (
          <View style={styles.busMarker}>
            <Text style={styles.busMarkerIcon}>🚌</Text>
          </View>
        ) : (
          <Text style={styles.mapPlaceholderText}>Locating Bus...</Text>
        )}
      </View>

      {/* HEADER OVERLAY */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tracking</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* BOTTOM SHEET */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        
        <Text style={styles.etaText}>
          {liveLocation ? 'Arriving in 4 mins' : 'Waiting for broadcast...'}
        </Text>
        <Text style={styles.statusSubText}>Morning Pickup • John Doe</Text>

        <View style={styles.divider} />

        <View style={styles.busInfoRow}>
          <View style={styles.driverAvatar}>
            <Text>👤</Text>
          </View>
          <View style={styles.busDetails}>
            <Text style={styles.driverName}>Michael Scott</Text>
            <Text style={styles.plateNumber}>Bus #42 • Plate XYZ-123</Text>
          </View>
          <TouchableOpacity style={styles.actionCircle}>
            <Text>📞</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E7EB' },
  mapMock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  busMarker: {
    width: 50, height: 50, backgroundColor: 'white', borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
  },
  busMarkerIcon: { fontSize: 24 },
  mapPlaceholderText: { color: '#9CA3AF', fontWeight: 'bold' },
  
  headerOverlay: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10, position: 'absolute', top: 40, width: '100%',
  },
  menuButton: {
    width: 40, height: 40, backgroundColor: 'white', borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
  },
  menuIcon: { fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  bottomSheet: {
    position: 'absolute', bottom: 0, width: '100%',
    backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  etaText: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 4 },
  statusSubText: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },
  busInfoRow: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: {
    width: 48, height: 48, backgroundColor: '#F3F4F6', borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  busDetails: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  plateNumber: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  actionCircle: {
    width: 48, height: 48, backgroundColor: '#F3F4F6', borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  }
});
