# Google Maps Integration Guide

School Bus Tracker now includes Google Maps integration across all three applications: Admin Web Dashboard, Driver App, and Parent App.

## Overview

- **Admin Web**: Interactive Google Maps with real-time bus markers, route polylines, and stop locations
- **Driver App**: Native maps showing current route, GPS position, and next stop
- **Parent App**: Native maps with live bus tracking, route visualization, and ETA calculation

---

## Installation

Dependencies have been added to all three applications. Install them:

```bash
# From root directory, install dependencies in each app
cd admin-web && npm install
cd ../driver-app && npm install
cd ../parent-app && npm install
```

---

## Configuration

### 1. Google Maps API Key Setup

You need a Google Maps API key for the web and mobile apps.

#### Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable these APIs:
   - **Maps JavaScript API** (for admin-web)
   - **Maps SDK for Android** (for driver-app, parent-app)
   - **Distance Matrix API** (for parent-app ETA calculation)

4. Create an API Key:
   - Go to **Credentials** → **Create Credentials** → **API Key**
   - Restrict the key:
     - **API restrictions**: Select the enabled APIs above
     - **Application restrictions**: 
       - For web: HTTP referrers (add your domain)
       - For mobile: Android apps (add your app package name)

5. Copy your API key

### 2. Admin Web Configuration

Add your Google Maps API key to `.env.local`:

```bash
cd admin-web
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here" > .env.local
```

### 3. Driver App Configuration

Update `driver-app/app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-maps",
        {
          "mapsImplementation": "google",
          "googleMapsApiKey": "your_api_key_here"
        }
      ]
    ]
  }
}
```

### 4. Parent App Configuration

Update `parent-app/app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-maps",
        {
          "mapsImplementation": "google",
          "googleMapsApiKey": "your_api_key_here"
        }
      ]
    ]
  }
}
```

---

## Admin Web Dashboard

### Features

- **Real-time Bus Tracking**: Buses appear as orange markers that update via WebSocket
- **Route Visualization**: Routes are drawn as blue polylines connecting all stops
- **Stop Markers**: Green circle markers for each route stop
- **Interactive Info Windows**: Click markers to see details
- **Fleet Selection**: Click on buses in the right panel to center on them
- **Legend**: Visual indication of markers in bottom-right

### Usage

1. Start the backend server:
   ```bash
   cd backend
   npm run start
   ```

2. Start the admin-web dev server:
   ```bash
   cd admin-web
   npm run dev
   ```

3. Open `http://localhost:3000` and navigate to your school

4. Click the **"Live Map"** tab to see the interactive map

### Component Location

- Main component: `admin-web/components/LiveMap.tsx`
- Configuration: `admin-web/config/maps.ts`
- Integration: `admin-web/pages/index.tsx`

---

## Driver App

### Features

- **Live Route Display**: Shows the route polyline on the map
- **Current GPS Position**: Red marker showing driver's current location
- **Next Stop Indicator**: Yellow marker for the next stop
- **Stop Information**: Tap markers to see stop details
- **Route Status**: Bottom panel shows route name, progress, and next stop
- **Trip Status**: Indicates if actively on a route

### Usage

1. Build and run on device:
   ```bash
   cd driver-app
   npm install
   expo build:android --release  # or :ios
   ```

2. Or run on Expo Go:
   ```bash
   expo start
   # Scan QR code with Expo Go app
   ```

3. Log in with your school name and bus number
4. Map will automatically center on GPS location
5. When a trip starts, the route will display

### Component Location

- Main component: `driver-app/components/DriverMap.tsx`
- Used in: `driver-app/Screen.tsx` (HomeScreen)

### Data Flow

```
HomeScreen
  ├── Gets current location from expo-location
  ├── Fetches active trip details
  ├── Receives real-time location updates via WebSocket
  └── Passes data to DriverMap component
```

---

## Parent App

### Features

- **Live Bus Tracking**: Bus location updates in real-time via WebSocket
- **Route Visualization**: Full route polyline with all stops
- **Stop Markers**: Numbered markers for each stop
- **ETA Calculation**: Real-time ETA using Google Distance Matrix API
- **Status Indicator**: Visual indicator showing if actively tracking
- **Bus Coordinates**: Displays exact GPS coordinates

### Usage

1. Build and run on device:
   ```bash
   cd parent-app
   npm install
   expo build:android --release  # or :ios
   ```

2. Or run on Expo Go:
   ```bash
   expo start
   ```

3. Log in with your child's details (school, name, grade)
4. Map will show when the bus starts its route
5. Real-time location updates appear as they happen

### Component Location

- Main component: `parent-app/components/ParentMap.tsx`
- Used in: `parent-app/screens/HomeScreen.tsx`

### ETA Calculation

The ETA is calculated using Google Distance Matrix API for accurate travel times.

To enable ETA:

1. In `parent-app/screens/HomeScreen.tsx`, implement ETA fetching:

