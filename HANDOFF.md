# FitConnect — Build Handoff Document
**Date:** 13 April 2026  
**Platform:** iOS + Android (Expo Managed Workflow)  
**Backend:** Supabase (project: sblnskgkpnwyeafqdozs, region: Frankfurt)

---

## What Was Built

### Core App
| Feature | Status | Notes |
|---------|--------|-------|
| Authentication (sign in / sign up) | ✅ Done | Email/password via Supabase Auth |
| Role selection (Client / Trainer) | ✅ Done | Set at sign-up, stored in `profiles.role` |
| Home dashboard | ✅ Done | Dual view — trainer sees clients, client sees own stats |
| Workout tracking | ✅ Done | Live session with rest timers, sets/reps/weight |
| Workout plans | ✅ Done | Multi-day plans, templates, assign to clients |
| Session history | ✅ Done | Grouped by week, detailed breakdown per session |
| Progress screen | ✅ Done | Body weight chart, PRs, weekly volume, muscle frequency |
| Nutrition tracking | ✅ Done | Food search (Open Food Facts), barcode scanner, macro goals |
| Trainer–client system | ✅ Done | Invite by email, accept flow, full CRUD |
| Messaging | ✅ Done | Real-time chat between trainer and client |
| Session booking | ✅ Done | Trainer sets availability, client books, push notification on confirm |
| Weekly check-ins | ✅ Done | Client submits sleep/energy/adherence ratings |
| Push notifications | ✅ Done | Edge function deployed, tokens stored in profiles |
| Offline workout queue | ✅ Done | Queues to AsyncStorage, flushes on reconnect |
| Health integration | ✅ Done | Steps, active calories, sleep, body weight from Apple Health / Health Connect |
| Spotify mini player | ✅ Done | OAuth, play/pause/skip, browse playlists, search tracks |
| Body weight log | ✅ Done | Manual entries with chart on progress screen |
| Privacy Policy screen | ✅ Done | In-app, linked from sign-up and profile |
| Terms of Service screen | ✅ Done | In-app, linked from sign-up and profile |
| Account deletion | ✅ Done | In-app button, edge function deletes user permanently |

### Supabase Edge Functions (all deployed)
| Function | Purpose |
|----------|---------|
| `send-push` | Sends push notifications via Expo Push API |
| `fatsecret` | FatSecret food API proxy (currently unused — see known issues) |
| `delete-account` | Permanently deletes a user account |

---

## What You Need To Do

### Before Submitting to App Stores

#### 1. Update contact email in legal screens
Two files need your real support email replacing the placeholder:
- `app/privacy-policy.tsx` — line at the bottom of Section 10
- `app/terms.tsx` — line at the bottom of Section 10

Replace `support@fitconnect.app` with your actual email.

#### 2. Review and customise legal content
- `app/privacy-policy.tsx` — check the governing law section matches your jurisdiction
- `app/terms.tsx` — Section 9 currently says "England and Wales", update if needed

