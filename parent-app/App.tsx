import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, SafeAreaView, Alert, ActivityIndicator, Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Platform.OS === 'web' ? 'http://localhost:4000' : 'http://10.0.2.2:4000';
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

const fetchWithTimeout = (url: string, options: any = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
  ]) as Promise<Response>;
};

const api = {
  getTenants: () => fetchWithTimeout(`${API_URL}/tenant`).then(r => r.json()),
  getStudents: (tenantId: string) => fetchWithTimeout(`${API_URL}/core/students`, { headers: { 'x-tenant-id': tenantId } }).then(r => r.json()),
  getRoutes: (tenantId: string) => fetchWithTimeout(`${API_URL}/core/routes`, { headers: { 'x-tenant-id': tenantId } }).then(r => r.json()),
  getActiveTrip: (tenantId: string, routeId: string) => fetchWithTimeout(`${API_URL}/trip/active/route/${routeId}`, { headers: { 'x-tenant-id': tenantId } }).then(r => r.json()),
};

export default function App() {
  const [tenant, setTenant] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('parent_tenant'),
      AsyncStorage.getItem('parent_student')
    ]).then(([t, s]) => {
      if (t && s) {
        setTenant(JSON.parse(t));
        setStudent(JSON.parse(s));
      }
      setLoading(false);
    });
  }, []);

  const handleLogin = async (t: any, s: any) => {
    await AsyncStorage.setItem('parent_tenant', JSON.stringify(t));
    await AsyncStorage.setItem('parent_student', JSON.stringify(s));
    setTenant(t);
    setStudent(s);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('parent_tenant');
    await AsyncStorage.removeItem('parent_student');
    setTenant(null);
    setStudent(null);
  };

  if (loading) return <View style={styles.container}><ActivityIndicator color="#10B981" size="large" /></View>;

  if (!tenant || !student) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <HomeScreen tenant={tenant} student={student} onLogout={handleLogout} />;
}