```typescript
// Example: Fetch ETA every 30 seconds when tracking
useEffect(() => {
  if (!busLocation || !studentRoute) return;

  const fetchETA = async () => {
    const response = await fetch(
      'https://maps.googleapis.com/maps/api/distancematrix/json?' +
      `origins=${busLocation.latitude},${busLocation.longitude}&` +
      `destinations=${currentStop.latitude},${currentStop.longitude}&` +
      `key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    // Parse and set ETA
  };

  const interval = setInterval(fetchETA, 30000);
  return () => clearInterval(interval);
}, [busLocation, studentRoute]);
```

---

## API Integration

### Backend Endpoints Used

The map components use these existing backend endpoints:

```
Location Updates:
POST   /location/update          - Driver posts GPS location
WebSocket: locationUpdate         - Real-time broadcasts

Route Data:
GET    /core/routes              - Fetch all routes
GET    /core/students            - Fetch students (for stops)
GET    /core/buses               - Fetch bus data

Trip Status:
GET    /trip/active/:busId       - Get active trip
GET    /trip/active/route/:routeId - Get active trip for route
POST   /trip/start               - Start a trip
POST   /trip/:id/end             - End a trip

SOS / Alerts:
GET    /core/alerts              - Fetch unresolved alerts
POST   /core/alerts/:id/resolve  - Resolve alert
```

### WebSocket Events

```
locationUpdate: {
  driverId: string
  busId: string
  tripId: string
  latitude: number
  longitude: number
  timestamp: string
}

tripStarted: {
  tripId: string
  routeId: string
  busId: string
}

tripEnded: {
  tripId: string
  status: 'ENDED'
}
```

---

## Types

New types added to `shared-types/index.ts`:

```typescript
interface Coordinates {
  latitude: number
  longitude: number
}

interface Stop extends Coordinates {
  id: string
  name: string
  sequence: number
  routeId: string
}

interface BusMarker extends LocationUpdate {
  busNumber: string
  busId: string
}

interface RouteWithStops extends Route {
  stops: Stop[]
}

interface ETAInfo {
  distanceMeters: number
  durationSeconds: number
  distanceText: string
  durationText: string
}
```

---

## Database Notes

### Current Schema

The backend already stores coordinates:

**Location Entity**:
```sql
id (UUID, PK)
tripId (FK)
lat (float)
lng (float)
speed (float, nullable)
timestamp (created_at)
```

**Stop Entity**:
```sql
id (UUID, PK)
routeId (FK)
lat (float)
lng (float)
sequence (number)
```

**Route Entity**:
```sql
id (UUID, PK)
name (string)
stops (jsonb) - Currently array of stop names/IDs
```

### Recommended Improvements

To fully leverage maps, consider:

1. **Update Route.stops** from string[] to Stop[] relationship
2. **Add address fields** to stops for geocoding
3. **Store stop durations** (how long to stop at each location)
4. **Add route complexity** (time estimate, distance)

---

## Troubleshooting

### Admin Web Map Not Showing

**Check**:
1. API key is in `.env.local`
2. Maps JavaScript API is enabled in Google Cloud
3. No CORS errors in browser console
4. Browser cache cleared

**Fix**:
```bash
cd admin-web
rm -rf node_modules .next
npm install
npm run dev
```

### Driver/Parent App Maps Not Loading

**Check**:
1. API key is in `app.json`
2. Maps SDK for Android/iOS is enabled
3. App has location permission granted
4. Expo Go has latest version

**Fix**:
```bash
# Clear Expo cache
expo start --clear
```

### ETA Not Calculating

**Check**:
1. Distance Matrix API is enabled
2. Coordinates are valid
3. Network request is being made
4. Check browser/app console for errors

---

## Performance Optimization

### Admin Web

- Map updates are throttled to prevent excessive re-renders
- Markers use React.memo for efficient updates
- Polylines are only re-drawn when routes change

### Driver/Parent Apps

- Camera animations are 500ms for smooth transitions
- Location updates use useCallback to minimize re-renders
- Marker clustering recommended for large fleets (future)

---

## Next Steps

1. **Configure API keys** as described above
2. **Test each application** locally
3. **Deploy to production** following your normal deployment process
4. **Monitor API usage** in Google Cloud Console
5. **Consider**: Geofencing, historical route playback, advanced analytics

---

## Support & Documentation

- [Google Maps API Documentation](https://developers.google.com/maps)
- [@react-google-maps/api](https://react-google-maps-api-docs.netlify.app/)
- [expo-maps Documentation](https://docs.expo.dev/build-reference/expo-maps/)
- [NestJS WebSocket Guide](https://docs.nestjs.com/websockets/gateways)

---

## Migration from Placeholder Maps

If migrating from emoji/text-based maps:

1. **Admin Web**: Replace MapView placeholder with LiveMap component ✅ (Done)
2. **Driver App**: Replace text route display with DriverMap component (Need to integrate)
3. **Parent App**: Replace mock map with ParentMap component (Need to integrate)
4. **Test**: Verify real-time updates work across all apps
5. **Deploy**: Roll out to production with A/B testing if possible

