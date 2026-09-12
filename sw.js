const CACHE='nyc-2026-v3';
const ASSETS=[
  './','./index.html','./itinerary.html','./food.html','./drive.html','./weather.html','./links.html','./lists.html','./more.html','./settings.html',
  './css/style.css','./js/data/trip.js','./js/data/itinerary.js','./js/data/restaurants.js','./js/data/drive.js','./js/data/links.js','./js/storage.js','./js/auth.js','./js/weather.js','./js/app.js','./assets/nyc-hero.svg','./manifest.webmanifest','./assets/icons/icon-192.png','./assets/icons/icon-512.png'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin) return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp;}).catch(()=>caches.match('./index.html'))));
});
