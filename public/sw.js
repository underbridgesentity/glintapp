// Offline shell for the technician queue — basements have poor signal.
// Network-first for pages, falling back to the last cached copy.
const CACHE = "glint-v1";
const OFFLINE_PATHS = ["/tech", "/tech/keys"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const cacheable =
    url.origin === location.origin &&
    (OFFLINE_PATHS.some((p) => url.pathname.startsWith(p)) ||
      url.pathname === "/");

  if (!cacheable) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit ?? caches.match("/")))
  );
});
