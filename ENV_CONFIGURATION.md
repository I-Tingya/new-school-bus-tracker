# Environment Configuration Guide

This guide walks you through configuring Google Maps API keys and environment variables for all three applications.

---

## 1. Get Your Google Maps API Key

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click "NEW PROJECT"
4. Name it (e.g., "School Bus Tracker")
5. Click "CREATE"

### Step 2: Enable Required APIs
1. In the Cloud Console, go to **APIs & Services** > **Library**
2. Search for and enable each API:
   - **Maps JavaScript API** (for admin-web)
   - **Maps SDK for Android** (for driver-app)
   - **Maps SDK for iOS** (for driver-app & parent-app)
   - **Distance Matrix API** (for parent-app ETA)

3. Click "ENABLE" for each API

### Step 3: Create API Key
1. Go to **APIs & Services** > **Credentials**
2. Click "CREATE CREDENTIALS" > "API Key"
3. Copy the key and save it somewhere safe
4. (Optional but recommended) Restrict the key:
   - Click on your key
   - Under "API restrictions":
     - Select "Restrict key"
     - Select the APIs you enabled above
   - Under "Application restrictions":
     - **For web**: Select "HTTP referrers", add your domain (e.g., `localhost:3000`, `yourdomain.com`)
     - **For mobile**: Select "Android apps" or "iOS apps", add your package names

---

## 2. Admin Web Dashboard (.env.local)

### Configuration
```bash
cd admin-web
cp .env.local.example .env.local
```

### Edit `.env.local`
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

### Run
```bash
npm install
npm run dev
# Visit http://localhost:3000
```

### Verify
- Open the admin dashboard
- Navigate to the "Live Map" tab
- You should see a Google Map displayed
- Check browser console for any API errors

---

## 3. Driver App (app.json)

### Configuration
```bash
cd driver-app
```

### Edit `app.json`
Find the `plugins` section:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-maps",
        {
          "mapsImplementation": "google",
          "googleMapsApiKey": "YOUR_API_KEY_HERE"
        }
      ]
    ]
  }
}
```

Replace `YOUR_API_KEY_HERE` with your actual Google Maps API key.

### Build & Run

**Option A: Using Expo Go (Easiest for Testing)**
```bash
npm install
npm install -g expo-cli  # if not already installed
expo start
# Scan QR code with Expo Go app on your phone
```

**Option B: Build APK/IPA**
```bash
# For Android
expo build:android --release

# For iOS
expo build:ios --release
```

### Environment Variables (Optional)
Create `.env` file in driver-app:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

Then in `App.tsx`, you can use:
```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000';
const MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
```

### Verify
- Login with your school and bus number
- Select a route
- Click "GO" to start a trip
- A native map should display with your GPS position
- The route polyline should be drawn
- Next stop markers should be visible

---

## 4. Parent App (app.json)

### Configuration
```bash
cd parent-app
```

### Edit `app.json`
Find the `plugins` section:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-maps",
        {
          "mapsImplementation": "google",
          "googleMapsApiKey": "YOUR_API_KEY_HERE"
        }
      ]
    ]
  }
}
```

Replace `YOUR_API_KEY_HERE` with your actual Google Maps API key.

### Build & Run

**Option A: Using Expo Go**
```bash
npm install
expo start
# Scan QR code with Expo Go app
```

**Option B: Build APK/IPA**
```bash
expo build:android --release  # or :ios
```

### Environment Variables (Optional)
Create `.env` file in parent-app:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
EXPO_PUBLIC_TRIP_POLL_INTERVAL=10000
EXPO_PUBLIC_ETA_REFRESH_INTERVAL=30000
```

### Verify
- Login with school, student grade, and student name
- Wait for a driver to start a trip
- A native map should display
- Bus location should update in real-time
- ETA should calculate once the bus is tracked
- Stop markers should be visible on the route

---

## API Key Configuration by Environment

### Development (Local Testing)

**Admin Web** - `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY
```

**Driver App** - Update `app.json`:
- Set your API key in the `plugins` section
- Use `http://10.0.2.2:4000` for Android emulator
- Use `http://192.168.1.X:4000` for real device (replace X with your IP)

**Parent App** - Same as Driver App

### Production (Deployment)

Create separate API keys with domain restrictions:

1. **Admin Web**:
   - Restrict to your domain only (e.g., `tracking.school.com`)
   - Store in CI/CD secrets

2. **Driver App**:
   - Create separate Android key with package restrictions
   - Store safely in build pipeline

3. **Parent App**:
   - Create separate iOS key
   - Store safely in build pipeline

---

## Troubleshooting

### "Maps JavaScript API not enabled"
- Go to Google Cloud Console
- Enable "Maps JavaScript API"
- Wait 5 minutes for changes to propagate

### "API Key restricted for HTTP referrers"
- Go to your API key settings
- Remove HTTP referrer restrictions (or add localhost:3000, localhost:3001, etc.)

### Maps not showing on device
- Verify API key is correct in app.json
- Check Google Cloud Console for API usage / errors
- Ensure Maps SDK for Android/iOS is enabled

### "Distance Matrix API quota exceeded"
- Premium billing not enabled
- Go to Google Cloud Console > Billing
- Enable billing and set quota limits

### WebSocket not connecting (maps not updating)
- Verify backend server is running: `cd backend && npm run start`
- Check that `API_URL` points to correct backend IP/domain
- For emulator: use `http://10.0.2.2:4000`
- For real device: use device's local IP (e.g., `http://192.168.1.50:4000`)

---

## Security Best Practices

1. **Never commit API keys to version control**
   - Add `.env`, `.env.local` to `.gitignore`
   - Use `.env.example` as template

2. **Restrict API keys**
   - Enable domain restrictions for web
   - Enable package name restrictions for mobile

3. **Use separate keys per environment**
   - Dev key for localhost
   - Production key for production domain

4. **Monitor usage**
   - Check Google Cloud Console regularly
   - Set up billing alerts
   - Monitor for unusual activity

5. **Rotate keys periodically**
   - Generate new keys every 6-12 months
   - Test thoroughly before updating

---

## Testing the Maps

### Admin Web
```bash
cd admin-web
npm install
npm run dev
```
- Open http://localhost:3000
- Click "Live Map" tab
- Should show an interactive Google Map

### Driver App  
```bash
cd driver-app
npm install
expo start
```
- Scan QR with Expo Go
- Login with test school/bus
- Select route and click "GO"
- Should show native map with route

### Parent App
```bash
cd parent-app
npm install
expo start
```
- Scan QR with Expo Go
- Login with test student
- Wait for driver to start trip
- Should show native map with bus tracking

---

## Next Steps

1. ✅ Get API key
2. ✅ Configure all three apps
3. ✅ Test with Expo Go
4. ✅ Build APK/IPA for production
5. ✅ Deploy to app stores
6. ✅ Monitor API usage and costs

For more information, see:
- [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) - Detailed setup guide
- [MAPS_QUICK_REFERENCE.md](MAPS_QUICK_REFERENCE.md) - Developer reference
- [Google Maps API Docs](https://developers.google.com/maps)