function LoginScreen({ onLogin }: any) {
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!school || !grade || !studentName) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      const tenants = await api.getTenants();
      const matchSchool = tenants.find((t: any) => t.name.toLowerCase() === school.toLowerCase());
      if (!matchSchool) { setLoading(false); return Alert.alert('Not Found', 'School not found'); }

      const students = await api.getStudents(matchSchool.id);
      const matchStudent = students.find((s: any) => 
        s.name.toLowerCase() === studentName.toLowerCase() && 
        (s.grade || '').toString().toLowerCase() === grade.toString().toLowerCase()
      );

      if (!matchStudent) { setLoading(false); return Alert.alert('Not Found', 'Student not found in this grade. Did you create one in the Admin Dashboard?'); }

      onLogin(matchSchool, matchStudent);
    } catch (e) {
      Alert.alert('Error', 'Network request failed. Is backend running?');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <View style={styles.loginCard}>
        <Text style={styles.loginTitle}>Parent Portal</Text>
        <Text style={styles.loginSubtitle}>Track your child's journey in real-time.</Text>

        <TextInput style={styles.input} placeholder="School Name (e.g. Springfield)" value={school} onChangeText={setSchool} placeholderTextColor="#9CA3AF" />
        <TextInput style={styles.input} placeholder="Student Grade (e.g. 5)" value={grade} onChangeText={setGrade} placeholderTextColor="#9CA3AF" />
        <TextInput style={styles.input} placeholder="Student Name" value={studentName} onChangeText={setStudentName} placeholderTextColor="#9CA3AF" />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ tenant, student, onLogout }: any) {
  const [route, setRoute] = useState<any>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const activeTripRef = React.useRef<any>(null);

  useEffect(() => {
    activeTripRef.current = activeTrip;
  }, [activeTrip]);

  useEffect(() => {
    let socket: Socket | null = null;
    let pollInterval: any = null;

    const setup = async () => {
      try {
        const routes = await api.getRoutes(tenant.id);
        const myRoute = routes.find((r: any) => (r.stops || []).includes(student.id));
        if (!myRoute) return Alert.alert('Notice', 'Your student has not been assigned to any route in the Admin Dashboard yet.');
        setRoute(myRoute);

        const checkTrip = async () => {
           try {
             const trip = await api.getActiveTrip(tenant.id, myRoute.id);
             if (trip && trip.id) {
               setActiveTrip(trip);
               if (socket) socket.emit('subscribeToTrip', trip.id);
             } else {
               setActiveTrip(null);
             }
           } catch (e) {}
        };

        await checkTrip();

        // 10s Polling fallback for high-reliability detection
        pollInterval = setInterval(checkTrip, 10000);

        socket = io(API_URL);
        
        socket.on('connect', () => {
           console.log('Parent App Connected to WS');
        });

        socket.on('locationUpdate', (data: any) => {
          setLocation((prev: any) => {
             return { lat: data.latitude, lng: data.longitude, tripId: data.tripId };
          });
        });

        socket.on('tripStarted', (data: any) => {
          if (data.routeId === myRoute.id) {
             console.log('Trip Started Event received');
             Alert.alert('📢 Bus is on the way!', 'The bus driver has started the route. Get to the stop!');
             setActiveTrip({ id: data.tripId });
             socket?.emit('subscribeToTrip', data.tripId);
             setLocation(null);
          }
        });

        socket.on('tripEnded', (data: any) => {
          if (activeTripRef.current && data.tripId === activeTripRef.current.id) {
             Alert.alert('🏁 Trip Ended', 'The bus has completed its route.');
             setActiveTrip(null);
             setLocation(null);
          }
        });

      } catch (e) {
        console.log(e);
      }
    };
    setup();

    return () => { 
      if (socket) socket.disconnect(); 
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [tenant.id, student.id]);

  const isTracking = location && activeTrip && location.tripId === activeTrip.id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapMock}>
        {isTracking ? (
          <View style={[styles.busMarker, { transform: [{ scale: 1.2 }] }]}><Text style={styles.busMarkerIcon}>🚌</Text></View>
        ) : (
          <Text style={styles.mapPlaceholderText}>
            {activeTrip ? 'Locating Bus...' : 'No active trip for this route right now.'}
          </Text>
        )}
      </View>

      <View style={styles.headerOverlay}>
        <TouchableOpacity style={styles.menuButton} onPress={onLogout}>
          <Text style={styles.menuIcon}>⍇</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tracking Activity</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
           <View>
              <Text style={styles.etaText}>
                {isTracking ? 'Arriving in ~4 mins' : (activeTrip ? 'Connecting...' : 'Offline')}
              </Text>
              <Text style={styles.statusSubText}>{route ? route.name : 'Unknown Route'} • {student.name}</Text>
           </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.busInfoRow}>
          <View style={styles.driverAvatar}><Text>👤</Text></View>
          <View style={styles.busDetails}>
            <Text style={styles.driverName}>Live GPS Tracking</Text>
            <Text style={styles.plateNumber}>
              {isTracking ? `LAT: ${location.lat.toFixed(5)}, LNG: ${location.lng.toFixed(5)}` : 'Waiting for network...'}
            </Text>
          </View>
          <View style={getPulseStyle(isTracking)} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  loginContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', padding: 20 },
  loginCard: { backgroundColor: '#1F2937', padding: 32, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  loginTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, letterSpacing: -0.5 },
  loginSubtitle: { fontSize: 15, color: '#9CA3AF', marginBottom: 32, fontWeight: '500' },
  input: { backgroundColor: '#374151', color: 'white', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#4B5563' },
  button: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  buttonText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },

  mapMock: { ...StyleSheet.absoluteFillObject, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  busMarker: { width: 50, height: 50, backgroundColor: 'white', borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  busMarkerIcon: { fontSize: 24 },
  mapPlaceholderText: { color: '#9CA3AF', fontWeight: 'bold', letterSpacing: 0.5 },

  headerOverlay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, position: 'absolute', top: 40, width: '100%' },
  menuButton: { width: 44, height: 44, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  menuIcon: { fontSize: 20, color: 'white', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: 'white', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 2 }, letterSpacing: 0.5 },

  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#1F2937', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 20 },
  sheetHandle: { width: 48, height: 5, backgroundColor: '#4B5563', borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etaText: { fontSize: 28, fontWeight: '900', color: 'white', marginBottom: 4, letterSpacing: -0.5 },
  statusSubText: { fontSize: 16, color: '#9CA3AF', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#374151', marginVertical: 24 },
  busInfoRow: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 52, height: 52, backgroundColor: '#374151', borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: '#4B5563' },
  busDetails: { flex: 1 },
  driverName: { fontSize: 17, fontWeight: '800', color: 'white', letterSpacing: 0.2 },
  plateNumber: { fontSize: 13, color: '#A7F3D0', marginTop: 4, fontFamily: 'monospace', fontWeight: '700' },
});

const getPulseStyle = (active: boolean): any => ({
  width: 14, height: 14, borderRadius: 7, backgroundColor: active ? '#10B981' : '#EF4444',
  shadowColor: active ? '#10B981' : '#EF4444', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8
});
