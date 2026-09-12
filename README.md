# NYC 2026 Trip App

A mobile-first, static NYC trip web app for **September 12–15, 2026**, with the return arriving in Toronto around **2:00 AM on September 16**.

## Current V2 features

- 5 itinerary date tabs: Sat 12 → Wed 16
- Timeline cards for driving stops, activities and meals
- Pending / Done status stored in `localStorage`
- **Done time automatically recorded in NYC/Toronto time and editable manually**
- Expandable details, notes and Google Maps shortcuts
- Rich place details: history, must-see items, facts, visit tips and selected Bollywood filming connections
- Detailed Central Park route, AMNH 3-hour route and MoMA quick-tour guide
- Meal-by-meal restaurant choices with **Website / Menu / Maps** links
- Add local restaurants and assign them to meal slots
- Add local itinerary stops
- Detailed Toronto → NYC / Parking / Return drive sections
- Full outbound and return Google Maps route shortcuts
- SpotHero shortcut on the Parking tab
- Open-Meteo live weather + local offline cache
- NYC/Toronto + India clocks on the Home page
- Sept 15 birthday treatment: **Baby’s Birthday in NYC**
- Important links page
- Offline trip checklist
- Automatic light/dark theme
- PWA manifest + service worker for install/offline shell
- Password gate remembered per device
- Export/import of dynamic local data

## Temporary password

The password remains:

`NYC2026`

We intentionally did **not** change it in this update. Change it before the final publish if desired. The code stores only a SHA-256 hash in `js/auth.js`, but because this is a static site, it is a privacy barrier rather than true server-side security.

### Change the password later

1. Choose the final password.
2. Generate its SHA-256 hash.
3. Open `js/auth.js`.
4. Replace the value of `PASSWORD_HASH`.

Example on macOS/Linux:

```bash
printf 'YOUR_NEW_PASSWORD' | shasum -a 256
```

## GitHub Pages deployment

1. Upload **the contents of this folder** to the repository root.
2. In GitHub, open **Settings → Pages**.
3. Choose **Deploy from a branch**.
4. Choose `main` and `/ (root)`.
5. Save and wait for the GitHub Pages URL.

If replacing an older deployed version, the service-worker cache version has been bumped to V2. Refresh the site after GitHub finishes deploying; the new service worker will replace the old cached shell.

## Main editable data files

- `js/data/trip.js` — trip identity, day tabs and birthday label
- `js/data/itinerary.js` — itinerary stops and detailed attraction content
- `js/data/restaurants.js` — meal slots, menus and restaurant choices
- `js/data/drive.js` — drive, parking and route links
- `js/data/links.js` — reusable important links

The UI code is in `js/app.js`, dynamic-state helpers are in `js/storage.js`, and styling is in `css/style.css`.

## Local data behavior

Stored separately on each device in `localStorage`:

- Done / Pending itinerary status
- Done time for completed itinerary items
- Notes
- Restaurant selections
- Locally added restaurants
- Locally added itinerary stops
- Checklist state
- Weather cache
- Auth state

Use **More → Settings → Export local changes** to move local state manually to another device.

## Privacy note

Do not store tickets, passports, payment details, confirmation numbers or other sensitive data in this static app. The home starting point is intentionally shown generically as **Port Union, Toronto** rather than a private street address.


## V3 — NYC subway / bus directions

V3 adds expandable first-time-rider transit instructions between itinerary stops where public transit is recommended. Each transit connector includes the station, subway line or bus route, direction of travel, transfers, walk/exit guidance, a live Google Maps transit button, and an MTA service-change button. Because NYC weekend and construction service can change, the static route is the normal/preferred route and should be checked against live transit before boarding.
