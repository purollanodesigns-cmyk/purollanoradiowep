/**
 * @file sw.js
 * @description Service Worker for Puro Llano Radio. Handles basic asset caching,
 * offline fallbacks, and excludes audio streaming requests to avoid memory leaks.
 */

const CACHE_NAME = "purollano-cache-v1";

// Core assets to cache immediately during service worker installation
const CORE_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/purollano-logo.png"
];

/**
 * Service Worker Installation Event
 * Caches core assets to make them available offline.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching core app shell");
      return cache.addAll(CORE_ASSETS);
    })
  );
  // Force active state immediately
  self.skipWaiting();
});

/**
 * Service Worker Activation Event
 * Cleans up old caches to prevent stale assets and memory leaks.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

/**
 * Service Worker Fetch Event
 * Intercepts HTTP requests, serves static assets from cache if available,
 * and falls back to network. Excludes streaming and API requests.
 */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Exclude live audio streaming and external widgets/APIs
  if (
    url.hostname.includes("mipanel.stream") ||
    url.pathname.includes("stream") ||
    event.request.url.includes(".mp3") ||
    event.request.destination === "audio" ||
    event.request.destination === "video" ||
    url.protocol === "chrome-extension:"
  ) {
    // Let the request pass through directly to the network without caching
    return;
  }

  // 2. Fetch strategy: Cache first for static assets, network first for pages
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we have a cached version, we can serve it immediately for static assets (CSS, images, JS, font files)
      const isStaticAsset = 
        event.request.destination === "style" || 
        event.request.destination === "script" || 
        event.request.destination === "image" || 
        event.request.destination === "font";

      if (cachedResponse && isStaticAsset) {
        // Return cached asset, but fetch in background to update cache (stale-while-revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => { /* Ignore background fetch failures */ });
        return cachedResponse;
      }

      // Default strategy: Network first, fallback to cache if offline
      return fetch(event.request)
        .then((networkResponse) => {
          // If response is valid, clone and cache it
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline, return cached resource if available
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback for pages
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
    })
  );
});