#### 3. App Store Connect (iOS)
- Create your app in [App Store Connect](https://appstoreconnect.apple.com)
- Add a **Privacy Policy URL** — you'll need to host the privacy policy at a public URL (e.g. your website or a simple hosted page)
- Set age rating (likely 4+)
- Write app description, keywords, and subtitle
- Prepare screenshots for all required device sizes (6.7", 6.5", 5.5" iPhone; iPad optional)
- Set up your banking/tax info for paid features

#### 4. Google Play Console (Android)
- Create your app in [Google Play Console](https://play.google.com/console)
- Add a **Privacy Policy URL** (same URL as iOS is fine)
- Complete the Data Safety form — you'll need to declare: health data, fitness data, personal info (name, email), messages
- Set content rating
- Prepare screenshots and feature graphic

#### 5. Spotify Developer Dashboard
Go to [developer.spotify.com](https://developer.spotify.com) and ensure your app has these redirect URIs registered:
- `fitconnect://spotify-auth` (production builds)
- `exp://192.168.0.108:8081/--/spotify-auth` (your dev machine — update IP if it changes)

Also: Spotify apps start in **Development Mode** (limited to 25 users). Before launch, submit a **Quota Extension Request** in the Spotify dashboard to go into Extended Quota Mode.

#### 6. Apple Health permissions (iOS)
The `app.json` already has HealthKit entitlements. Make sure you have:
- A clear explanation of why each health permission is needed (App Store review requires this)
- The current `NSHealthShareUsageDescription` covers steps and calories — update it if you add more data types

#### 7. Health Connect (Android)
Health Connect on Android requires declaring permissions in your `app.json` plugins config. Currently only steps/calories are declared in the usage descriptions. Update if you add sleep or weight sync.

#### 8. Build and submit
```bash
# iOS TestFlight build
eas build --platform ios --profile preview

# iOS App Store build  
eas build --platform ios --profile production

# Android Play Store build
eas build --platform android --profile production
```

Make sure you're logged into EAS: `eas login`

---

## Known Issues / Outstanding Items

### FatSecret food search not working
The FatSecret edge function is deployed but the FatSecret API blocks Supabase's server IPs. The app currently falls back to **Open Food Facts** for all food search (this works fine).

**To fix later:** Log into [platform.fatsecret.com](https://platform.fatsecret.com), find your app settings, and completely disable IP whitelisting. Once disabled, re-enable FatSecret in `lib/fatsecret.ts` and update `doSearch` in `app/(tabs)/nutrition.tsx`.

### Spotify requires Premium
The playback control API (play, pause, skip) requires Spotify Premium. Free users can browse playlists and search but cannot control playback. Consider adding a message in the UI when a 403 is returned from the Spotify API.

### Spotify Quota Extension
Your Spotify app is in Development Mode — only 25 users can connect. Submit a Quota Extension Request before launch.

### FatSecret edge function debug code
The `supabase/functions/fatsecret/index.ts` still has debug `console.log` lines from troubleshooting. These are harmless but can be removed.

### Grayed-out profile menu items
These profile menu items exist but aren't implemented yet:
- **Progress Photos** — UI exists, no storage backend
- **Body Weight Log** (menu item) — the log works on the progress screen but the profile menu item doesn't navigate anywhere
- **Achievements** — not yet built
- **Notifications settings** — not yet built

---

## Third-Party Accounts You Own

| Service | Where to manage |
|---------|----------------|
| Supabase | supabase.com — project: Fit Connect |
| Spotify Developer | developer.spotify.com — Client ID: 9bf1999e33f54a05a6e58d9a1af50f0d |
| FatSecret Developer | platform.fatsecret.com — Client ID: 8f1c9b002e25400eac891ea6b54a2147 |
| Expo / EAS | expo.dev — Project ID: 50cee6b8-0e49-49df-8525-6ffce70e1d3c |
| Apple Developer | developer.apple.com — Bundle ID: com.michaelog.fitconnect |
| Google Play | play.google.com/console — Package: com.michaelog.fitconnect |

---

## Environment Variables

Stored in `.env` at the project root. **Never commit this file to git.**

```
EXPO_PUBLIC_SUPABASE_URL        — Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY   — Supabase public anon key
FATSECRET_CLIENT_ID             — FatSecret API (server-side only)
FATSECRET_CLIENT_SECRET         — FatSecret API (server-side only)
EXPO_PUBLIC_SPOTIFY_CLIENT_ID   — Spotify OAuth client ID
```

Supabase edge function secrets (set in Supabase dashboard → Settings → Edge Functions → Secrets):
- `FATSECRET_CLIENT_ID`
- `FATSECRET_CLIENT_SECRET`

---

## Project Structure (Key Files)

```
fitconnect/
├── app/
│   ├── (auth)/          — Sign in, sign up screens
│   ├── (tabs)/          — Main tab screens (home, plans, progress, nutrition, chat, profile)
│   ├── _layout.tsx      — Root layout, auth guard, providers
│   ├── start-workout.tsx — Live workout session
│   ├── plan-editor.tsx  — Create/edit workout plans
│   ├── conversation.tsx — Message thread
│   ├── book-session.tsx — Session booking calendar
│   ├── bookings.tsx     — Booking management
│   ├── client-detail.tsx — Trainer view of a client
│   ├── check-in.tsx     — Weekly check-in form
│   ├── set-availability.tsx — Trainer availability
│   ├── edit-profile.tsx — Profile editing
│   ├── session-detail.tsx — Completed workout detail
│   ├── spotify-auth.tsx — Spotify OAuth callback
│   ├── privacy-policy.tsx — Privacy Policy
│   └── terms.tsx        — Terms of Service
├── components/
│   ├── ui/              — Shared UI components (IconSymbol, NumericInput)
│   ├── SpotifyMiniPlayer.tsx — Floating music player
│   └── SpotifyFullPlayer.tsx — Full-screen Spotify modal
├── contexts/
│   ├── WorkoutContext.tsx  — Active workout state
│   └── SpotifyContext.tsx  — Spotify auth + player state
├── lib/
│   ├── supabase.ts      — Supabase client
│   ├── health.ts        — Apple Health / Health Connect
│   ├── spotify.ts       — Spotify Web API
│   ├── fatsecret.ts     — FatSecret nutrition API
│   ├── notifications.ts — Push notifications
│   ├── offlineQueue.ts  — Offline workout sync
│   ├── cache.ts         — AsyncStorage caching
│   └── format.ts        — Date/number formatting
├── supabase/
│   └── functions/
│       ├── send-push/   — Push notification edge function
│       ├── fatsecret/   — Food search edge function
│       └── delete-account/ — Account deletion edge function
├── constants/
│   └── theme.ts         — Colours, typography, spacing
├── styles/              — StyleSheet files per screen
├── app.json             — Expo config (bundle ID, build numbers, permissions)
└── .env                 — API keys (never commit)
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Expo ~54 (Managed Workflow) |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions + Realtime) |
| State | React Context (Workout, Spotify) + AsyncStorage |
| Health | react-native-health-connect (iOS + Android) |
| Music | Spotify Web API via OAuth PKCE |
| Nutrition | Open Food Facts (primary) + FatSecret (pending IP fix) |
| Push | Expo Notifications + Expo Push API |
| Icons | SF Symbols (iOS) / Material Icons (Android) |
| Build | EAS Build |
