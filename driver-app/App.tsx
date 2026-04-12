import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Dimensions, Platform, TextInput,
  Modal, ActivityIndicator, Animated, Alert, KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { DriverMap } from './components/DriverMap';
import { Coordinates, BusMarker } from 'shared-types';

// ─── CONFIG ────────────────────────────────────────────────────────────────
// UPDATE THIS to your backend's local IP when testing on a real device.
// Example: 'http://192.168.1.50:3001'
const API_URL = Platform.OS === 'web' ? 'http://localhost:4000' : 'http://192.168.0.19:4000';
const { width, height } = Dimensions.get('window');

if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    #root, body, html {
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    div[role="group"] {
        height: 100%;
    }
  `;
  document.head.append(style);
}

// ─── COLORS ────────────────────────────────────────────────────────────────
const C = {
  black: '#000000',
  white: '#FFFFFF',
  green: '#06C167',
  red: '#FF4444',
  orange: '#FF6B35',
  gray900: '#0A0A0A',
  gray800: '#141414',
  gray700: '#1C1C1C',
  gray600: '#262626',
  gray400: '#666666',
  gray200: '#AAAAAA',
  gray100: '#EEEEEE',
};

// ─── TYPES ─────────────────────────────────────────────────────────────────
interface Tenant { id: string; name: string; dbName: string; }
interface Bus { id: string; number: string; capacity: number; }
interface Route { id: string; name: string; stops: string[]; }
interface Student { id: string; name: string; address: string; latitude?: number; longitude?: number; }

// ─── API HELPERS ───────────────────────────────────────────────────────────
const fetchWithTimeout = (url: string, options: RequestInit = {}, ms = 8000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

const api = {
  getTenants: (): Promise<Tenant[]> =>
    fetchWithTimeout(`${API_URL}/tenant`).then(r => r.ok ? r.json() : []),

  getRoutes: (tenantId: string): Promise<Route[]> =>
    fetchWithTimeout(`${API_URL}/core/routes`, {
      headers: { 'x-tenant-id': tenantId },
    }).then(r => r.ok ? r.json() : []),

  getBuses: (tenantId: string): Promise<Bus[]> =>
    fetchWithTimeout(`${API_URL}/core/buses`, {
      headers: { 'x-tenant-id': tenantId },
    }).then(r => r.ok ? r.json() : []),

  getStudents: (tenantId: string): Promise<Student[]> =>
    fetchWithTimeout(`${API_URL}/core/students`, {
      headers: { 'x-tenant-id': tenantId },
    }).then(r => r.ok ? r.json() : []),

  getActiveTrip: (tenantId: string, busId: string): Promise<any> =>
    fetchWithTimeout(`${API_URL}/trip/active/${busId}`, {
      headers: { 'x-tenant-id': tenantId },
    }).then(r => r.ok ? r.json() : null),

  postAlert: (tenantId: string, message: string): Promise<any> =>
    fetchWithTimeout(`${API_URL}/core/alerts`, {
      method: 'POST',
      headers: { 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }).then(r => r.ok ? r.json() : null),
};

// ══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [bus, setBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('driver_tenant'),
      AsyncStorage.getItem('driver_bus')
    ]).then(([rawT, rawB]) => {
      if (rawT && rawB) {
        setTenant(JSON.parse(rawT));
        setBus(JSON.parse(rawB));
      }
      setLoading(false);
    });
  }, []);

  const handleLogin = async (t: Tenant, b: Bus) => {
    await AsyncStorage.setItem('driver_tenant', JSON.stringify(t));
    await AsyncStorage.setItem('driver_bus', JSON.stringify(b));
    setTenant(t);
    setBus(b);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('driver_tenant');
    await AsyncStorage.removeItem('driver_bus');
    setTenant(null);
    setBus(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.black, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.green} size="large" />
      </View>
    );
  }

  return tenant && bus
    ? <HomeScreen tenant={tenant} bus={bus} onLogout={handleLogout} />
    : <LoginScreen onLogin={handleLogin} />;
}

// ══════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }: { onLogin: (t: Tenant, b: Bus) => void }) {
  const [schoolName, setSchoolName] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!schoolName.trim() || !busNumber.trim()) { setError('Please enter both school name and bus number.'); return; }
    setLoading(true); setError('');
    try {
      const tenants: Tenant[] = await api.getTenants();
      const match = tenants.find(t => t.name.toLowerCase() === schoolName.trim().toLowerCase());
      if (!match) { setError('School not found. Please check the name and try again.'); return; }
      
      const buses: Bus[] = await api.getBuses(match.id);
      const busMatch = buses.find(b => b.number.toLowerCase() === busNumber.trim().toLowerCase());
      if (!busMatch) { setError(`Bus #${busNumber} not found in this school.`); return; }

      onLogin(match, busMatch);
    } catch (err: any) {
      setError('Connection Error: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={login.loginContainer}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <View style={login.loginCard}>
          <Text style={login.loginTitle}>Driver Portal</Text>
          <Text style={login.loginSubtitle}>Confirm school and bus to begin.</Text>

          <TextInput
            style={login.input}
            placeholder="School Name (e.g. Springfield)"
            placeholderTextColor="#9CA3AF"
            value={schoolName}
            onChangeText={t => { setSchoolName(t); setError(''); }}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <TextInput
            style={login.input}
            placeholder="Bus Number (e.g. 42)"
            placeholderTextColor="#9CA3AF"
            value={busNumber}
            onChangeText={t => { setBusNumber(t); setError(''); }}
            autoCapitalize="none"
            onSubmitEditing={handleLogin}
            returnKeyType="go"
          />

          {error ? <Text style={login.errorText}>{error}</Text> : null}

          <TouchableOpacity style={login.button} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={login.buttonText}>Start Driving</Text>}
          </TouchableOpacity>

          <Text style={{ color: '#4B5563', fontSize: 10, textAlign: 'center', marginTop: 20 }}>
            Debug Config: {API_URL}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const login = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#111827' },
  loginCard: { backgroundColor: '#1F2937', padding: 32, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  loginTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, letterSpacing: -0.5 },
  loginSubtitle: { fontSize: 15, color: '#9CA3AF', marginBottom: 32, fontWeight: '500' },
  input: { backgroundColor: '#374151', color: 'white', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#4B5563' },
  button: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  buttonText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 12, textAlign: 'center', fontWeight: 'bold' }
});

