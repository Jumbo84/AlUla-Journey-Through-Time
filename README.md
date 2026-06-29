# AlUla — Journey Through Time (Web / PWA)

An augmented-reality visitor guide for **AlUla, Saudi Arabia**. Point your phone at the landscape and discover heritage sites, experiences, hotels, restaurants and visitor services in their real-world direction — in English and Arabic.

This is the **web (Progressive Web App)** version: a single, self-contained app that runs in any modern mobile browser and can be installed to the home screen. It works instantly on **GitHub Pages** — no build step, no server.

> **Status:** Prototype for internal demonstration (Royal Commission for AlUla — Geospatial R&D). Not yet published. Brand logos and place photos are placeholders pending official permissions before any public launch.

---

## ✨ Features

- **AR View** — live camera with floating markers for sites in their true direction (compass + device tilt), held upright like a camera. Shows real distance on each marker.
- **Demo Mode** — when you're more than 50 km from AlUla, the app automatically presents the view from AlUla's centre so all sites appear (ideal for office demos and presentations).
- **Explore** — searchable, filterable cards of real AlUla places with ratings, prices, descriptions and tips.
- **Map** — every place pinned at its real coordinates (Leaflet + OpenStreetMap).
- **Camera** — capture photos/selfies, apply filters (Golden Hour, Desert, B&W, Vivid), auto-watermark, and share via the device share sheet.
- **Services** — essential visitor apps grouped by category, each opening its link.
- **Saved** — bookmark favourite places (stored locally).
- **Bilingual** — English and Arabic with full right-to-left (RTL) support.
- **Offline-ready** — service worker caches the app shell and data.

---

## 🚀 Run it

### Option A — GitHub Pages (recommended, gives a live link)
1. Create a new repository (e.g. `alula-journey-time`) and upload all these files to the root.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After a minute, your live link appears: `https://<your-username>.github.io/alula-journey-time/`
5. Open it **on your phone** (camera and compass need a real device + HTTPS, which GitHub Pages provides).

### Option B — Local preview
```bash
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000 (camera/compass need HTTPS or localhost)
```

> Camera and motion sensors require **HTTPS** (GitHub Pages) or **localhost**. On iOS, tap **"Enable camera & compass"** to grant motion permission.

---

## 🗂️ Project structure

```
index.html         App shell + all styling
app.js             All logic: tabs, AR, compass, map, camera, services, i18n
manifest.json      PWA manifest (installable)
sw.js              Service worker (offline cache)
places.json        Real AlUla data (19 places + 18 services)
<place-id>.jpg     Place photos in the root, named by place id (e.g. hegra.jpg)
<service-id>.png   Service logos in the root, named by service id (e.g. booking.png)
icon-192.png       App icon
icon-512.png       App icon
```

---

## 📊 Data

`places.json` holds real AlUla data:
- **19 places** — Hegra, Elephant Rock, Old Town, Dadan, Jabal Ikmah, Maraya, Wadi AlFann, Banyan Tree, Habitas, Chedi Hegra, Somewhere, Tofareya, and more.
- **18 services** — Experience AlUla, HungerStation, Careem, AlUla Taxi, Booking.com, Gathern, Airbnb, Wise, 911, Absher, Snapchat, Facebook, Instagram, Google Translate, stc, Mobily, Zain, Google Maps.
- Each place: name (EN/AR), category, coordinates, rating, duration, price (SAR), description (EN/AR), tip, official link.

> Coordinates are best-available approximations; verify exact pins before any public launch.

---

## 🖼️ Adding real photos & logos (optional)

Images are matched automatically by id — no code changes needed:
- **Place photos** sit in the repo root named `<place-id>.jpg` (e.g. `hegra.jpg`). If a file is missing the card falls back to a gradient.
- **Service logos** sit in the repo root named `<service-id>.png` (e.g. `booking.png`, `gmaps.png`, `experience_alula.png`). If a file is missing the service falls back to its coloured icon.
- Use only images you own (RCU archive / your own) or open-licensed (Wikimedia). Brand logos in this prototype are supplied by the project owner for internal demonstration only.

---

## ⚖️ Legal & licensing notes

- **Brand logos** are trademarks — use generic icons in the prototype; obtain permissions or partnerships before public launch.
- **Photos** must be RCU-owned, author-owned, or open-licensed (Wikimedia). No Google/Instagram images.
- **Music** (if added) must be royalty-free or originally generated.
- This prototype is **complementary** to the official Experience AlUla app, not a competitor.

---

## 🧭 How AR works (brief)

The app reads device **GPS**, **compass heading**, and **tilt (pitch)**. For each place it computes the **bearing** and **distance** from your position, then places a marker horizontally by how far the bearing differs from where you're pointing, and vertically using tilt — so markers feel anchored to the real direction while you hold the phone upright. This is a directional AR approach (web-capable). A future native build can add precise anchored AR via ARKit/ARCore.

---

## 👤 Author

Developed by **Mohammed Hakami (Jumbo84)** — Head of Geospatial R&D, Royal Commission for AlUla.

---

*Prototype for internal review. © Royal Commission for AlUla. All trademarks belong to their respective owners.*
