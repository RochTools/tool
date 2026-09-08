// RochTools Service Worker
const CACHE_NAME = "rochtools-cache-v1";
const BASE = "/Tool/";

// Files to pre-cache so the app works offline right after install
const PRECACHE_URLS = [
  BASE + "index.html",
  BASE + "qr-code-generator.html",
  BASE + "word-counter.html",
  BASE + "base64.html",
  BASE + "color-picker.html",
  BASE + "password-generator.html",
  BASE + "video-downloader.html",
  BASE + "manifest.json",
  BASE + "icons/icon-192x192.png",
  BASE + "icons/icon-512x512.png"
];

// Install: cache the core files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // If any single file 404s, don't block install
        console.warn("Some files failed to precache:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for HTML (so updates show up), cache-first for everything else
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  const isHTML = req.headers.get("accept")?.includes("text/html");

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((res) => res || caches.match(BASE + "index.html")))
    );
  } else {
    event.respondWith(
      caches.match(req).then((cached) => {
        return (
          cached ||
          fetch(req).then((res) => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            return res;
          })
        );
      })
    );
  }
});