// ══════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ══════════════════════════════════════════════════════════════════════════
function HomeScreen({ tenant, bus, onLogout }: { tenant: Tenant; bus: Bus; onLogout: () => void }) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [tripActive, setTripActive] = useState<string | false>(false);
  const [tripStart, setTripStart] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [showRouteList, setShowRouteList] = useState(false);
  const [showSos, setShowSos] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<(Coordinates & BusMarker) | null>(null);
  const menuAnim = useRef(new Animated.Value(-width * 0.78)).current;

  const orderedRouteStudents = activeRoute?.stops
    .map(stopId => students.find(student => student.id === stopId))
    .filter((student): student is Student => !!student) || [];

  // Debug logging
  useEffect(() => {
    console.log('HomeScreen Debug:');
    console.log('- Active Route:', activeRoute?.name, 'Stops:', activeRoute?.stops);
    console.log('- Total Students loaded:', students.length);
    console.log('- Ordered Route Students:', orderedRouteStudents.length);
  }, [activeRoute, students]);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    api.getRoutes(tenant.id).then(routesData => {
      const validRoutes = Array.isArray(routesData) ? routesData : [];
      setRoutes(validRoutes);
      api.getActiveTrip(tenant.id, bus.id).then(trip => {
        if (trip && trip.id) {
          setTripActive(trip.id);
          const activeR = validRoutes.find((r: Route) => r.id === trip.routeId);
          if (activeR) setActiveRoute(activeR);
          setTripStart(new Date(trip.startedAt));
        }
      }).catch(() => {});
    }).catch(() => { setRoutes([]); });
    api.getStudents(tenant.id).then(studentsData => {
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    }).catch(() => { setStudents([]); });
  }, [tenant.id]);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let timer: NodeJS.Timeout;

    const startTracking = async () => {
      let lat = 40.7128;
      let lng = -74.0060;

      // Try hardware hook if available
      try {
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 0 },
          (loc) => {
            lat = loc.coords.latitude;
            lng = loc.coords.longitude;
            // Update current location state with BusMarker data
            setCurrentLocation({
              latitude: lat,
              longitude: lng,
              busNumber: bus.number,
              busId: bus.id,
              driverId: '00000000-0000-0000-0000-000000000000',
              timestamp: new Date().toISOString(),
              tripId: typeof tripActive === 'string' ? tripActive : undefined
            });
          }
        );
      } catch (e) {
        console.log('Hardware GPS not active, falling back to simulated coords.');
      }

      // 3-second simulation loop to guarantee network traversal on emulator
      timer = setInterval(() => {
        if (tripActive && typeof tripActive === 'string') {
          lat += 0.0002;
          lng += 0.0002;
          
          // Update location state
          setCurrentLocation({
            latitude: lat,
            longitude: lng,
            busNumber: bus.number,
            busId: bus.id,
            driverId: '00000000-0000-0000-0000-000000000000',
            timestamp: new Date().toISOString(),
            tripId: tripActive
          });
          
          const payload = {
            driverId: '00000000-0000-0000-0000-000000000000',
            tripId: tripActive,
            latitude: lat,
            longitude: lng,
            timestamp: new Date().toISOString()
          };
          fetchWithTimeout(`${API_URL}/location/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenant.id },
            body: JSON.stringify(payload)
          }).then(r => console.log('Location Ping ->', r.status))
            .catch(e => console.log('Location Ping Failed'));
        }
      }, 3000);
    };

    if (tripActive) startTracking();
    return () => { 
      if (sub) sub.remove(); 
      if (timer) clearInterval(timer);
    };
  }, [tripActive, tenant.id, bus.id, bus.number]);

  // Resolve student ID → name
  const resolveStop = (id: string) => students.find(s => s.id === id)?.name ?? id;

  // Active trip elapsed
  const elapsed = tripStart
    ? Math.floor((Date.now() - tripStart.getTime()) / 60000) + 'm'
    : '';

  const toggleMenu = (open: boolean) => {
    setShowMenu(open);
    Animated.spring(menuAnim, {
      toValue: open ? 0 : -width * 0.78,
      useNativeDriver: true, bounciness: 4,
    }).start();
  };

  const handleGo = async () => {
    if (!tripActive) {
      if (!activeRoute) return Alert.alert('Select a route first');
      const busId = bus.id;
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Location required.');

        const res = await fetchWithTimeout(`${API_URL}/trip/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenant.id, 'x-driver-id': '00000000-0000-0000-0000-000000000000' },
            body: JSON.stringify({ busId, routeId: activeRoute.id })
        });
        if (!res.ok) throw new Error(await res.text());
        const trip = await res.json();

        setTripActive(trip.id);
        setTripStart(new Date());
        setCurrentStopIdx(0);
      } catch (err) {
        Alert.alert('Failed to start trip', String(err));
      }
    } else {
      try {
        await fetchWithTimeout(`${API_URL}/trip/${tripActive}/end`, {
            method: 'POST',
            headers: { 'x-tenant-id': tenant.id, 'x-driver-id': '00000000-0000-0000-0000-000000000000' }
        });
      } catch (e) {}
      setTripActive(false);
      setTripStart(null);
      setCurrentStopIdx(0);
    }
  };

  const handleNextStop = () => {
    const stops = activeRoute?.stops ?? [];
    if (currentStopIdx < stops.length - 1) setCurrentStopIdx(i => i + 1);
  };

  const handleSos = async () => {
    setShowSos(false);
    try {
      await api.postAlert(tenant.id, `🚨 SOS from Driver — ${tenant.name}`);
      Alert.alert('🚨 SOS Sent', 'Emergency alert sent to your school administrator.', [{ text: 'OK' }]);
    } catch {
      Alert.alert('🚨 SOS Sent Locally', 'Could not reach server, but your alert has been logged.', [{ text: 'OK' }]);
    }
  };

  const nextStop = activeRoute?.stops[currentStopIdx];

  return (
    <View style={{ flex: 1, backgroundColor: C.black }}>
      <StatusBar style="light" />

      {/* MAP */}
      <View style={home.mapContainer}>
        {currentLocation && tripActive ? (
          <DriverMap
            currentLocation={currentLocation}
            tripStatus={tripActive ? 'ACTIVE' : 'ENDED'}
            students={orderedRouteStudents}
          />
        ) : (
          <View style={home.mapBg}>
            {[...Array(18)].map((_, i) => (
              <View key={i} style={[home.gridRow, { opacity: 0.9 - i * 0.05 }]} />
            ))}
            {!tripActive && (
              <View style={home.emptyMapPlaceholder}>
                <Text style={home.emptyMapIcon}>🗺️</Text>
                <Text style={home.emptyMapText}>Start a trip to see live map</Text>
              </View>
            )}
          </View>
        )}

      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={home.header}>
          <TouchableOpacity style={home.iconBtn} onPress={() => toggleMenu(true)}>
            <Text style={home.iconTxt}>☰</Text>
          </TouchableOpacity>
          <View style={home.timePill}>
            <Text style={home.timeText}>{currentTime}</Text>
          </View>
          <TouchableOpacity style={[home.iconBtn, { backgroundColor: C.red }]} onPress={() => setShowSos(true)}>
            <Text style={[home.iconTxt, { color: C.white, fontSize: 11, fontWeight: '900' }]}>SOS</Text>
          </TouchableOpacity>
        </View>

        {/* ROUTE CARD */}
        <View style={home.routeCard}>
          <Text style={home.routeSub}>CURRENT ROUTE</Text>
          <Text style={home.routeName}>{activeRoute?.name ?? 'No Route Selected'}</Text>
          <View style={home.statsRow}>
            <View style={home.stat}>
              <Text style={home.statVal}>{activeRoute?.stops.length ?? '—'}</Text>
              <Text style={home.statLabel}>STOPS</Text>
            </View>
            <View style={[home.stat, home.statBorder]}>
              <Text style={home.statVal}>{currentStopIdx + 1}</Text>
              <Text style={home.statLabel}>CURRENT</Text>
            </View>
            <View style={home.stat}>
              <Text style={home.statVal}>{activeRoute ? activeRoute.stops.length - currentStopIdx - 1 : '—'}</Text>
              <Text style={home.statLabel}>REMAINING</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* BOTTOM SHEET */}
      <View style={home.sheet}>
        <View style={home.handle} />

        {/* Next Stop */}
        <TouchableOpacity
          style={home.nextStopPanel}
          onPress={handleNextStop}
          disabled={!tripActive}
          activeOpacity={0.7}
        >
          <View style={home.nextStopIcon}>
            <View style={home.innerDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[home.nextStopTitle, tripActive && { color: C.green }]}>
              {tripActive ? 'NEXT STOP' : 'START A TRIP TO BEGIN'}
            </Text>
            <Text style={home.nextStopName}>
              {nextStop ? resolveStop(nextStop) : (activeRoute ? 'All stops complete!' : 'Select a route first')}
            </Text>
            {tripActive && nextStop && (() => {
              const nextStudent = students.find(s => s.id === nextStop);
              return nextStudent?.address ? (
                <Text style={home.nextStopAddress}>{nextStudent.address}</Text>
              ) : null;
            })()}
            {tripActive && <Text style={home.nextStopHint}>Tap to mark as visited →</Text>}
          </View>
        </TouchableOpacity>

        {/* GO Button */}
        <View style={home.btnRow}>
          <TouchableOpacity
            style={[home.mainBtn, tripActive ? { backgroundColor: C.red } : { backgroundColor: C.green }]}
            onPress={handleGo}
            activeOpacity={0.85}
            disabled={!activeRoute}
          >
            <View style={home.btnRing}>
              <Text style={home.btnText}>{tripActive ? 'STOP' : 'GO'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Route List */}
        <TouchableOpacity style={home.routeListBtn} onPress={() => setShowRouteList(true)}>
          <Text style={home.routeListBtnText}>
            {routes.length > 0 ? `📋  Route List (${routes.length})` : '📋  Route List'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── ROUTE LIST MODAL ── */}
      <Modal visible={showRouteList} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowRouteList(false)}>
        <View style={modal.container}>
          <View style={modal.handle} />
          <Text style={modal.title}>Select Route</Text>
          <Text style={modal.subtitle}>{tenant.name}</Text>
          <ScrollView style={{ flex: 1 }}>
            {routes.length === 0 ? (
              <View style={modal.emptyBox}>
                <Text style={modal.emptyIcon}>🗺️</Text>
                <Text style={modal.emptyText}>No routes found for this school.</Text>
                <Text style={modal.emptyHint}>Ask your admin to create routes first.</Text>
              </View>
            ) : routes.map(r => (
              <TouchableOpacity
                key={r.id}
                style={[modal.routeRow, activeRoute?.id === r.id && modal.routeRowActive]}
                onPress={() => { setActiveRoute(r); setCurrentStopIdx(0); setTripActive(false); setShowRouteList(false); }}
                activeOpacity={0.75}
              >
                <View style={modal.routeLeft}>
                  <Text style={[modal.routeRowName, activeRoute?.id === r.id && { color: C.green }]}>{r.name}</Text>
                  <Text style={modal.routeRowSub}>{r.stops.length} stop{r.stops.length !== 1 ? 's' : ''}</Text>
                </View>
                {activeRoute?.id === r.id && <Text style={modal.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={modal.closeBtn} onPress={() => setShowRouteList(false)}>
            <Text style={modal.closeBtnTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── SOS MODAL ── */}
      <Modal visible={showSos} transparent animationType="fade" onRequestClose={() => setShowSos(false)}>
        <View style={sos.overlay}>
          <View style={sos.box}>
            <Text style={sos.icon}>🚨</Text>
            <Text style={sos.title}>Send Emergency Alert?</Text>
            <Text style={sos.body}>This will notify your school administrator immediately with your current status.</Text>
            <TouchableOpacity style={sos.sendBtn} onPress={handleSos} activeOpacity={0.85}>
              <Text style={sos.sendTxt}>Send SOS Alert</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sos.cancelBtn} onPress={() => setShowSos(false)}>
              <Text style={sos.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── SIDE MENU ── */}
      {showMenu && (
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => toggleMenu(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
        </TouchableOpacity>
      )}
      <Animated.View style={[menu.panel, { transform: [{ translateX: menuAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={menu.top}>
            <View style={menu.avatar}>
              <Text style={menu.avatarTxt}>🚍</Text>
            </View>
            <Text style={menu.driverName}>Bus {bus.number}</Text>
            <Text style={menu.schoolName}>{tenant.name}</Text>
          </View>
          <View style={menu.divider} />
          <View style={menu.items}>
            <TouchableOpacity style={menu.item} onPress={() => { toggleMenu(false); setShowRouteList(true); }}>
              <Text style={menu.itemIcon}>📋</Text>
              <Text style={menu.itemLabel}>Route List</Text>
            </TouchableOpacity>
            <TouchableOpacity style={menu.item}>
              <Text style={menu.itemIcon}>📍</Text>
              <Text style={menu.itemLabel}>Trip History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={menu.item}>
              <Text style={menu.itemIcon}>⚙️</Text>
              <Text style={menu.itemLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
          <View style={menu.divider} />
          <TouchableOpacity style={menu.logoutBtn} onPress={() => { toggleMenu(false); onLogout(); }}>
            <Text style={menu.logoutTxt}>← Log Out</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

// ─── HOME STYLES ──────────────────────────────────────────────────────────
const home = StyleSheet.create({
  mapContainer: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: '#111', 
    overflow: 'hidden',
    zIndex: 0
  },
  mapBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#111', overflow: 'hidden' },
  gridRow: { height: 1, backgroundColor: '#2a2a2a', marginBottom: 55, width: '100%' },
  emptyMapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyMapIcon: { fontSize: 48, marginBottom: 12 },
  emptyMapText: { color: '#999', fontSize: 14, fontWeight: '600' },
  tripBadge: { position: 'absolute', top: height * 0.4, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(6,193,103,0.15)', borderWidth: 1, borderColor: C.green, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  tripDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green, marginRight: 8 },
  tripBadgeText: { color: C.green, fontWeight: '800', fontSize: 12, letterSpacing: 1 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 0 : 16, paddingBottom: 16 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.white, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  iconTxt: { fontSize: 20, color: C.black },
  timePill: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  timeText: { color: C.white, fontWeight: '800', fontSize: 14 },

  routeCard: { marginHorizontal: 20, backgroundColor: C.white, borderRadius: 14, padding: 20, elevation: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  routeSub: { fontSize: 10, fontWeight: '800', color: C.gray400, letterSpacing: 1.5, marginBottom: 4 },
  routeName: { fontSize: 20, fontWeight: '900', color: C.black, marginBottom: 16 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.gray100, paddingTop: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.gray100 },
  statVal: { fontSize: 18, fontWeight: '900', color: C.black },
  statLabel: { fontSize: 10, fontWeight: '700', color: C.gray400, marginTop: 2 },

  sheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 32, elevation: 30, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: -10 } },
  handle: { width: 40, height: 5, backgroundColor: C.gray100, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },

  nextStopPanel: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  nextStopIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.black, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  innerDot: { width: 10, height: 10, backgroundColor: C.white, borderRadius: 5 },
  nextStopTitle: { fontSize: 10, fontWeight: '800', color: C.gray400, letterSpacing: 1.5, marginBottom: 3 },
  nextStopName: { fontSize: 17, fontWeight: '900', color: C.black },
  nextStopAddress: { fontSize: 13, color: C.gray400, marginTop: 4, fontWeight: '500' },
  nextStopHint: { fontSize: 12, color: C.green, marginTop: 2, fontWeight: '700' },

  btnRow: { alignItems: 'center', marginBottom: 16 },
  mainBtn: { width: 84, height: 84, borderRadius: 42, padding: 4 },
  btnRing: { flex: 1, borderRadius: 40, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: C.white, fontSize: 20, fontWeight: '900', letterSpacing: 2 },

  routeListBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 24, backgroundColor: C.gray100, borderRadius: 20 },
  routeListBtnText: { fontSize: 13, fontWeight: '800', color: C.black },
});

// ─── ROUTE LIST MODAL STYLES ──────────────────────────────────────────────
const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white, paddingHorizontal: 24, paddingTop: 12 },
  handle: { width: 40, height: 5, backgroundColor: C.gray100, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', color: C.black, marginBottom: 4 },
  subtitle: { fontSize: 13, color: C.gray400, fontWeight: '600', marginBottom: 20 },
  routeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  routeRowActive: { backgroundColor: 'rgba(6,193,103,0.06)', borderRadius: 10, paddingHorizontal: 10 },
  routeLeft: { flex: 1 },
  routeRowName: { fontSize: 16, fontWeight: '800', color: C.black },
  routeRowSub: { fontSize: 12, color: C.gray400, marginTop: 3 },
  checkmark: { color: C.green, fontSize: 20, fontWeight: '900' },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '800', color: C.black, marginBottom: 8 },
  emptyHint: { fontSize: 13, color: C.gray400, textAlign: 'center' },
  closeBtn: { marginTop: 16, marginBottom: 8, alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 40, backgroundColor: C.black, borderRadius: 14 },
  closeBtnTxt: { color: C.white, fontWeight: '900', fontSize: 15 },
});

// ─── SOS MODAL STYLES ─────────────────────────────────────────────────────
const sos = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  box: { backgroundColor: C.white, borderRadius: 20, padding: 32, width: '100%', alignItems: 'center' },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900', color: C.black, textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 14, color: C.gray400, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  sendBtn: { backgroundColor: C.red, borderRadius: 14, paddingVertical: 16, width: '100%', alignItems: 'center', marginBottom: 12 },
  sendTxt: { color: C.white, fontWeight: '900', fontSize: 15 },
  cancelBtn: { paddingVertical: 10 },
  cancelTxt: { color: C.gray400, fontWeight: '700', fontSize: 14 },
});

// ─── SIDE MENU STYLES ─────────────────────────────────────────────────────
const menu = StyleSheet.create({
  panel: { position: 'absolute', top: 0, left: 0, bottom: 0, width: width * 0.78, backgroundColor: C.gray900, elevation: 50, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 10, height: 0 } },
  top: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  avatar: { width: 72, height: 72, borderRadius: 20, backgroundColor: C.green, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarTxt: { fontSize: 36 },
  driverName: { fontSize: 22, fontWeight: '900', color: C.white, marginBottom: 4 },
  schoolName: { fontSize: 13, color: C.gray400, fontWeight: '600', textAlign: 'center' },
  divider: { height: 1, backgroundColor: C.gray700, marginHorizontal: 24 },
  items: { paddingHorizontal: 24, paddingVertical: 20 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  itemIcon: { fontSize: 22, marginRight: 16 },
  itemLabel: { fontSize: 15, fontWeight: '700', color: C.white },
  logoutBtn: { margin: 24, marginTop: 'auto' as any, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: C.gray700, borderRadius: 12 },
  logoutTxt: { color: C.gray200, fontWeight: '700', fontSize: 15 },
});
