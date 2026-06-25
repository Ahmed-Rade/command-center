// Command Center — Service Worker
// Cache-first for static assets so repeat visits load instantly and the
// dashboard keeps working offline. Bump CACHE_VERSION whenever any cached
// file changes so clients pick up the new version instead of stale assets.
const CACHE_VERSION = 'cc-v4';
const PRECACHE_URLS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './site.webmanifest',
    './favicon.ico',
    './favicon-16x16.png',
    './favicon-32x32.png',
    './apple-touch-icon.png',
    './android-chrome-192x192.png',
    './android-chrome-512x512.png',
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {
            // Don't fail install if one asset 404s — cache whatever did succeed.
        }))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    // Only handle same-origin requests — let cross-origin calls (weather API,
    // Google Fonts, etc.) go straight to the network as normal.
    if (url.origin !== self.location.origin) return;

    // On any page request, check if a stored alarm is overdue (handles SW restarts).
    if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
        e.waitUntil(checkStoredAlarm());
    }

    e.respondWith(
        caches.match(req).then((cached) => {
            // Cache-first for instant loads; refresh the cache in the
            // background so the next visit picks up any change.
            const networkFetch = fetch(req).then((res) => {
                if (res && res.status === 200) {
                    const copy = res.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
                }
                return res;
            }).catch(() => cached); // offline fallback to whatever's cached

            return cached || networkFetch;
        })
    );
});

// ─── BACKGROUND ALARM ────────────────────────────────────────────────────────
// Stores the pending alarm in the cache so it survives SW restarts.
const ALARM_KEY = '/_cc_alarm_';
let _alarmTimeout = null;
let _pendingAlarm = null;

async function storeAlarm(alarm) {
    const c = await caches.open(CACHE_VERSION);
    await c.put(ALARM_KEY, new Response(JSON.stringify(alarm), {
        headers: { 'Content-Type': 'application/json' }
    }));
}

async function clearAlarm() {
    _pendingAlarm = null;
    if (_alarmTimeout) { clearTimeout(_alarmTimeout); _alarmTimeout = null; }
    const c = await caches.open(CACHE_VERSION);
    await c.delete(ALARM_KEY);
}

async function loadAlarm() {
    try {
        const c = await caches.open(CACHE_VERSION);
        const r = await c.match(ALARM_KEY);
        if (r) return await r.json();
    } catch { /* ignore */ }
    return null;
}

async function fireAlarm(label) {
    await clearAlarm();
    await self.registration.showNotification('⏰ ' + (label || 'Timer Done!'), {
        body: 'Your countdown has finished. Tap to open.',
        icon: './android-chrome-192x192.png',
        badge: './favicon-32x32.png',
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true,  // stays visible until user acts
        tag: 'cc-timer',           // replaces itself if fired twice
        renotify: true,
    });
}

async function scheduleAlarm(alarm) {
    _pendingAlarm = alarm;
    await storeAlarm(alarm);
    const delay = alarm.endEpoch - Date.now();
    if (delay <= 0) { await fireAlarm(alarm.label); return; }
    if (_alarmTimeout) clearTimeout(_alarmTimeout);
    _alarmTimeout = setTimeout(() => fireAlarm(alarm.label), delay);
}

async function checkStoredAlarm() {
    if (_pendingAlarm) return; // already live in memory
    const stored = await loadAlarm();
    if (!stored?.endEpoch) return;
    if (Date.now() >= stored.endEpoch) {
        await fireAlarm(stored.label); // overdue — fire immediately
    } else {
        // SW was restarted mid-countdown — reschedule
        _pendingAlarm = stored;
        const delay = stored.endEpoch - Date.now();
        if (_alarmTimeout) clearTimeout(_alarmTimeout);
        _alarmTimeout = setTimeout(() => fireAlarm(stored.label), delay);
    }
}

// Page sends SCHEDULE_TIMER when countdown starts, CANCEL_TIMER on pause/reset.
// event.waitUntil() keeps the SW alive until the alarm fires.
self.addEventListener('message', (e) => {
    if (e.data?.type === 'SCHEDULE_TIMER') {
        const alarm = { endEpoch: e.data.endEpoch, label: e.data.label || 'Timer Done!' };
        e.waitUntil(scheduleAlarm(alarm));
    } else if (e.data?.type === 'CANCEL_TIMER') {
        e.waitUntil(clearAlarm());
    }
});

// Tap notification → focus existing tab or open app.
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
            const visible = cs.find(c => c.visibilityState === 'visible');
            if (visible) return visible.focus();
            if (cs.length) return cs[0].focus();
            return self.clients.openWindow('./');
        })
    );
});
