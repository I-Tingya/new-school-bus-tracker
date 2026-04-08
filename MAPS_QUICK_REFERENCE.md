# Google Maps Integration - Quick Reference

## Quick Start

### 1. Get API Key
→ https://console.cloud.google.com → Create API Key → Enable Maps APIs

### 2. Configure Admin Web
```bash
cd admin-web
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY" > .env.local
npm install && npm run dev
# Check "Live Map" tab at http://localhost:3000
```

### 3. Configure Driver App
```bash
# Edit driver-app/app.json - add API key to expo.plugins[0][1].googleMapsApiKey
cd driver-app
npm install
expo start
```

### 4. Configure Parent App
```bash
# Edit parent-app/app.json - add API key to expo.plugins[0][1].googleMapsApiKey
cd parent-app
npm install
expo start
```

---

## Components

### Admin Web
```typescript
import { LiveMap } from '@/components/LiveMap';

<LiveMap 
  buses={busMarkers}           // BusMarker[]
  routes={routesWithStops}     // RouteWithStops[]
  selectedBusId={selected}     // string?
  onBusSelect={setSelected}    // (id: string) => void
/>
```

**Renders**: Interactive Google Map with bus markers, route lines, and stops

---

### Driver App
```typescript
import { DriverMap } from '@/components/DriverMap';

<DriverMap 
  currentLocation={coords}     // Coordinates?
  currentRouteId={routeId}     // string?
  routes={allRoutes}           // RouteWithStops[]
  nextStopIndex={0}            // number
  tripStatus="ACTIVE"          // 'ACTIVE' | 'ENDED'
/>
```

**Renders**: Full-screen map with current position, route, and next stop

---

### Parent App
```typescript
import { ParentMap } from '@/components/ParentMap';

<ParentMap 
  busLocation={marker}         // BusMarker?
  studentRoute={route}         // RouteWithStops?
  eta={etaInfo}                // ETAInfo?
  isTracking={true}            // boolean
  studentName={name}           // string?
/>
```

**Renders**: Full-screen map with bus tracking and ETA

---

## Utilities

### Driver App - `mapUtils.ts`
```typescript
calculateDistance(from, to)        // meters
findNextStop(location, stops, idx)  // finds next + distance
isAtStop(location, stop, radius)   // boolean
isApproachingStop(location, stop)  // boolean
getRouteProgress(idx, total)       // 0-100%
estimateTimeToDestination(dist)    // minutes
formatDistance(meters)             // "1.5 km"
calculateTotalRouteDistance(stops) // meters
```

### Parent App - `mapUtils.ts`
```typescript
calculateDistance(from, to)        // meters
fetchETA(from, to)                 // {distance, duration, text}
formatDuration(seconds)            // "5 minutes"
formatDistance(meters)             // "1.5 km"
isWithinGeofence(location, center) // boolean
calculateBearing(from, to)         // 0-360°
getCardinalDirection(bearing)      // "NW", "SE", etc.
```

---

## Types

```typescript
// Coordinates
interface Coordinates {
  latitude: number
  longitude: number
}

// Stop with location
interface Stop extends Coordinates {
  id: string
  name: string
  sequence: number
  routeId: string
}

// Bus location update
interface BusMarker extends LocationUpdate {
  busNumber: string
  busId: string
}

// Route with stops
interface RouteWithStops extends Route {
  stops: Stop[]
}

// ETA result
interface ETAInfo {
  distanceMeters: number
  durationSeconds: number
  distanceText: string
  durationText: string
}
```

---

## Data Flow

### Real-time Updates
```
Backend (WebSocket)
  ↓ locationUpdate event
  ├→ Admin Web: Updates BusMarker → LiveMap re-renders
  ├→ Parent App: Updates busLocation → ParentMap centers map
  └→ Parent App: Triggers ETA calculation
```

### Route Data
```
Backend API
  ↓ GET /core/routes
  ├→ Admin Web: Draws polylines
  ├→ Driver App: Shows full route path
  └→ Parent App: Visualizes route with stops
```

---

## Integration Examples

### In HomeScreen (Driver App)
```typescript
import { DriverMap } from '@/components/DriverMap';
import { findNextStop } from '@/utils/mapUtils';

export default function HomeScreen() {
  const [location, setLocation] = useState();
  const [stopIdx, setStopIdx] = useState(0);
  const [route, setRoute] = useState();

  useEffect(() => {
    if (location && route) {
      const result = findNextStop(location, route.stops, stopIdx);
      setStopIdx(result?.nextStopIndex || 0);
    }
  }, [location]);

  return <DriverMap currentLocation={location} currentRouteId={route?.id} 
                    routes={[route]} nextStopIndex={stopIdx} />;
}
```

### In HomeScreen (Parent App)
```typescript
import { ParentMap } from '@/components/ParentMap';
import { fetchETA } from '@/utils/mapUtils';

export default function HomeScreen() {
  const [busLoc, setBusLoc] = useState();
  const [eta, setEta] = useState();

  useEffect(() => {
    if (!busLoc || !currentStop) return;
    
    fetchETA(busLoc, currentStop).then(setEta);
  }, [busLoc]);

  return <ParentMap busLocation={busLoc} eta={eta} />;
}
```

---

## Configuration

### Admin Web (.env.local)
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY
```

### Driver App (app.json)
```json
{
  "expo": {
    "plugins": [
      ["expo-maps", {
        "mapsImplementation": "google",
        "googleMapsApiKey": "YOUR_API_KEY"
      }]
    ]
  }
}
```

### Parent App (app.json)
```json
{
  "expo": {
    "plugins": [
      ["expo-maps", {
        "mapsImplementation": "google",
        "googleMapsApiKey": "YOUR_API_KEY"
      }]
    ]
  }
}
```

---

## Enable Required APIs in Google Cloud

- ✅ Maps JavaScript API
- ✅ Maps SDK for Android
- ✅ Maps SDK for iOS  
- ✅ Distance Matrix API
- ✅ Geocoding API (optional, for address lookup)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not showing | Check console for API key errors. Verify API is enabled. |
| Markers not updating | Check WebSocket connection. Verify data format. |
| GPS not found (driver) | Check location permissions on device. |
| ETA returns null | Verify Distance Matrix API is enabled. Check internet. |
| CORS errors | Verify API key is restricted correctly. Add domain to allowlist. |

---

## Performance Tips

- Use `React.memo()` for map components when in lists
- Throttle location updates (every 3-5s, not every change)
- Lazy load map libraries
- Remove old markers/polylines when data updates
- Cache route data to reduce API calls
- Use clustering for 100+ markers

---

## Next Enhancements

1. **Geofencing**: Notify on approach/departure from stops
2. **Clustering**: Show multiple markers as clusters
3. **Heatmaps**: Show bus density on map
4. **Route Playback**: Replay past trips
5. **Traffic Layer**: Show real-time traffic (Google Maps)
6. **Offline Maps**: Cache tiles for offline viewing
7. **Street View**: Show street-level imagery
8. **Navigation**: Turn-by-turn directions for drivers

---

**For detailed setup**: See `GOOGLE_MAPS_SETUP.md`  
**For implementation details**: See `IMPLEMENTATION_SUMMARY.md`
