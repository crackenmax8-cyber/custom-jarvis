/* PepTalk service worker — precache the whole app so it runs with no network.
   Bump CACHE when any shell file changes; old caches are cleaned on activate. */
const CACHE = "peptalk-v2";
const SHELL = [
  "./", "./index.html", "./styles.css",
  "./data.js", "./brain.js", "./tracker.js", "./app.js",
  "./privacy.html", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png",
  "./icon-maskable-192.png", "./icon-maskable-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // don't let one 404 abort the whole precache
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // Navigations: serve the requested page if we have it (so privacy.html stays
  // privacy.html), then the network, and only fall back to the app shell when
  // both fail — that fallback is what makes #/routes survive an offline reload.
  if (req.mode === "navigate") {
    e.respondWith(
      caches.match(req, { ignoreSearch: true })
        .then((hit) => hit || fetch(req))
        .catch(() => caches.match("./index.html").then((s) => s || caches.match("./")))
    );
    return;
  }
  // Everything else: cache first, then network, refreshing the cache in passing.
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
