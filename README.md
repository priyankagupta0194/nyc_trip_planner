# NYC 2026 Trip App

A mobile-first, static NYC trip web app for **September 12–15, 2026**, with the return arriving in Toronto around **2:00 AM on September 16**.

## Current V1 features

- 5 itinerary date tabs: Sat 12 → Wed 16
- Timeline cards for driving stops, activities and meals
- Pending / Done status stored in `localStorage`
- Expandable details, notes and Google Maps shortcuts
- Meal-by-meal restaurant selection framework
- Add local restaurants and assign them to meal slots
- Add local itinerary stops
- Toronto → NYC / Parking / Return drive sections
- Open-Meteo live weather + local offline cache
- Important links page
- Offline trip checklist
- Automatic light/dark theme
- PWA manifest + service worker for install/offline shell
- Password gate remembered per device
- Export/import of dynamic local data

## Temporary V1 password

The temporary password is:

`NYC2026`

Before publishing, change it if you want. The code stores only a SHA-256 hash in `js/auth.js`, but because this is a static site, this is only a **privacy barrier**, not true server-side security.

### Change the password

1. Choose a new password.
2. Generate its SHA-256 hash.
3. Open `js/auth.js`.
4. Replace the value of `PASSWORD_HASH`.
5. Remove or update the comment that mentions the temporary password.

You can generate a SHA-256 hash locally with:

```bash
printf 'YOUR_NEW_PASSWORD' | shasum -a 256
```

## GitHub Pages deployment

1. Create a new GitHub repository, for example `nyc-2026`.
2. Upload **the contents of this folder** to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose the branch containing the files (usually `main`) and `/ (root)`.
6. Save and wait for the GitHub Pages URL to appear.

The app uses only relative file paths, so it works from a project-style GitHub Pages URL such as `username.github.io/nyc-2026/`.

## Files to edit as we refine the trip

Static trip content is split into editable data files:

- `js/data/trip.js` — trip identity and day tabs
- `js/data/itinerary.js` — itinerary stops and attraction details
- `js/data/restaurants.js` — meal slots and curated restaurant options
- `js/data/drive.js` — drive and parking summary
- `js/data/links.js` — reusable important links

The UI code is mostly in `js/app.js`, and the design is in `css/style.css`.

## What is intentionally unfinished

This is the working app shell built around the current itinerary. We still plan to refine:

- exact Sept 12 driving stops/times
- exact Sept 15–16 return-drive stops
- curated food choices for each meal
- parking garage details
- attraction history and fun facts
- attraction-specific visit tips
- additional official/history links
- exact transfer modes and verified travel times
- selected attraction photography

## Local data behavior

The following are stored separately on each device in `localStorage`:

- Done / Pending itinerary status
- Notes
- Restaurant selections
- Locally added restaurants
- Locally added itinerary stops
- Checklist state
- Weather cache
- Auth state

Use **More → Settings → Export local changes** if you want to manually move this local state to another device.

## Weather

Weather comes from Open-Meteo. If live fetch fails, the app falls back to the last cached response on that device. Forecast cards only appear when the trip dates are included in the forecast data returned by the provider.

## Privacy note

Do not store tickets, passports, payment details, confirmation numbers or other sensitive data in this static app. The included password gate is client-side only.
