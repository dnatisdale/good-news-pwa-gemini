/* eslint-disable no-restricted-globals */

// A simple name for our cache
const CACHE_NAME = "gospel-audio-cache-v1";

// We will only cache MP3 files
const AUDIO_FILE_EXTENSION = ".mp3";

self.addEventListener("install", (event) => {
  // Perform install steps
  console.log("[Service Worker] Install");
  // Don't wait for other tabs to close before activating
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate");
  // Clean up old caches if any
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[Service Worker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
            return null;
          })
        );
      })
      .then(() => self.clients.claim()) // Take control of the page immediately
  );
});

self.addEventListener("fetch", (event) => {
  // We only want to intercept requests for MP3 files
  if (event.request.url.endsWith(AUDIO_FILE_EXTENSION)) {
    console.log("[Service Worker] Fetching audio:", event.request.url);

    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        // 1. Try to find the file in the cache
        return cache.match(event.request).then((cachedResponse) => {
          // 1a. If it's in the cache, return it immediately
          if (cachedResponse) {
            console.log(
              "[Service Worker] Serving from cache:",
              event.request.url
            );
            return cachedResponse;
          }

          // 1b. If not in cache, fetch it from the network
          console.log(
            "[Service Worker] Fetching from network and caching:",
            event.request.url
          );
          return fetch(event.request)
            .then((networkResponse) => {
              // Clone the response because it's a stream and can only be used once
              const responseToCache = networkResponse.clone();

              // Save the new file to the cache for next time
              cache.put(event.request, responseToCache);

              // Return the network response to the app
              return networkResponse;
            })
            .catch((err) => {
              console.error("[Service Worker] Error fetching audio:", err);
              // You could return a "you are offline" audio file here if you had one
            });
        });
      })
    );
  } else {
    // For all other requests (like images, API calls), just let the network handle it.
    // In a full PWA, you'd cache the app shell (JS, CSS, HTML) here too,
    // but react-scripts handles that if you run `npm run build`.
    return;
  }
});
