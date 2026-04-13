# CulturePass — App Store Launch Guide

> Last updated: March 2026. Follow these steps in order.

---

## What Was Fixed Automatically

| File | Fix |
|------|-----|
| `ios/CulturePass/CulturePass.entitlements` | Changed `aps-environment` from `development` → `production` |
| `eas.json` | Added `device` build profile (installs on physical iPhone) |
| `package.json` | Added `build:ios:device` script |

---

## Step 1 — Set EAS Secrets (CRITICAL — do this first)

Your production build will fail silently or crash without these. Run each command and paste in your real values:

```bash
# Firebase (copy from Firebase Console → Project Settings → Your apps → Web app config)
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "AIza..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "yourproject.firebaseapp.com"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "yourproject"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "yourproject.appspot.com"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "123456789"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "1:123:ios:abc"

# API URL (your Cloud Functions base URL — must end with /api/)
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://us-central1-yourproject.cloudfunctions.net/api/"

# Google Sign-In (from Google Cloud Console → Credentials → iOS OAuth Client)
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "xxx.apps.googleusercontent.com"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_REVERSED_CLIENT_ID --value "com.googleusercontent.apps.xxx"

# Google Maps (from Google Cloud Console → Maps SDK for iOS key)
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_KEY --value "AIza..."

# Sentry (from Sentry.io → Settings → Projects → Client Keys)
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://...@sentry.io/..."
```

> **Tip**: You can also manage secrets in the EAS dashboard at expo.dev → your project → Secrets.

---

## Step 2 — Test on your Physical iPhone (Development Build)

This fixes the "can't run EAS build on iPhone" problem. The `development` profile only builds for Simulator.
The new `device` profile builds for real iPhone.

### 2a. Register your iPhone with EAS

```bash
eas device:create
```

EAS will give you a URL or QR code. Open it on your iPhone and install the profile. This registers your device UDID.

### 2b. Build and install the dev client on your iPhone

```bash
npm run build:ios:device
# This runs: eas build --platform ios --profile device
```

This takes ~15 minutes. When it's done:
- EAS will send you a link
- Open the link on your iPhone → install the app
- You now have the full CulturePass development build with all native modules

### 2c. Start the dev server and connect

```bash
npx expo start --dev-client
```

Scan the QR code in the terminal with your iPhone camera to connect the dev server.

### 2d. Test QR display and scanning

Once the app is running on your iPhone via the dev client:

- **QR Display (Profile ID card)**: Go to Profile → tap the QR icon. The `react-native-qrcode-svg` library uses `react-native-svg` natively — it will render correctly on device.
- **QR Scanning (Scanner screen)**: Tap Scanner in the tab bar. Accept the camera permission prompt when asked. The `expo-camera` CameraView handles QR scanning.

If QR codes still don't display: run `npx expo install --fix` to ensure all native module versions match Expo SDK 55.

---

## Step 3 — Build for TestFlight (internal testing before App Store)

Before submitting to the App Store, test with TestFlight:

```bash
npm run build:ios:preview
# This runs: eas build --platform ios --profile preview
```

This creates an `.ipa` for TestFlight internal testing.

When complete, run:
```bash
eas submit --platform ios --profile production --path path/to/your.ipa
```

Or just submit directly from the build:
```bash
eas submit --platform ios --profile production --latest
```

The submit config already has your Apple credentials:
- Apple ID: `AirPizza@icloud.com`
- App ID: `20261356778`
- Team: `26WGXSNG58`

After submitting, go to [App Store Connect](https://appstoreconnect.apple.com) → TestFlight → wait ~30 min for Apple processing → invite yourself as internal tester.

---

## Step 4 — App Store Connect Setup (Manual — do once)

Log into [appstoreconnect.apple.com](https://appstoreconnect.apple.com) and complete:

### App Information
- [ ] **Name**: CulturePass
- [ ] **Subtitle**: Cultural events & communities
- [ ] **Bundle ID**: `au.culturepass.app` (already created if you've done previous builds)
- [ ] **Primary Language**: English (Australia)
- [ ] **Category**: Entertainment (Primary) / Lifestyle (Secondary)
- [ ] **Age Rating**: 4+ (complete the questionnaire — no objectionable content)

### Capabilities (App Store Connect → your app → Capabilities)
Make sure these are enabled:
- [ ] Push Notifications
- [ ] Sign In with Apple
- [ ] Associated Domains (`applinks:culturepass.app`, `webcredentials:culturepass.app`)
- [ ] Maps

### Privacy Policy
- Required for App Store. Host it at `https://culturepass.app/legal/privacy`
- Or use the in-app route: `/legal/privacy` (your app already has this screen)

### App Privacy (Data practices questionnaire)
You'll need to declare:
- **Contact Info** (email, name) — collected, linked to identity
- **Identifiers** (User ID) — collected, linked to identity
- **Location** (coarse) — collected, not linked
- **Usage Data** — collected for analytics (PostHog)

---

## Step 5 — App Screenshots (Required)

Apple requires screenshots for:
- iPhone 6.9" display (iPhone 16 Pro Max) — 1320 × 2868 px
- iPhone 6.7" display (iPhone 14 Plus) — 1290 × 2796 px
- Optional: iPad 13" if `supportsTablet: true`

Easiest way: run the app in Xcode iOS Simulator at the right size and take screenshots.

Key screens to capture:
1. Discover tab (event grid with hero banner)
2. Event detail page
3. Profile / Digital ID card (with QR)
4. Community tab
5. Perks tab

---

## Step 6 — Production Build

Once you've tested in TestFlight and everything looks good:

```bash
npm run build:ios:production
# This runs: eas build --platform ios --profile production
# autoIncrement: true will bump the build number automatically
```

Then submit:
```bash
npm run submit:ios:production
# This runs: eas submit --platform ios --profile production
```

---

## Step 7 — Submit for App Review

In App Store Connect:
1. Select the build you just submitted
2. Add screenshots
3. Fill in **Review Information**:
   - Demo account: create a test account in your app and provide credentials
   - Notes: "Cultural events and community platform for diaspora communities in AU/NZ/UAE/UK/CA"
4. Click **Submit to App Review**

Apple review typically takes **1–3 business days**.

---

## Common Issues

### "No matching provisioning profile found"
Run: `eas credentials --platform ios` and let EAS manage credentials automatically.

### "Missing push notification entitlement"
Fixed — `aps-environment` is now set to `production` in the entitlements file.

### "App crashes on launch in production"
Check that all `EXPO_PUBLIC_*` secrets are set (Step 1). Without Firebase config, the app crashes immediately.

### "QR code not visible on iPhone"
This only happens if running the app via Expo Go (which doesn't match SDK versions). Use the dev client build from Step 2 instead.

### "Camera permission denied"
The usage string is in `app.json` → `infoPlist.NSCameraUsageDescription`. On first launch, iOS will prompt the user. If they previously denied it, they need to go to Settings → CulturePass → Camera → Allow.

### Build takes too long / times out
EAS builds can take 15–30 minutes. Check status at: `eas build:list`

---

## Quick Reference Commands

```bash
# Physical iPhone dev build
npm run build:ios:device

# Internal preview build (TestFlight)
npm run build:ios:preview

# Production App Store build
npm run build:ios:production

# Submit to App Store
npm run submit:ios:production

# Check build status
eas build:list --platform ios

# Check/manage secrets
eas secret:list

# Register a new test device
eas device:create
```
