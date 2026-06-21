// ─── SERVICE WORKER (offline + instant repeat loads) ───────
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {
            // Non-fatal — site still works fully without it, just without
            // offline caching (e.g. if served from file:// or an unsupported host).
        });
    });
}

// ─── STORAGE KEYS ───────────────────────────────────────────
const SK = {
    NOTES:       'cc_notes',
    TODOS:       'cc_todos',
    ENGINE:      'cc_engine',
    THEME:       'cc_theme',
    BG:          'cc_bg',
    POMO_SESS:   'cc_pomo_sessions',
    POMO_STATE:  'cc_pomo_state',
    POMO_SET:    'cc_pomo_settings',
    TIMER_STATE: 'cc_timer_state',
    LINKS:       'cc_links',
    HABITS:      'cc_habits',
    LOG:         'cc_log',
    SOUND:       'cc_sound',
    ACCENT:      'cc_accent',
    NAME:        'cc_display_name',
    FONT:        'cc_font',
    DENSITY:     'cc_density',
};

// ─── ELEMENTS ───────────────────────────────────────────────
const greetingEl   = document.getElementById('greeting');
const greetingPrefixEl = document.getElementById('greetingPrefix');
const greetingNameEl   = document.getElementById('greetingName');

// ─── DISPLAY NAME (editable greeting) ───────────────────────
greetingNameEl.textContent = localStorage.getItem(SK.NAME) || 'USER';
greetingNameEl.addEventListener('blur', () => {
    const val = greetingNameEl.textContent.trim().toUpperCase().slice(0, 24) || 'USER';
    greetingNameEl.textContent = val;
    localStorage.setItem(SK.NAME, val);
});
greetingNameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); greetingNameEl.blur(); }
});
const clockEl      = document.getElementById('clock');
const dateEl       = document.getElementById('date');
const uptimeEl     = document.getElementById('uptime');
const commandInput = document.getElementById('commandInput');
const notesArea    = document.getElementById('notes');
const outputBar    = document.getElementById('outputBar');
const todoInput    = document.getElementById('todoInput');
const todoList     = document.getElementById('todoList');
const todoCount    = document.getElementById('todoCount');
const notesSaved   = document.getElementById('notesSaved');
const batteryVal   = document.getElementById('batteryVal');
const weatherVal   = document.getElementById('weatherVal');
const humidityVal  = document.getElementById('humidityVal');
const windVal      = document.getElementById('windVal');
const weatherIcon  = document.getElementById('weatherIcon');
const weatherTemp  = document.getElementById('weatherTemp');
const weatherDesc  = document.getElementById('weatherDesc');
const engineInd    = document.getElementById('engineIndicator');
const shortcutModal = document.getElementById('shortcutModal');
const logEntries   = document.getElementById('logEntries');
const pomoTimeEl   = document.getElementById('pomoTime');
const pomoPhaseEl  = document.getElementById('pomoPhase');
const pomoRingEl   = document.getElementById('pomoRing');
const pomoTomatoes = document.getElementById('pomoTomatoes');
const pomoSessions = document.getElementById('pomoSessions');
const pomoNext     = document.getElementById('pomoNext');
const pomoStartBtn = document.getElementById('pomoStartBtn');
const linksGrid    = document.getElementById('linksGrid');

const startTime = Date.now();
const RING_CIRC = 263.9;

// ─── SAFE NOTIFICATIONS (guards browsers w/o Notification API) ──
const hasNotifications = typeof Notification !== 'undefined';
function requestNotifyPermission() {
    if (hasNotifications && Notification.permission === 'default') Notification.requestPermission();
}
function notify(title, opts) {
    if (hasNotifications && Notification.permission === 'granted') new Notification(title, opts);
}

// ─── GREETING PHRASES ───────────────────────────────────────
// Picked randomly per time-bucket, re-rolled only when the bucket changes
// (not every second) so the header doesn't flicker.
const GREETING_BANKS = {
    dawn: [ // 4–7am
        '> RISE AND GRIND,', '> EARLY BIRD ENERGY,', '> UP BEFORE THE SUN,',
        '> DAWN PATROL,', '> THE GRIND STARTS EARLY,', '> FIRST LIGHT, FIRST LOGIN,',
        '> ROOSTER MODE ACTIVATED,', '> WHILE THE WORLD SLEEPS,',
        '> SUNRISE SHIFT INITIATED,', '> ALARM WON, YOU SHOWED UP,',
    ],
    morning: [ // 7–12
        '> GOOD MORNING,', '> MORNING, LEGEND,', '> COFFEE LOADING...',
        '> SYSTEMS ONLINE,', '> FRESH BOOT, FRESH START,', '> MORNING SHIFT,',
        '> CACHE CLEARED, READY TO GO,', '> TODAY\'S UPTIME: 100%,',
        '> NEW DAY, ZERO BUGS SO FAR,', '> MAIN CHARACTER ENERGY,',
        '> PING SUCCESSFUL, YOU\'RE ALIVE,',
    ],
    afternoon: [ // 12–17
        '> GOOD AFTERNOON,', '> MIDDAY CHECK-IN,', '> STILL CRUSHING IT,',
        '> AFTERNOON OPS,', '> HALFWAY THROUGH THE DAY,', '> POST-LUNCH POWER MODE,',
        '> PEAK PRODUCTIVITY WINDOW,', '> SECOND WIND LOADING,',
        '> KEEP THE MOMENTUM GOING,', '> ON SCHEDULE, MOSTLY,',
    ],
    evening: [ // 17–21
        '> GOOD EVENING,', '> WINDING DOWN,', '> EVENING SHIFT,',
        '> GOLDEN HOUR,', '> DAY\'S ALMOST DONE,', '> SUNSET SYNC,',
        '> CLOSING TICKETS FOR THE DAY,', '> OFFLINE SOON, FINISH STRONG,',
        '> EVENING DEBRIEF TIME,', '> ALMOST AT THE FINISH LINE,',
    ],
    night: [ // 21–00
        '> GOOD NIGHT,', '> NIGHT OWL MODE,', '> BURNING MIDNIGHT OIL,',
        '> LATE SHIFT,', '> THE NIGHT IS YOUNG,', '> DARK MODE: ACTIVATED,',
        '> NIGHT CREW REPORTING IN,', '> QUIET HOURS, LOUD THOUGHTS,',
        '> WINDING DOWN, NOT SHUTTING DOWN,', '> LAST CALL BEFORE BED,',
    ],
    deepNight: [ // 00–4, the niche/meme bucket
        '> BACK AT IT AGAIN, NIGHT OWL,', '> WHY ARE YOU STILL UP,',
        '> 3AM THOUGHTS HIT DIFFERENT,', '> INSOMNIA SQUAD, ASSEMBLE,',
        '> THE GRIND NEVER SLEEPS,', '> RUNNING ON VIBES AND CAFFEINE,',
        '> ONLY BUGS ARE AWAKE WITH YOU,', '> ROGUE PROCESS DETECTED: YOU,',
        '> THIS IS A NO-JUDGMENT TIMEZONE,', '> CIRCADIAN RHYTHM: OFFLINE,',
        '> SLEEP IS FOR PRODUCTION ENVIRONMENTS,',
        '> CONGRATS, YOU UNLOCKED THE SECRET HOURS,',
        '> ANOTHER LATE NIGHT, ANOTHER LEGEND BORN,',
        '> THE WIFI IS CALM AT THIS HOUR,',
    ],
};

let _greetingBucket = null;
let _greetingPhrase = '> GOOD EVENING,';
function getGreetingPrefix(h) {
    let bucket;
    if (h >= 0 && h < 4)        bucket = 'deepNight';
    else if (h >= 4 && h < 7)   bucket = 'dawn';
    else if (h >= 7 && h < 12)  bucket = 'morning';
    else if (h >= 12 && h < 17) bucket = 'afternoon';
    else if (h >= 17 && h < 21) bucket = 'evening';
    else                         bucket = 'night';

    if (bucket !== _greetingBucket) {
        _greetingBucket = bucket;
        const bank = GREETING_BANKS[bucket];
        _greetingPhrase = bank[Math.floor(Math.random() * bank.length)];
    }
    return _greetingPhrase;
}

// ─── CLOCK & GREETING ──────────────────────────────────────
function updateTime() {
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const h12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    clockEl.textContent = `${String(h12).padStart(2, '0')}:${m}:${s} ${ampm}`;

    greetingPrefixEl.textContent = getGreetingPrefix(h);

    const opts = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', opts);

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const hrs  = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    uptimeEl.textContent = `${hrs}:${mins}:${secs}`;
}

updateTime();
setInterval(updateTime, 1000);

// ─── BATTERY ───────────────────────────────────────────────
// The Battery Status API only exists in Chromium browsers (Chrome/Edge/
// Brave/Opera). Firefox removed it in 2016 and Safari never implemented
// it (both cite fingerprinting/privacy concerns) — so on Zen Browser,
// Firefox, or any Safari/iOS browser this will always be unsupported.
// That's a browser limitation, not a bug: there's no other web API that
// exposes real battery level, so the best we can do is make that clear
// instead of showing a bare, broken-looking "N/A".
function setBatteryUnsupported() {
    batteryVal.textContent = 'N/SUPP';
    batteryVal.style.color = 'var(--text-secondary)';
    batteryVal.title = 'Battery API isn\'t supported in this browser (Firefox/Safari removed it for privacy). Try Chrome or Edge.';
}

async function updateBattery() {
    if (!navigator.getBattery) { setBatteryUnsupported(); return; }
    try {
        const bat = await navigator.getBattery();
        const pct = Math.round(bat.level * 100);
        const charging = bat.charging ? ' ⚡' : '';
        batteryVal.textContent = `${pct}%${charging}`;
        batteryVal.title = '';
        batteryVal.style.color = pct > 50 ? 'var(--text-accent)' : pct > 20 ? 'var(--text-yellow)' : 'var(--text-red)';
        if (!updateBattery._bound) {
            bat.addEventListener('levelchange', updateBattery);
            bat.addEventListener('chargingchange', updateBattery);
            updateBattery._bound = true;
        }
    } catch { setBatteryUnsupported(); }
}
updateBattery();

// ─── NETWORK STATUS (live) ──────────────────────────────────
const networkStatusEl = document.getElementById('networkStatus');
function updateNetworkStatus() {
    const online = navigator.onLine;
    networkStatusEl.innerHTML = `<span class="pulse-dot"></span>${online ? 'CONNECTED' : 'OFFLINE'}`;
    networkStatusEl.classList.toggle('online', online);
    networkStatusEl.classList.toggle('offline', !online);
}
window.addEventListener('online', () => { updateNetworkStatus(); showOutput('Network reconnected.', 'success', 3000); });
window.addEventListener('offline', () => { updateNetworkStatus(); showOutput('Network connection lost.', 'error', 4000); });
updateNetworkStatus();

// ─── WEATHER ───────────────────────────────────────────────
const WMO_CODES = {
    0:'☀️ CLEAR', 1:'🌤 MOSTLY CLEAR', 2:'⛅ PARTLY CLOUDY', 3:'☁️ OVERCAST',
    45:'🌫 FOGGY', 48:'🌫 RIME FOG', 51:'🌦 LIGHT DRIZZLE', 53:'🌦 DRIZZLE',
    55:'🌧 HEAVY DRIZZLE', 61:'🌧 LIGHT RAIN', 63:'🌧 RAIN', 65:'🌧 HEAVY RAIN',
    71:'🌨 LIGHT SNOW', 73:'🌨 SNOW', 75:'❄️ HEAVY SNOW',
    80:'🌦 SHOWERS', 81:'🌧 HEAVY SHOWERS', 82:'⛈ VIOLENT SHOWERS',
    95:'⛈ THUNDERSTORM', 96:'⛈ HAIL STORM', 99:'⛈ HEAVY HAIL STORM',
};

const WMO_ICONS = {
    0:'☀️', 1:'🌤', 2:'⛅', 3:'☁️', 45:'🌫', 48:'🌫',
    51:'🌦', 53:'🌦', 55:'🌧', 61:'🌧', 63:'🌧', 65:'🌧',
    71:'🌨', 73:'🌨', 75:'❄️', 80:'🌦', 81:'🌧', 82:'⛈',
    95:'⛈', 96:'⛈', 99:'⛈',
};

async function fetchWeather(lat = 25.4052, lon = 55.5136) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        const c = data.current;
        const code = c.weather_code;
        const desc = WMO_CODES[code] || 'UNKNOWN';
        const icon = WMO_ICONS[code] || '🌡';
        const temp = Math.round(c.temperature_2m);
        const hum  = c.relative_humidity_2m;
        const wind = Math.round(c.wind_speed_10m);

        weatherVal.textContent  = `${temp}°C · ${desc.split(' ').slice(1).join(' ')}`;
        weatherIcon.textContent = icon;
        weatherTemp.textContent = `${temp}°C`;
        weatherDesc.textContent = desc.split(' ').slice(1).join(' ').toUpperCase();
        humidityVal.textContent = `${hum}%`;
        windVal.textContent     = `${wind} KM/H`;
    } catch {
        weatherVal.textContent  = 'UAE (--°C)';
        weatherIcon.textContent = '🌡';
        weatherTemp.textContent = '--°C';
        weatherDesc.textContent = 'UNAVAILABLE';
        humidityVal.textContent = '--';
        windVal.textContent     = '--';
    }
}

function initWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
            () => fetchWeather(),
            { timeout: 6000 }
        );
    } else {
        fetchWeather();
    }
}

initWeather();
setInterval(initWeather, 30 * 60 * 1000);

// ─── SHARED RAF SCHEDULER (perf) ───────────────────────────
// Single requestAnimationFrame loop drives both background canvases.
// Pauses entirely when tab hidden, or when behind an opaque overlay
// (fullscreen panel / zen mode) since the background isn't visible there.
let bgPaused = false;
let pageHidden = document.hidden;
document.addEventListener('visibilitychange', () => { pageHidden = document.hidden; });
function bgShouldRun() { return !pageHidden && !bgPaused; }
window.setBgPaused = (v) => { bgPaused = v; };

// debounce helper — collapses rapid-fire resize events (mobile URL-bar
// show/hide fires many of these) into one
function debounce(fn, wait) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

// ─── MATRIX BACKGROUND ─────────────────────────────────────
const matrixCanvas = document.getElementById('matrixCanvas');
let matrixEnabled = true;

(function initMatrix() {
    const ctx = matrixCanvas.getContext('2d');
    let cols, drops;

    function resize() {
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
        cols = Math.floor(matrixCanvas.width / 18);
        drops = Array(cols).fill(1);
    }
    resize();
    window.addEventListener('resize', debounce(resize, 150));

    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';

    function draw() {
        ctx.fillStyle = 'rgba(6, 10, 15, 0.05)';
        ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        ctx.fillStyle = '#39d353';
        ctx.font = '12px JetBrains Mono, monospace';
        drops.forEach((y, i) => {
            const char = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(char, i * 18, y * 18);
            if (y * 18 > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        });
    }

    let last = 0;
    function loop(ts) {
        requestAnimationFrame(loop);
        if (!matrixEnabled || !bgShouldRun()) return;
        if (ts - last < 80) return; // throttle to ~12.5fps, matches original cadence
        last = ts;
        draw();
    }
    requestAnimationFrame(loop);
})();

// ─── STARS BACKGROUND ──────────────────────────────────────
let starsCanvas = document.createElement('canvas');
starsCanvas.id = 'starsCanvas';
document.body.appendChild(starsCanvas);

(function initStars() {
    const ctx = starsCanvas.getContext('2d');
    let stars = [];
    let starsEnabled = false;

    function resize() {
        starsCanvas.width = window.innerWidth;
        starsCanvas.height = window.innerHeight;
        stars = Array.from({ length: 200 }, () => ({
            x: Math.random() * starsCanvas.width,
            y: Math.random() * starsCanvas.height,
            r: Math.random() * 1.5 + 0.3,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            alpha: Math.random() * 0.8 + 0.2,
        }));
    }
    resize();
    window.addEventListener('resize', debounce(resize, 150));

    window.setStarsBg = (enabled) => {
        starsEnabled = enabled;
        starsCanvas.style.opacity = enabled ? '0.6' : '0';
    };

    function draw() {
        ctx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
        stars.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(205, 217, 229, ${s.alpha})`;
            ctx.fill();
            s.x += s.vx; s.y += s.vy;
            if (s.x < 0) s.x = starsCanvas.width;
            if (s.x > starsCanvas.width) s.x = 0;
            if (s.y < 0) s.y = starsCanvas.height;
            if (s.y > starsCanvas.height) s.y = 0;
        });
    }

    let last = 0;
    function loop(ts) {
        requestAnimationFrame(loop);
        if (!starsEnabled || !bgShouldRun()) return;
        if (ts - last < 50) return; // throttle to ~20fps, matches original cadence
        last = ts;
        draw();
    }
    requestAnimationFrame(loop);
})();

// ─── BACKGROUND SWITCHER ───────────────────────────────────
function applyBg(mode) {
    localStorage.setItem(SK.BG, mode);
    matrixEnabled = false;
    matrixCanvas.style.opacity = '0';
    window.setStarsBg(false);
    document.body.classList.remove('bg-grid', 'bg-aurora');

    if (mode === 'matrix') {
        matrixEnabled = true;
        matrixCanvas.style.opacity = '0.03';
    } else if (mode === 'stars') {
        window.setStarsBg(true);
    } else if (mode === 'grid') {
        document.body.classList.add('bg-grid');
    } else if (mode === 'aurora') {
        document.body.classList.add('bg-aurora');
    }
}

const savedBg = localStorage.getItem(SK.BG) || 'matrix';
applyBg(savedBg);

// ─── THEME ─────────────────────────────────────────────────
const THEMES = ['dark', 'light', 'solarized', 'dracula', 'minimal', 'cyber', 'nord', 'mocha', 'amber', 'synthwave', 'ocean', 'forest', 'sakura', 'monokai', 'paper', 'terminal', 'blood', 'gold', 'ice', 'autumn', 'midnight', 'void', 'coral', 'lavender', 'lime', 'copper'];

const THEME_META = {
    dark:      { swatch: ['#060a0f', '#39d353', '#58a6ff', '#e3b341'] },
    light:     { swatch: ['#f6f8fa', '#1a7f37', '#0969da', '#9a6700'] },
    solarized: { swatch: ['#002b36', '#859900', '#268bd2', '#b58900'] },
    dracula:   { swatch: ['#0d1117', '#50fa7b', '#8be9fd', '#f1fa8c'] },
    minimal:   { swatch: ['#fafafa', '#1a1a1a', '#3366ff', '#ff9900'] },
    cyber:     { swatch: ['#05001a', '#ff2d78', '#00f5ff', '#ffe600'] },
    nord:      { swatch: ['#2e3440', '#88c0d0', '#81a1c1', '#ebcb8b'] },
    mocha:     { swatch: ['#1e1e2e', '#cba6f7', '#89b4fa', '#f9e2af'] },
    amber:     { swatch: ['#1a1006', '#ffb000', '#ffd76a', '#ffe066'] },
    synthwave: { swatch: ['#1a0b2e', '#ff2e88', '#00e8fc', '#ffd23f'] },
    ocean:     { swatch: ['#031a26', '#22d3ee', '#38bdf8', '#facc15'] },
    forest:    { swatch: ['#0d1a10', '#7fd858', '#6fc6d1', '#e0c069'] },
    sakura:    { swatch: ['#fff5f7', '#e85d8a', '#7aa6c2', '#e0a458'] },
    monokai:   { swatch: ['#1e1f1c', '#a6e22e', '#66d9ef', '#e6db74'] },
    paper:     { swatch: ['#f4ecd8', '#a8762a', '#3d6e8c', '#b4862a'] },
    terminal:  { swatch: ['#000000', '#33ff33', '#1f9c1f', '#9fff9f'] },
    blood:     { swatch: ['#0a0000', '#ff2b2b', '#c93b3b', '#ff8c42'] },
    gold:      { swatch: ['#0c0c0a', '#d4af37', '#c9a86a', '#ffd700'] },
    ice:       { swatch: ['#eef6fb', '#0891b2', '#2563eb', '#d97706'] },
    autumn:    { swatch: ['#1c120a', '#ff8c3a', '#d4a24a', '#ffb84d'] },
    midnight:  { swatch: ['#050814', '#5b7fff', '#7fa8ff', '#ffd166'] },
    void:      { swatch: ['#000000', '#ffffff', '#aaaaaa', '#d4d4d4'] },
    coral:     { swatch: ['#1a0e0c', '#ff6f59', '#ff9b85', '#ffb84d'] },
    lavender:  { swatch: ['#f6f2fb', '#8b5cf6', '#6366f1', '#d97706'] },
    lime:      { swatch: ['#0a1006', '#aef02d', '#7fd858', '#e8e85a'] },
    copper:    { swatch: ['#160d08', '#d97b3f', '#c98b5e', '#e0a458'] },
};

function applyTheme(name) {
    document.documentElement.className = document.documentElement.className
        .replace(/theme-\w+/g, '').trim();
    if (name !== 'dark') document.documentElement.classList.add(`theme-${name}`);
    localStorage.setItem(SK.THEME, name);
}

applyTheme(localStorage.getItem(SK.THEME) || 'dark');

// ─── THEME PICKER MODAL ────────────────────────────────────
const themeModal = document.getElementById('themeModal');
const themeGrid  = document.getElementById('themeGrid');

function renderThemeGrid() {
    const current = localStorage.getItem(SK.THEME) || 'dark';
    themeGrid.innerHTML = '';
    THEMES.forEach(name => {
        const meta = THEME_META[name] || { swatch: [] };
        const card = document.createElement('div');
        card.className = `theme-card${name === current ? ' active' : ''}`;
        card.innerHTML = `
            <div class="theme-swatch">${meta.swatch.map(c => `<span style="background:${c}"></span>`).join('')}</div>
            <div class="theme-name">${name}<span class="theme-check">✓</span></div>
        `;
        card.addEventListener('click', () => {
            applyTheme(name);
            renderThemeGrid();
            addLog('cmd', `:theme ${name}`);
            showOutput(`Theme → ${name}`, 'success');
        });
        themeGrid.appendChild(card);
    });
}

document.getElementById('themeTriggerBtn').addEventListener('click', () => {
    renderThemeGrid();
    themeModal.classList.remove('hidden');
});
document.getElementById('themeModalClose').addEventListener('click', () => themeModal.classList.add('hidden'));
themeModal.addEventListener('click', (e) => { if (e.target === themeModal) themeModal.classList.add('hidden'); });

// ─── CUSTOM ACCENT COLOR ────────────────────────────────────
const accentColorInput = document.getElementById('accentColorInput');
const accentResetBtn   = document.getElementById('accentResetBtn');

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyCustomAccent(hex) {
    const root = document.documentElement.style;
    root.setProperty('--text-accent', hex);
    root.setProperty('--border-active', hex);
    root.setProperty('--online-color', hex);
    root.setProperty('--glow-green', hexToRgba(hex, 0.18));
}

function clearCustomAccent() {
    const root = document.documentElement.style;
    ['--text-accent', '--border-active', '--online-color', '--glow-green'].forEach(p => root.removeProperty(p));
}

const storedAccent = localStorage.getItem(SK.ACCENT);
if (storedAccent) {
    applyCustomAccent(storedAccent);
    accentColorInput.value = storedAccent;
} else {
    accentColorInput.value = (THEME_META[localStorage.getItem(SK.THEME) || 'dark'] || THEME_META.dark).swatch[1];
}

const saveAccentDebounced = debounce((val) => localStorage.setItem(SK.ACCENT, val), 200);
accentColorInput.addEventListener('input', () => {
    applyCustomAccent(accentColorInput.value);
    saveAccentDebounced(accentColorInput.value);
});

accentResetBtn.addEventListener('click', () => {
    clearCustomAccent();
    localStorage.removeItem(SK.ACCENT);
    accentColorInput.value = (THEME_META[localStorage.getItem(SK.THEME) || 'dark'] || THEME_META.dark).swatch[1];
    showOutput('Accent reset to theme default.', 'info', 2000);
});

// ─── UI FONT ─────────────────────────────────────────────────
const FONT_CLASSES = ['font-space', 'font-inter', 'font-orbitron'];
const fontSelect = document.getElementById('fontSelect');

function applyFont(name) {
    document.documentElement.classList.remove(...FONT_CLASSES);
    if (name && name !== 'jetbrains') document.documentElement.classList.add(`font-${name}`);
    localStorage.setItem(SK.FONT, name || 'jetbrains');
}

const storedFont = localStorage.getItem(SK.FONT) || 'jetbrains';
applyFont(storedFont);
fontSelect.value = storedFont;
fontSelect.addEventListener('change', () => applyFont(fontSelect.value));

// ─── LAYOUT DENSITY ──────────────────────────────────────────
const densitySelect = document.getElementById('densitySelect');

function applyDensity(name) {
    document.body.classList.toggle('density-compact', name === 'compact');
    localStorage.setItem(SK.DENSITY, name);
}

const storedDensity = localStorage.getItem(SK.DENSITY) || 'comfortable';
applyDensity(storedDensity);
densitySelect.value = storedDensity;
densitySelect.addEventListener('change', () => applyDensity(densitySelect.value));

// ─── AUDIO ENGINE (synthesized, theme-tinted hover/click/type) ───
// Each theme defines distinct waveform+pitch per interaction kind —
// type ticks deliberately contrast with hover/click for a real "key" feel.
const AUDIO_PROFILES = {
    dark:      { hover: { wave: 'sine',     freq: 600 }, click: { wave: 'sine',     freq: 900  }, type: { wave: 'square',   freq: 1200 } },
    light:     { hover: { wave: 'sine',     freq: 700 }, click: { wave: 'sine',     freq: 1000 }, type: { wave: 'triangle', freq: 1500 } },
    solarized: { hover: { wave: 'triangle', freq: 550 }, click: { wave: 'triangle', freq: 850  }, type: { wave: 'square',   freq: 1100 } },
    dracula:   { hover: { wave: 'sawtooth', freq: 500 }, click: { wave: 'sawtooth', freq: 760  }, type: { wave: 'square',   freq: 1300 } },
    minimal:   { hover: { wave: 'sine',     freq: 650 }, click: { wave: 'sine',     freq: 950  }, type: { wave: 'triangle', freq: 1400 } },
    cyber:     { hover: { wave: 'square',   freq: 700 }, click: { wave: 'square',   freq: 1200 }, type: { wave: 'sawtooth', freq: 1800 } },
    nord:      { hover: { wave: 'sine',     freq: 500 }, click: { wave: 'sine',     freq: 750  }, type: { wave: 'triangle', freq: 1000 } },
    mocha:     { hover: { wave: 'triangle', freq: 480 }, click: { wave: 'triangle', freq: 700  }, type: { wave: 'square',   freq: 950  } },
    amber:     { hover: { wave: 'square',   freq: 400 }, click: { wave: 'square',   freq: 650  }, type: { wave: 'triangle', freq: 900  } },
    synthwave: { hover: { wave: 'sawtooth', freq: 620 }, click: { wave: 'sawtooth', freq: 1100 }, type: { wave: 'square',   freq: 1600 } },
    ocean:     { hover: { wave: 'sine',     freq: 550 }, click: { wave: 'sine',     freq: 800  }, type: { wave: 'triangle', freq: 1200 } },
    forest:    { hover: { wave: 'triangle', freq: 450 }, click: { wave: 'triangle', freq: 680  }, type: { wave: 'square',   freq: 850  } },
    sakura:    { hover: { wave: 'sine',     freq: 750 }, click: { wave: 'sine',     freq: 1050 }, type: { wave: 'triangle', freq: 1500 } },
    monokai:   { hover: { wave: 'square',   freq: 500 }, click: { wave: 'square',   freq: 800  }, type: { wave: 'sawtooth', freq: 1300 } },
    paper:     { hover: { wave: 'sine',     freq: 500 }, click: { wave: 'sine',     freq: 700  }, type: { wave: 'triangle', freq: 950  } },
    terminal:  { hover: { wave: 'square',   freq: 350 }, click: { wave: 'square',   freq: 550  }, type: { wave: 'square',   freq: 1600 } },
    blood:     { hover: { wave: 'sawtooth', freq: 300 }, click: { wave: 'sawtooth', freq: 500  }, type: { wave: 'square',   freq: 700  } },
    gold:      { hover: { wave: 'triangle', freq: 600 }, click: { wave: 'triangle', freq: 900  }, type: { wave: 'sine',     freq: 1400 } },
    ice:       { hover: { wave: 'sine',     freq: 800 }, click: { wave: 'sine',     freq: 1150 }, type: { wave: 'triangle', freq: 1700 } },
    autumn:    { hover: { wave: 'triangle', freq: 420 }, click: { wave: 'triangle', freq: 640  }, type: { wave: 'square',   freq: 950  } },
    midnight:  { hover: { wave: 'sine',     freq: 480 }, click: { wave: 'sine',     freq: 720  }, type: { wave: 'triangle', freq: 1100 } },
    void:      { hover: { wave: 'sine',     freq: 260 }, click: { wave: 'triangle', freq: 440  }, type: { wave: 'sine',     freq: 880  } },
    coral:     { hover: { wave: 'triangle', freq: 560 }, click: { wave: 'triangle', freq: 840  }, type: { wave: 'square',   freq: 1250 } },
    lavender:  { hover: { wave: 'sine',     freq: 660 }, click: { wave: 'sine',     freq: 980  }, type: { wave: 'triangle', freq: 1450 } },
    lime:      { hover: { wave: 'square',   freq: 520 }, click: { wave: 'square',   freq: 880  }, type: { wave: 'sawtooth', freq: 1500 } },
    copper:    { hover: { wave: 'triangle', freq: 440 }, click: { wave: 'triangle', freq: 660  }, type: { wave: 'square',   freq: 1000 } },
};

let soundSettings = Object.assign({ hover: true, click: true, type: true, alert: true },
    JSON.parse(localStorage.getItem(SK.SOUND) || 'null') || {});
let audioCtx = null;
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundPopover    = document.getElementById('soundPopover');

function ensureAudioCtx() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch { return null; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function currentAudioProfile() {
    const theme = localStorage.getItem(SK.THEME) || 'dark';
    return AUDIO_PROFILES[theme] || AUDIO_PROFILES.dark;
}

function playSound(kind) {
    if (!soundSettings[kind]) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const cfg = currentAudioProfile()[kind];
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = cfg.wave;

    let baseFreq = cfg.freq;
    if (kind === 'type') baseFreq *= 0.92 + Math.random() * 0.16; // per-key pitch jitter

    osc.frequency.setValueAtTime(baseFreq, now);

    const dur  = kind === 'click' ? 0.13 : kind === 'type' ? 0.04 : 0.06;
    const peak = kind === 'click' ? 0.07 : kind === 'type' ? 0.025 : 0.03;
    if (kind === 'click') {
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.82, now + dur);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
}

function saveSoundSettings() {
    localStorage.setItem(SK.SOUND, JSON.stringify(soundSettings));
}

// ─── ALARM / RINGTONE (for finished pomodoro & timer) ───────
// Repeats a two-tone chime until the user clicks/presses anything,
// or after 60s of no interaction — whichever comes first.
let alarmInterval = null;
let alarmTimeout  = null;

function playAlarmChime() {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [ [0, 880], [0.18, 1175], [0.36, 880] ].forEach(([offset, freq]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.22, now + offset + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.18);
    });
}

function stopAlarm() {
    if (alarmInterval) { clearInterval(alarmInterval); alarmInterval = null; }
    if (alarmTimeout)  { clearTimeout(alarmTimeout); alarmTimeout = null; }
    document.removeEventListener('click', stopAlarm, true);
    document.removeEventListener('keydown', stopAlarm, true);
    document.removeEventListener('touchstart', stopAlarm, true);
}

function startAlarm() {
    if (!soundSettings.alert) return;
    stopAlarm();
    playAlarmChime();
    alarmInterval = setInterval(playAlarmChime, 1100);
    alarmTimeout  = setTimeout(stopAlarm, 60000); // auto-stop after 1 min
    document.addEventListener('click', stopAlarm, true);
    document.addEventListener('keydown', stopAlarm, true);
    document.addEventListener('touchstart', stopAlarm, true);
}
window.stopAlarm = stopAlarm;

function updateSoundUI() {
    const anyOn = soundSettings.hover || soundSettings.click || soundSettings.type || soundSettings.alert;
    soundToggleBtn.textContent = anyOn ? '🔊 SOUND' : '🔇 MUTED';
    soundPopover.querySelectorAll('.sound-toggle-pill').forEach(btn => {
        const on = soundSettings[btn.dataset.kind];
        btn.textContent = on ? 'ON' : 'OFF';
        btn.classList.toggle('active', on);
    });
}
updateSoundUI();

function setAllSound(on) {
    soundSettings.hover = on; soundSettings.click = on; soundSettings.type = on; soundSettings.alert = on;
    saveSoundSettings();
    updateSoundUI();
}

soundToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundPopover.classList.toggle('hidden');
});

soundPopover.querySelectorAll('.sound-toggle-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const kind = btn.dataset.kind;
        soundSettings[kind] = !soundSettings[kind];
        saveSoundSettings();
        updateSoundUI();
    });
});

document.addEventListener('click', (e) => {
    if (!soundPopover.classList.contains('hidden') && !e.target.closest('.sound-control')) {
        soundPopover.classList.add('hidden');
    }
});

// Elements that get hover/click ticks — buttons + key interactive non-buttons.
const SOUND_SELECTOR = 'button, a.link-item, .theme-card, .habit-day, .todo-check, .cmd-dropdown-item, .timer-tab';

let lastHoverSound = 0;
document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.sound-control')) return;
    const el = e.target.closest(SOUND_SELECTOR);
    if (!el) return;
    const now = performance.now();
    if (now - lastHoverSound < 45) return;
    lastHoverSound = now;
    playSound('hover');
});

document.addEventListener('click', (e) => {
    if (e.target.closest('.sound-control')) return;
    const el = e.target.closest(SOUND_SELECTOR);
    if (!el) return;
    playSound('click');
});

// Typing ticks — fires on real text input, skips nav/modifier keys.
const TYPE_KEY_BLOCKLIST = new Set([
    'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Home', 'End', 'PageUp', 'PageDown', 'Insert',
    'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
]);
document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (TYPE_KEY_BLOCKLIST.has(e.key)) return;
    playSound('type');
});





// ─── SEARCH ENGINE ─────────────────────────────────────────
const ENGINES = {
    google:     q => `https://www.google.com/search?q=${q}`,
    duckduckgo: q => `https://duckduckgo.com/?q=${q}`,
    bing:       q => `https://www.bing.com/search?q=${q}`,
    brave:      q => `https://search.brave.com/search?q=${q}`,
    ecosia:     q => `https://www.ecosia.org/search?q=${q}`,
    startpage:  q => `https://www.startpage.com/sp/search?query=${q}`,
    yahoo:      q => `https://search.yahoo.com/search?p=${q}`,
    perplexity: q => `https://www.perplexity.ai/search?q=${q}`,
};
const ENGINE_LIST = Object.keys(ENGINES);

let currentEngine = localStorage.getItem(SK.ENGINE) || 'google';
engineInd.textContent = currentEngine.toUpperCase();
engineInd.title = 'Click to cycle search engine';
engineInd.addEventListener('click', () => {
    const idx = ENGINE_LIST.indexOf(currentEngine);
    setEngine(ENGINE_LIST[(idx + 1) % ENGINE_LIST.length]);
});

function setEngine(name) {
    if (!ENGINES[name]) { showOutput(`Unknown engine. Options: ${Object.keys(ENGINES).join(', ')}`, 'error'); return; }
    currentEngine = name;
    localStorage.setItem(SK.ENGINE, name);
    engineInd.textContent = name.toUpperCase();
    showOutput(`Search engine → ${name.toUpperCase()}`, 'success');
}

// ─── COMMAND HISTORY ───────────────────────────────────────
let cmdHistory = JSON.parse(sessionStorage.getItem('cc_cmd_history') || '[]');
let histIdx = -1;

function pushHistory(cmd) {
    if (cmdHistory[0] === cmd) return;
    cmdHistory.unshift(cmd);
    if (cmdHistory.length > 50) cmdHistory.pop();
    sessionStorage.setItem('cc_cmd_history', JSON.stringify(cmdHistory));
    histIdx = -1;
}

// ─── LOG ───────────────────────────────────────────────────
let logStore = JSON.parse(localStorage.getItem(SK.LOG) || '[]');

function addLog(type, msg) {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    logStore.unshift({ type, msg, ts });
    if (logStore.length > 100) logStore.pop();
    localStorage.setItem(SK.LOG, JSON.stringify(logStore));
    renderLog();
}

function renderLog() {
    logEntries.innerHTML = '';
    logStore.forEach(entry => {
        const div = document.createElement('div');
        div.className = `log-entry ${entry.type}`;
        div.innerHTML = `<span class="log-time">${entry.ts}</span><span class="log-type">${entry.type.toUpperCase()}</span><span class="log-msg">${escapeHtml(String(entry.msg))}</span>`;
        logEntries.appendChild(div);
    });
}

function clearLog() {
    logStore = [];
    localStorage.setItem(SK.LOG, '[]');
    renderLog();
    showOutput('Log cleared.', 'info');
}

// ─── OUTPUT BAR ────────────────────────────────────────────
let outputTimer = null;

function showOutput(msg, type = 'success', duration = 4000) {
    outputBar.textContent = msg;
    outputBar.className = `output-bar ${type}`;
    clearTimeout(outputTimer);
    if (duration > 0) {
        outputTimer = setTimeout(() => outputBar.className = 'output-bar hidden', duration);
    }
}

function hideOutput() { outputBar.className = 'output-bar hidden'; }

// ─── CLIPBOARD MANAGER ─────────────────────────────────────
let clipHistory = JSON.parse(sessionStorage.getItem('cc_clips') || '[]');

function addClip(text) {
    clipHistory.unshift(text);
    if (clipHistory.length > 10) clipHistory.pop();
    sessionStorage.setItem('cc_clips', JSON.stringify(clipHistory));
}

notesArea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const sel = window.getSelection().toString() || notesArea.value;
        if (sel.trim()) { addClip(sel.trim()); }
    }
});

// ─── QUICK LINKS ───────────────────────────────────────────
const DEFAULT_LINKS = [
    { icon: '⚡', text: 'GitHub',     url: 'https://github.com',       key: 'G' },
    { icon: '✉',  text: 'Mail',       url: 'https://mail.google.com',  key: 'M' },
    { icon: '📁', text: 'Drive',      url: 'https://drive.google.com', key: 'D' },
    { icon: '▶',  text: 'YouTube',    url: 'https://youtube.com',      key: 'Y' },
    { icon: '◈',  text: 'ChatGPT',    url: 'https://chatgpt.com',      key: 'A' },
    { icon: '💬', text: 'Reddit',     url: 'https://reddit.com',       key: 'R' },
    { icon: '◉',  text: 'Claude',     url: 'https://claude.ai',        key: 'C' },
    { icon: '🐧', text: 'Linux Docs', url: 'https://linux.die.net',    key: 'L' },
];

let userLinks = JSON.parse(localStorage.getItem(SK.LINKS) || 'null') || DEFAULT_LINKS;

function renderLinks() {
    linksGrid.innerHTML = '';
    userLinks.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.className = 'link-item';
        a.target = '_blank';
        a.rel = 'noopener';
        if (link.key) a.dataset.key = link.key.toUpperCase();
        a.innerHTML = `
            <span class="link-icon">${escapeHtml(link.icon || '🔗')}</span>
            <span class="link-text">${escapeHtml(link.text)}</span>
            ${link.key ? `<span class="link-shortcut">${escapeHtml(link.key.toUpperCase())}</span>` : ''}
        `;
        a.addEventListener('mouseenter', () => {
            const icon = a.querySelector('.link-icon');
            if (!icon) return;
            const orig = icon.textContent;
            const glyphs = '⚡◈◉▸▹▻✦✧';
            let i = 0;
            const interval = setInterval(() => {
                icon.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
                if (++i >= 4) { clearInterval(interval); icon.textContent = orig; }
            }, 60);
        });
        linksGrid.appendChild(a);
    });
}

renderLinks();

// ─── EDIT LINKS MODAL ──────────────────────────────────────
const editLinksModal = document.getElementById('editLinksModal');
const editLinksList  = document.getElementById('editLinksList');

function openEditLinks() {
    editLinksList.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'edit-link-header';
    header.innerHTML = '<span>ICON</span><span>NAME</span><span>URL</span><span>KEY</span><span></span>';
    editLinksList.appendChild(header);

    userLinks.forEach((link, idx) => {
        addEditRow(link, idx);
    });
    editLinksModal.classList.remove('hidden');
}

function addEditRow(link = {}, idx = null) {
    const row = document.createElement('div');
    row.className = 'edit-link-row';
    row.dataset.idx = idx !== null ? idx : Date.now();
    row.innerHTML = `
        <input class="edit-link-icon-input" type="text" value="${escapeHtml(link.icon || '🔗')}" placeholder="🔗" maxlength="4">
        <input type="text" value="${escapeHtml(link.text || '')}" placeholder="Name">
        <input type="url" value="${escapeHtml(link.url || '')}" placeholder="https://...">
        <input class="edit-link-key-input" type="text" value="${escapeHtml(link.key || '')}" placeholder="Key" maxlength="1">
        <button class="edit-link-del" onclick="this.closest('.edit-link-row').remove()">✕</button>
    `;
    editLinksList.appendChild(row);
}

document.getElementById('editLinksAdd').addEventListener('click', () => {
    addEditRow();
});

document.getElementById('editLinksClose').addEventListener('click', () => {
    editLinksModal.classList.add('hidden');
});

document.getElementById('editLinksSave').addEventListener('click', () => {
    const rows = editLinksList.querySelectorAll('.edit-link-row');
    const newLinks = [];
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const icon = inputs[0].value.trim();
        const text = inputs[1].value.trim();
        const url  = inputs[2].value.trim();
        const key  = inputs[3].value.trim().toUpperCase();
        if (text && url) newLinks.push({ icon: icon || '🔗', text, url, key });
    });
    userLinks = newLinks;
    localStorage.setItem(SK.LINKS, JSON.stringify(userLinks));
    renderLinks();
    editLinksModal.classList.add('hidden');
    showOutput(`Quick access updated — ${newLinks.length} links saved.`, 'success');
    addLog('cmd', ':links edit saved');
});

editLinksModal.addEventListener('click', (e) => {
    if (e.target === editLinksModal) editLinksModal.classList.add('hidden');
});

window.openEditLinks = openEditLinks;

// ─── FULLSCREEN ────────────────────────────────────────────
const fullscreenOverlay = document.getElementById('fullscreenOverlay');
const fullscreenInner   = document.getElementById('fullscreenInner');
const fullscreenClose   = document.getElementById('fullscreenClose');
let fullscreenOrigPanel = null;

const PANEL_MAP = {
    status: 'panel-status',
    links:  'panel-links',
    pomo:   'panel-pomo',
    timer:  'panel-timer',
    todo:   'panel-todo',
    notes:  'panel-notes',
    log:    'panel-log',
    habits: 'panel-habits',
    quote:  'panel-quote',
};

let fsScrollY = 0;

function restoreFullscreenPanel() {
    if (!fullscreenOrigPanel) return;
    const { panel, parent, next } = fullscreenOrigPanel;
    // Guard against a stale 'next' reference (e.g. that sibling was itself
    // removed/moved meanwhile) — fall back to appending at the end.
    if (next && next.parentNode === parent) {
        parent.insertBefore(panel, next);
    } else {
        parent.appendChild(panel);
    }
    fullscreenOrigPanel = null;
}

function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, fsScrollY);
}

window.enterFullscreen = function(panelKey) {
    const panelId = PANEL_MAP[panelKey];
    if (!panelId) return;
    const panel = document.getElementById(panelId);
    if (!panel) return;

    // Defensive: if a panel is already fullscreened (shouldn't normally
    // happen, but guards against the previous panel ever getting stuck
    // and two panels stacking on top of each other), restore it first.
    if (fullscreenOrigPanel) {
        restoreFullscreenPanel();
        unlockScroll();
    } else {
        // Real scroll-lock instead of plain overflow:hidden — fixing the body
        // in place (and restoring scrollY on exit) avoids a mobile WebKit bug
        // where the main page renders blank/frozen after the lock is lifted.
        fsScrollY = window.scrollY || window.pageYOffset || 0;
    }

    fullscreenOrigPanel = { panel, parent: panel.parentNode, next: panel.nextSibling };
    fullscreenInner.appendChild(panel);
    fullscreenOverlay.classList.remove('hidden');

    document.body.style.position = 'fixed';
    document.body.style.top = `-${fsScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    bgPaused = true; // background canvases are hidden behind the overlay anyway
    addLog('cmd', `fullscreen: ${panelKey}`);
};

function exitFullscreen() {
    if (!fullscreenOrigPanel) {
        fullscreenOverlay.classList.add('hidden');
        return;
    }
    restoreFullscreenPanel();
    fullscreenOverlay.classList.add('hidden');
    unlockScroll();
    bgPaused = false;
}

fullscreenClose.addEventListener('click', () => exitFullscreen());
fullscreenOverlay.addEventListener('click', (e) => {
    if (e.target === fullscreenOverlay) exitFullscreen();
});

// ─── POMODORO ──────────────────────────────────────────────
const POMO_PRESETS = {
    '25/5':  { work: 25, brk: 5 },
    '50/10': { work: 50, brk: 10 },
    '15/3':  { work: 15, brk: 3 },
    '90/20': { work: 90, brk: 20 },
};

let pomoSettings = Object.assign(
    { preset: '25/5', work: 25, brk: 5, longEvery: 4, longLen: 15, autoStart: false },
    JSON.parse(localStorage.getItem(SK.POMO_SET) || 'null') || {}
);

function savePomoSettings() {
    localStorage.setItem(SK.POMO_SET, JSON.stringify(pomoSettings));
}

const _savedPomo = JSON.parse(localStorage.getItem(SK.POMO_STATE) || 'null');
let pomoState = {
    running: false,
    phase:     _savedPomo?.phase     || 'work',
    total:     _savedPomo?.total     || pomoSettings.work * 60,
    remaining: _savedPomo?.remaining || pomoSettings.work * 60,
    sessions:  parseInt(localStorage.getItem(SK.POMO_SESS) || '0'),
    interval: null,
};

function savePomoState() {
    localStorage.setItem(SK.POMO_STATE, JSON.stringify({
        phase:     pomoState.phase,
        total:     pomoState.total,
        remaining: pomoState.remaining,
    }));
}

function updatePomoRing() {
    const pct = pomoState.remaining / pomoState.total;
    const offset = RING_CIRC * (1 - pct);
    pomoRingEl.style.strokeDashoffset = offset;
    pomoRingEl.className = `pomo-ring-progress${pomoState.phase === 'break' ? ' break-mode' : ''}`;
}

function updatePomoDisplay() {
    const m = String(Math.floor(pomoState.remaining / 60)).padStart(2, '0');
    const s = String(pomoState.remaining % 60).padStart(2, '0');
    pomoTimeEl.textContent = `${m}:${s}`;
    pomoPhaseEl.textContent = pomoState.phase.toUpperCase();
    pomoSessions.textContent = pomoState.sessions;
    pomoNext.textContent = pomoState.phase === 'work' ? 'BREAK' : 'WORK';
    pomoTomatoes.textContent = '🍅'.repeat(Math.min(pomoState.sessions, 8));
    updatePomoRing();
}

function pomoTick() {
    if (pomoState.remaining <= 0) {
        pomoState.running = false;
        clearInterval(pomoState.interval);

        if (pomoState.phase === 'work') {
            pomoState.sessions++;
            localStorage.setItem(SK.POMO_SESS, pomoState.sessions);
            const isLong = pomoState.sessions % pomoSettings.longEvery === 0;
            const brkMin = isLong ? pomoSettings.longLen : pomoSettings.brk;
            pomoState.phase = 'break';
            pomoState.total = brkMin * 60;
            pomoState.remaining = brkMin * 60;
            showOutput(`🍅 Work session complete! ${isLong ? 'Long break' : 'Take a break'} — ${brkMin} min.`, 'success', 6000);
        } else {
            pomoState.phase = 'work';
            pomoState.total = pomoSettings.work * 60;
            pomoState.remaining = pomoSettings.work * 60;
            showOutput('Break over — back to work!', 'info', 6000);
        }

        notify('Pomodoro', {
            body: pomoState.phase === 'work' ? 'Break over! Back to work.' : 'Session done! Take a break.',
            icon: '🍅',
        });
        startAlarm();

        savePomoState();
        updatePomoDisplay();
        addLog('result', `Pomodoro: ${pomoState.phase === 'break' ? 'work done' : 'break done'}`);

        if (pomoSettings.autoStart) {
            pomoState.running = true;
            pomoState.interval = setInterval(pomoTick, 1000);
            pomoStartBtn.textContent = '⏸ PAUSE';
        } else {
            pomoStartBtn.textContent = '▶ START';
        }
        return;
    }
    pomoState.remaining--;
    savePomoState();
    updatePomoDisplay();
}

window.pomoControl = function(action) {
    if (action === 'toggle') {
        if (pomoState.running) {
            clearInterval(pomoState.interval);
            pomoState.running = false;
            pomoStartBtn.textContent = '▶ RESUME';
            addLog('cmd', ':pomo pause');
        } else {
            requestNotifyPermission();
            pomoState.running = true;
            pomoState.interval = setInterval(pomoTick, 1000);
            pomoStartBtn.textContent = '⏸ PAUSE';
            addLog('cmd', ':pomo start');
        }
    } else if (action === 'reset') {
        clearInterval(pomoState.interval);
        pomoState.running = false;
        pomoState.phase = 'work';
        pomoState.total = pomoSettings.work * 60;
        pomoState.remaining = pomoSettings.work * 60;
        pomoStartBtn.textContent = '▶ START';
        savePomoState();
        updatePomoDisplay();
        addLog('cmd', ':pomo reset');
    }
};

updatePomoDisplay();
if (pomoState.remaining < pomoState.total) pomoStartBtn.textContent = '▶ RESUME';

// ─── POMODORO SETTINGS POPOVER ──────────────────────────────
const pomoSettingsBtn      = document.getElementById('pomoSettingsBtn');
const pomoSettingsPopover  = document.getElementById('pomoSettingsPopover');
const pomoPresetSelect     = document.getElementById('pomoPresetSelect');
const pomoCustomRow        = document.getElementById('pomoCustomRow');
const pomoCustomWork       = document.getElementById('pomoCustomWork');
const pomoCustomBreak      = document.getElementById('pomoCustomBreak');
const pomoLongEvery        = document.getElementById('pomoLongEvery');
const pomoLongLen          = document.getElementById('pomoLongLen');
const pomoAutoStart        = document.getElementById('pomoAutoStart');

function renderPomoSettingsUI() {
    pomoPresetSelect.value = pomoSettings.preset;
    pomoCustomRow.hidden = pomoSettings.preset !== 'custom';
    pomoCustomWork.value = pomoSettings.work;
    pomoCustomBreak.value = pomoSettings.brk;
    pomoLongEvery.value = pomoSettings.longEvery;
    pomoLongLen.value = pomoSettings.longLen;
    pomoAutoStart.textContent = pomoSettings.autoStart ? 'ON' : 'OFF';
    pomoAutoStart.classList.toggle('active', pomoSettings.autoStart);
}
renderPomoSettingsUI();

function applyPomoSettingsFromUI() {
    const preset = pomoPresetSelect.value;
    pomoSettings.preset = preset;
    if (preset === 'custom') {
        pomoSettings.work = Math.min(180, Math.max(1, parseInt(pomoCustomWork.value) || 25));
        pomoSettings.brk  = Math.min(60,  Math.max(1, parseInt(pomoCustomBreak.value) || 5));
    } else {
        const p = POMO_PRESETS[preset];
        pomoSettings.work = p.work;
        pomoSettings.brk  = p.brk;
    }
    pomoSettings.longEvery = Math.min(10, Math.max(2, parseInt(pomoLongEvery.value) || 4));
    pomoSettings.longLen   = Math.min(60, Math.max(5, parseInt(pomoLongLen.value) || 15));
    savePomoSettings();
    renderPomoSettingsUI();

    // Only resync the live countdown if the timer isn't already running mid-phase
    if (!pomoState.running) {
        pomoState.phase = 'work';
        pomoState.total = pomoSettings.work * 60;
        pomoState.remaining = pomoSettings.work * 60;
        pomoStartBtn.textContent = '▶ START';
        savePomoState();
        updatePomoDisplay();
    }
    showOutput(`Pomodoro settings saved — ${pomoSettings.work}/${pomoSettings.brk} min.`, 'success', 3000);
    addLog('cmd', 'pomo settings updated');
}

pomoSettingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pomoSettingsPopover.classList.toggle('hidden');
});
document.addEventListener('click', (e) => {
    if (!pomoSettingsPopover.classList.contains('hidden') && !e.target.closest('.pomo-settings-wrap')) {
        pomoSettingsPopover.classList.add('hidden');
    }
});
pomoPresetSelect.addEventListener('change', () => {
    pomoCustomRow.hidden = pomoPresetSelect.value !== 'custom';
    applyPomoSettingsFromUI();
});
[pomoCustomWork, pomoCustomBreak, pomoLongEvery, pomoLongLen].forEach(el => {
    el.addEventListener('change', applyPomoSettingsFromUI);
});
pomoAutoStart.addEventListener('click', () => {
    pomoSettings.autoStart = !pomoSettings.autoStart;
    savePomoSettings();
    renderPomoSettingsUI();
    showOutput(`Auto-start next phase ${pomoSettings.autoStart ? 'on' : 'off'}.`, 'info', 2000);
});

// Stepper +/- buttons for the number fields
document.querySelectorAll('.pomo-stepper-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        const dir = parseInt(btn.dataset.dir, 10);
        const min = parseInt(input.min, 10), max = parseInt(input.max, 10);
        let val = (parseInt(input.value, 10) || 0) + dir;
        val = Math.max(min, Math.min(max, val));
        input.value = val;
        input.dispatchEvent(new Event('change'));
    });
});

// ─── TIMER (STOPWATCH + COUNTDOWN) ─────────────────────────
const _savedTimer = JSON.parse(localStorage.getItem(SK.TIMER_STATE) || 'null');
let timerState = {
    mode:               _savedTimer?.mode               || 'stopwatch',
    running: false,
    elapsed:            _savedTimer?.elapsed            || 0,
    countdownTotal:     _savedTimer?.countdownTotal     || 0,
    countdownRemaining: _savedTimer?.countdownRemaining || 0,
    interval: null,
    laps:               _savedTimer?.laps               || [],
    lastLap:            _savedTimer?.lastLap            || 0,
};

function saveTimerState() {
    localStorage.setItem(SK.TIMER_STATE, JSON.stringify({
        mode:               timerState.mode,
        elapsed:            timerState.elapsed,
        countdownTotal:     timerState.countdownTotal,
        countdownRemaining: timerState.countdownRemaining,
        laps:               timerState.laps,
        lastLap:            timerState.lastLap,
    }));
}

const timerDisplayEl  = document.getElementById('timerDisplay');
const timerModeLabel  = document.getElementById('timerModeLabel');
const timerStartBtn   = document.getElementById('timerStartBtn');
const timerLapBtn     = document.getElementById('timerLapBtn');
const timerLapsEl     = document.getElementById('timerLaps');
const tabStopwatch    = document.getElementById('tabStopwatch');
const tabCountdown    = document.getElementById('tabCountdown');
const timerInputRow   = document.getElementById('timerInputRow');
const timerInput      = document.getElementById('timerInput');

function formatMs(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function updateTimerDisplay() {
    if (timerState.mode === 'stopwatch') {
        timerDisplayEl.textContent = formatMs(timerState.elapsed);
        timerDisplayEl.className = `timer-display${timerState.running ? ' running' : ''}`;
    } else {
        timerDisplayEl.textContent = formatMs(timerState.countdownRemaining);
        if (timerState.countdownRemaining <= 0) {
            timerDisplayEl.className = 'timer-display finished';
        } else {
            timerDisplayEl.className = `timer-display${timerState.running ? ' running' : ''}`;
        }
    }
}

function timerTick() {
    if (timerState.mode === 'stopwatch') {
        timerState.elapsed += 100;
        if (timerState.elapsed % 1000 === 0) saveTimerState(); // persist ~1x/sec, not 10x/sec
        updateTimerDisplay();
    } else {
        timerState.countdownRemaining -= 100;
        if (timerState.countdownRemaining <= 0) {
            timerState.countdownRemaining = 0;
            timerState.running = false;
            clearInterval(timerState.interval);
            timerStartBtn.textContent = '▶ START';
            saveTimerState();
            updateTimerDisplay();
            showOutput('⏰ Timer finished!', 'success', 6000);
            addLog('result', 'Timer: countdown done');
            notify('Timer', { body: 'Countdown complete!' });
            startAlarm();
            return;
        }
        updateTimerDisplay();
        if (timerState.countdownRemaining % 1000 === 0) saveTimerState(); // persist ~1x/sec
    }
}

window.timerControl = function(action) {
    if (action === 'toggle') {
        if (timerState.running) {
            clearInterval(timerState.interval);
            timerState.running = false;
            timerStartBtn.textContent = '▶ RESUME';
            saveTimerState();
            addLog('cmd', 'timer pause');
        } else {
            if (timerState.mode === 'countdown' && timerState.countdownRemaining <= 0) {
                showOutput('Set a countdown time first.', 'info');
                return;
            }
            requestNotifyPermission();
            timerState.running = true;
            timerState.interval = setInterval(timerTick, 100);
            timerStartBtn.textContent = '⏸ PAUSE';
            addLog('cmd', 'timer start');
        }
    } else if (action === 'reset') {
        clearInterval(timerState.interval);
        timerState.running = false;
        timerState.elapsed = 0;
        timerState.countdownRemaining = timerState.countdownTotal;
        timerState.laps = [];
        timerState.lastLap = 0;
        timerLapsEl.innerHTML = '';
        timerStartBtn.textContent = '▶ START';
        saveTimerState();
        updateTimerDisplay();
        addLog('cmd', 'timer reset');
    } else if (action === 'lap') {
        if (timerState.mode !== 'stopwatch' || !timerState.running) return;
        const lapTime = timerState.elapsed - timerState.lastLap;
        timerState.laps.push({ total: timerState.elapsed, lap: lapTime });
        timerState.lastLap = timerState.elapsed;
        saveTimerState();
        renderLaps();
    }
};

function renderLaps() {
    timerLapsEl.innerHTML = '';
    [...timerState.laps].reverse().forEach((l, i) => {
        const idx = timerState.laps.length - i;
        const div = document.createElement('div');
        div.className = 'timer-lap-item';
        div.innerHTML = `<span>LAP ${idx}</span><span>${formatMs(l.lap)}</span>`;
        timerLapsEl.appendChild(div);
    });
}

window.switchTimerMode = function(mode) {
    if (timerState.running) {
        clearInterval(timerState.interval);
        timerState.running = false;
    }
    timerState.mode = mode;
    timerState.elapsed = 0;
    timerState.laps = [];
    timerState.lastLap = 0;
    timerLapsEl.innerHTML = '';
    timerStartBtn.textContent = '▶ START';

    tabStopwatch.classList.toggle('active', mode === 'stopwatch');
    tabCountdown.classList.toggle('active', mode === 'countdown');
    timerInputRow.classList.toggle('hidden', mode !== 'countdown');
    document.getElementById('timerPresets').classList.toggle('hidden', mode !== 'countdown');
    document.getElementById('timerTargetRow').classList.toggle('hidden', mode !== 'countdown');
    timerLapBtn.style.display = mode === 'stopwatch' ? 'block' : 'none';
    timerModeLabel.textContent = mode.toUpperCase();

    if (mode === 'countdown') {
        timerState.countdownRemaining = 0;
    }
    updateTimerDisplay();
};

window.setCountdown = function() {
    const val = timerInput.value.trim();
    let totalSeconds = 0;
    if (val.includes(':')) {
        const parts = val.split(':');
        if (parts.length === 3) {
            // HH:MM:SS
            totalSeconds = parseInt(parts[0] || 0) * 3600 + parseInt(parts[1] || 0) * 60 + parseInt(parts[2] || 0);
        } else {
            // MM:SS
            totalSeconds = parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0);
        }
    } else {
        totalSeconds = parseInt(val) * 60;
    }
    if (!totalSeconds || totalSeconds <= 0) {
        showOutput('Invalid time. Use HH:MM:SS, MM:SS or MM.', 'error');
        return;
    }
    timerState.countdownTotal = totalSeconds * 1000;
    timerState.countdownRemaining = totalSeconds * 1000;
    updateTimerDisplay();
    timerInput.value = '';
    // Auto-start
    if (timerState.running) {
        clearInterval(timerState.interval);
        timerState.running = false;
    }
    requestNotifyPermission();
    timerState.running = true;
    timerState.interval = setInterval(timerTick, 100);
    timerStartBtn.textContent = '⏸ PAUSE';
    showOutput(`▶ Countdown started: ${formatMs(totalSeconds * 1000)}`, 'success', 2000);
    addLog('cmd', `timer set+start: ${formatMs(totalSeconds * 1000)}`);
};

window.setCountdownToTime = function() {
    const val = document.getElementById('timerTargetInput').value;
    if (!val) { showOutput('Pick a target time first.', 'error'); return; }

    const now = new Date();
    const [hStr, mStr] = val.split(':');
    const target = new Date(now);
    target.setHours(parseInt(hStr), parseInt(mStr), 0, 0);

    // If target already passed today, aim for tomorrow
    if (target <= now) target.setDate(target.getDate() + 1);

    const diffMs = target - now;
    const totalSeconds = Math.floor(diffMs / 1000);

    timerState.countdownTotal = totalSeconds * 1000;
    timerState.countdownRemaining = totalSeconds * 1000;
    updateTimerDisplay();

    if (timerState.running) {
        clearInterval(timerState.interval);
        timerState.running = false;
    }
    requestNotifyPermission();
    timerState.running = true;
    timerState.interval = setInterval(timerTick, 100);
    timerStartBtn.textContent = '⏸ PAUSE';

    const h = String(parseInt(hStr) % 12 || 12).padStart(2, '0');
    const ampm = parseInt(hStr) < 12 ? 'AM' : 'PM';
    showOutput(`▶ Countdown to ${h}:${mStr} ${ampm} (${formatMs(totalSeconds * 1000)})`, 'success', 3000);
    addLog('cmd', `timer until: ${h}:${mStr} ${ampm}`);
};

window.setCountdownPreset = function(minutes) {
    const totalSeconds = minutes * 60;
    timerState.countdownTotal = totalSeconds * 1000;
    timerState.countdownRemaining = totalSeconds * 1000;
    updateTimerDisplay();
    if (timerState.running) {
        clearInterval(timerState.interval);
        timerState.running = false;
    }
    requestNotifyPermission();
    timerState.running = true;
    timerState.interval = setInterval(timerTick, 100);
    timerStartBtn.textContent = '⏸ PAUSE';
    showOutput(`▶ ${minutes}m countdown started`, 'success', 2000);
    addLog('cmd', `timer preset: ${minutes}m`);
};

timerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') window.setCountdown();
});

// Restore timer UI to saved mode on load
if (_savedTimer?.mode === 'countdown') {
    tabStopwatch.classList.remove('active');
    tabCountdown.classList.add('active');
    timerInputRow.classList.remove('hidden');
    document.getElementById('timerPresets').classList.remove('hidden');
    document.getElementById('timerTargetRow').classList.remove('hidden');
    timerLapBtn.style.display = 'none';
    timerModeLabel.textContent = 'COUNTDOWN';
}
if (_savedTimer?.laps?.length) renderLaps();
updateTimerDisplay();

// ─── IP INFO ───────────────────────────────────────────────
async function fetchMyIP() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const d = await res.json();
        showOutput(`IP: ${d.ip} · ISP: ${d.org} · ${d.city}, ${d.country_name}`, 'info', 10000);
        addLog('result', `IP: ${d.ip} · ${d.city}, ${d.country_name}`);
    } catch {
        showOutput('Could not fetch IP info.', 'error');
    }
}

// ─── CRYPTO/CURRENCY ───────────────────────────────────────
async function fetchPrice(ticker) {
    const t = ticker.toUpperCase();
    try {
        if (['BTC', 'ETH', 'SOL', 'BNB'].includes(t)) {
            const ids = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin' };
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids[t]}&vs_currencies=usd`);
            const d = await res.json();
            const price = Object.values(d)[0]?.usd;
            if (!price) throw new Error('no data');
            showOutput(`${t}/USD: $${price.toLocaleString()}`, 'success', 8000);
            addLog('result', `${t}/USD: $${price.toLocaleString()}`);
        } else {
            const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${t}`);
            const d = await res.json();
            const usd = d.rates?.USD;
            if (!usd) throw new Error('no data');
            showOutput(`${t}/USD: ${usd.toFixed(4)}`, 'success', 8000);
            addLog('result', `${t}/USD: ${usd.toFixed(4)}`);
        }
    } catch {
        showOutput(`Could not fetch price for ${t}.`, 'error');
    }
}

// ─── HABITS ────────────────────────────────────────────────
let habits = JSON.parse(localStorage.getItem(SK.HABITS) || '[]');

function saveHabits() { localStorage.setItem(SK.HABITS, JSON.stringify(habits)); }

function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function addHabit(name) {
    habits.unshift({ id: Date.now(), name, days: {} });
    saveHabits();
    renderHabits();
}

function toggleHabitDay(id, dayKey) {
    const h = habits.find(h => h.id === id);
    if (!h) return;
    h.days[dayKey] = !h.days[dayKey];
    saveHabits();
    renderHabits();
}

function deleteHabit(id) {
    habits = habits.filter(h => h.id !== id);
    saveHabits();
    renderHabits();
}

function getStreak(habit) {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (habit.days[key]) streak++;
        else if (i > 0) break;
        d.setDate(d.getDate() - 1);
    }
    return streak;
}

function renderHabits() {
    const habitsList = document.getElementById('habitsList');
    if (!habitsList) return;
    habitsList.innerHTML = '';
    const today = todayKey();

    // Build last 7 days keys
    const dayKeys = [];
    const dayLabels = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dayKeys.push(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
        dayLabels.push(['S','M','T','W','T','F','S'][d.getDay()]);
    }

    habits.forEach(h => {
        const streak = getStreak(h);
        const todayDone = !!h.days[today];
        const div = document.createElement('div');
        div.className = 'habit-item';
        div.innerHTML = `
            <button class="habit-today-btn${todayDone ? ' done' : ''}" onclick="toggleHabitDay(${h.id}, '${today}')">
                ${todayDone ? '✓ DONE' : '+ TODAY'}
            </button>
            <span class="habit-name">${escapeHtml(h.name)}</span>
            ${streak > 0 ? `<span class="habit-streak">🔥${streak}</span>` : ''}
            <div class="habit-days">
                ${dayKeys.map((k,i) => `
                    <div class="habit-day${h.days[k] ? ' done' : ''}" 
                         onclick="toggleHabitDay(${h.id}, '${k}')" 
                         title="${k}">${dayLabels[i]}</div>
                `).join('')}
            </div>
            <button class="habit-del" onclick="deleteHabit(${h.id})">✕</button>
        `;
        habitsList.appendChild(div);
    });
}

window.toggleHabitDay = toggleHabitDay;
window.deleteHabit = deleteHabit;

document.getElementById('habitAdd').addEventListener('click', () => {
    const text = document.getElementById('habitInput').value.trim();
    if (text) { addHabit(text); document.getElementById('habitInput').value = ''; }
});

document.getElementById('habitInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const text = document.getElementById('habitInput').value.trim();
        if (text) { addHabit(text); document.getElementById('habitInput').value = ''; }
    }
});

renderHabits();

// ─── QUOTE PANEL ───────────────────────────────────────────
const QUOTES = [
    // Craft & systems
    "Uptime is a habit, not an accident.",
    "Every outage teaches something a dashboard can't.",
    "Ship the small fix today — don't wait for the perfect one.",
    "A clean log is a calm mind.",
    "Automate the boring parts so you can focus on the hard ones.",
    "The fastest fix is the one you never had to make.",
    "Document it now — future you is already busy.",
    "Good monitoring is just good listening, automated.",
    "Backups are cheap. Regret is not.",
    "Read the error message. It is usually telling the truth.",
    "Every system you understand deeply becomes a tool you trust.",
    "The best alert is the one that never had to fire.",
    "Keep the dashboard simple — clarity beats cleverness.",
    "What gets measured gets improved.",
    "A second pair of eyes catches the bug your tired ones missed.",
    "Your future self will thank you for the comment you wrote today.",
    "Complexity is a debt — someone always pays the interest.",
    "The system that fails loudly is kinder than the one that fails silently.",
    "A good incident report is a gift to your next self.",
    "Resilience isn't avoiding failure — it's recovering faster than it spreads.",

    // Discipline & growth
    "Discipline compounds faster than motivation.",
    "Small daily reps beat occasional heroics.",
    "Progress hides inside boring, repeated work.",
    "Consistency turns a skill into a reputation.",
    "Plan for the bad day; build for the good one.",
    "Patience scales better than panic.",
    "Slow is smooth, smooth is fast.",
    "The work you do when no one's watching sets the ceiling for everything else.",
    "Mastery is just beginner's habits, kept long enough.",
    "You don't rise to your goals, you fall to your systems.",
    "Comfort and growth rarely share the same room.",
    "Energy follows attention — guard what you look at.",
    "The standard you walk past is the standard you accept.",
    "Done today beats perfect someday.",
    "A habit missed once is an accident; missed twice is a pattern.",

    // Reflection & mindset
    "Rest is part of the build process, not a break from it.",
    "Most stress is just unrouted attention.",
    "You can't pour from a system that's never backed up.",
    "Quiet days build the strength loud days require.",
    "Not every problem needs solving tonight.",
    "Clarity comes from doing, far more often than from thinking.",
    "The mind, like a server, needs scheduled maintenance.",
    "Worry is a process running with no output.",
    "Some weights are meant to be set down, not carried.",
    "Strength is a quiet, repeated decision — not a single dramatic one.",
    "You are allowed to move slowly and still be moving forward.",
    "A body in motion changes the mood that's driving it.",
    "What you tolerate, you teach others to repeat.",
    "Asking for help is a system design choice, not a weakness.",
    "Every version of you that kept going is still in here somewhere.",

    // More craft & systems
    "Test in staging what you can't afford to break in production.",
    "The configuration you didn't write is the one that breaks at 3am.",
    "A well-named variable saves a future debugging session.",
    "Redundancy is paranoia with a maintenance schedule.",
    "The root cause is rarely where the symptom shows up.",
    "Version control isn't bureaucracy — it's a memory you can trust.",
    "Optimize for the engineer who inherits this, not just for now.",
    "A runbook written calmly is read calmly during chaos.",
    "Latency hides until someone finally measures it.",
    "The simplest architecture that works is the right one — for now.",

    // More discipline & growth
    "Motivation gets you started. Infrastructure keeps you going.",
    "Big leaps are just small steps you stopped counting.",
    "What you repeat, you become — on purpose or by accident.",
    "The boring version of the plan is usually the one that ships.",
    "Skill is just patience that learned to read documentation.",
    "Every expert was once mediocre, just for longer than they admit.",
    "You don't need more time, you need fewer distractions running in the background.",
    "The hardest part of any task is opening the first file.",
    "Discipline is choosing what you want most over what you want now.",
    "Improvement is invisible day to day and obvious year to year.",

    // More reflection & mindset
    "A calm mind processes more requests than an anxious one.",
    "Burnout is just unhandled load over time.",
    "You're allowed to log off — the queue will still be there tomorrow.",
    "Some days the win is just staying online.",
    "Comparison is a process that never returns a useful result.",
    "The voice that says 'not good enough' is rarely citing real data.",
    "Rest isn't a reward for finishing — it's part of the build.",
    "Most anxiety is your mind running a simulation with bad inputs.",
    "You are not behind. You are exactly where your path has taken you.",
    "Healing, like deployment, rarely goes in a straight line.",

    // Curiosity & learning
    "Curiosity is the only debugger that never gets tired.",
    "Ask the dumb question before the expensive mistake.",
    "The fastest way to learn a system is to break it gently.",
    "Every error message is a small lesson, reluctantly given.",
    "Stay a beginner at something — it keeps the rest of you sharp.",
    "Read the docs once fully before you need them urgently.",
    "Understanding beats memorizing — one survives an update, the other doesn't.",
    "The expert was once the person who just kept asking why.",

    // Focus & momentum
    "One tab closed is one less decision pulling at your attention.",
    "Momentum is fragile in the morning and stubborn by noon.",
    "Deep work starts the moment notifications stop winning.",
    "Energy spent switching tasks is energy that built nothing.",
    "A short task done now beats a big task planned forever.",
    "The first ten minutes decide the next two hours.",
    "Protect the first hour — it sets the tone for the rest.",
    "Progress prefers a narrow lane over an open field.",
];

const quoteTextEl = document.getElementById('quoteText');

function dayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now - start) / 86400000);
}

function renderQuote(random = false) {
    const idx = random
        ? Math.floor(Math.random() * QUOTES.length)
        : dayOfYear() % QUOTES.length;
    quoteTextEl.textContent = QUOTES[idx];
}

renderQuote();
document.getElementById('quoteRefresh').addEventListener('click', () => renderQuote(true));

// ─── ZEN MODE ──────────────────────────────────────────────
function toggleZenMode() {
    const on = document.body.classList.toggle('zen-mode');
    showOutput(on ? 'Zen mode on — Alt+Z to exit' : 'Zen mode off', 'info', 2500);
    addLog('cmd', `zen mode ${on ? 'on' : 'off'}`);
}
window.toggleZenMode = toggleZenMode;

// ─── EXPORT / IMPORT (BACKUP & RESTORE) ─────────────────────
function exportData() {
    const data = {};
    Object.entries(SK).forEach(([key, storageKey]) => {
        const val = localStorage.getItem(storageKey);
        if (val !== null) data[storageKey] = val;
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `command-center-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showOutput('Backup downloaded.', 'success');
    addLog('cmd', ':export');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
            showOutput('Backup restored. Reloading...', 'success', 2000);
            addLog('cmd', ':import');
            setTimeout(() => location.reload(), 1200);
        } catch {
            showOutput('Invalid backup file.', 'error');
        }
    };
    reader.readAsText(file);
}

document.getElementById('exportBtn').addEventListener('click', exportData);
document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
});

// ─── COMMAND PROCESSOR ─────────────────────────────────────
const AUTOCOMPLETE_LIST = [
    ':calc', ':clear', ':todo', ':time', ':help', ':ping',
    ':theme', ':engine', ':bg', ':pomo', ':myip', ':price',
    ':weather', ':log', ':timer', ':links', ':clip',
    ':convert', ':flip', ':roll', ':zen', ':sound', ':export', ':import',
];

const COMMANDS = {
    ':calc': (args) => {
        try {
            const safe = args.replace(/[^0-9+\-*/().,% ]/g, '');
            if (!safe.trim()) { showOutput('Usage: :calc 2+2', 'error'); return; }
            const result = Function(`"use strict"; return (${safe})`)();
            showOutput(`= ${result}`, 'success', 6000);
            addLog('result', `:calc ${args} = ${result}`);
        } catch { showOutput('Invalid expression', 'error'); }
    },

    ':clear': () => {
        notesArea.value = '';
        localStorage.removeItem(SK.NOTES);
        showOutput('Notes cleared.', 'info');
        addLog('cmd', ':clear');
    },

    ':todo': (args) => {
        const [action, ...rest] = args.split(' ');
        const text = rest.join(' ').trim();
        if (action === 'add' && text) {
            addTodo(text);
            showOutput(`Task added: ${text}`, 'success');
            addLog('cmd', `:todo add ${text}`);
        } else if (action === 'clear') {
            todos = [];
            saveTodos();
            renderTodos();
            showOutput('All tasks cleared.', 'info');
            addLog('cmd', ':todo clear');
        } else {
            showOutput('Usage: :todo add <task> | :todo clear', 'info');
        }
    },

    ':time': () => {
        const now = new Date();
        const t = now.toLocaleString('en-US', { timeZone: 'Asia/Dubai', dateStyle: 'full', timeStyle: 'long' });
        showOutput(t, 'info', 8000);
        addLog('result', t);
    },

    ':help': () => {
        showOutput(':calc :todo :clear :time :ping :pomo :timer :theme :engine :bg :price :myip :weather :log :clip :convert :flip :roll :zen :export :import — or type to search', 'info', 10000);
        addLog('cmd', ':help');
    },

    ':ping': () => {
        showOutput('PONG — command center online ✓', 'success');
        addLog('result', 'PONG');
    },

    ':theme': (args) => {
        const name = args.trim().toLowerCase();
        if (!THEMES.includes(name)) {
            showOutput(`Themes: ${THEMES.join(' / ')}`, 'info');
        } else {
            applyTheme(name);
            showOutput(`Theme → ${name}`, 'success');
            addLog('cmd', `:theme ${name}`);
        }
    },

    ':engine': (args) => {
        const name = args.trim().toLowerCase();
        setEngine(name);
        addLog('cmd', `:engine ${name}`);
    },

    ':bg': (args) => {
        const mode = args.trim().toLowerCase();
        const valid = ['matrix', 'stars', 'clean', 'grid', 'aurora'];
        if (!valid.includes(mode)) {
            showOutput(`Modes: ${valid.join(' / ')}`, 'info');
        } else {
            applyBg(mode);
            showOutput(`Background → ${mode}`, 'success');
            addLog('cmd', `:bg ${mode}`);
        }
    },

    ':pomo': (args) => {
        const sub = args.trim().toLowerCase();
        if (sub === 'start' || sub === '') {
            pomoControl('toggle');
        } else if (sub === 'stop' || sub === 'pause') {
            if (pomoState.running) pomoControl('toggle');
        } else if (sub === 'reset') {
            pomoControl('reset');
        } else if (sub === 'status') {
            const m = String(Math.floor(pomoState.remaining / 60)).padStart(2, '0');
            const s = String(pomoState.remaining % 60).padStart(2, '0');
            showOutput(`Pomodoro: ${pomoState.phase.toUpperCase()} · ${m}:${s} remaining · ${pomoState.sessions} sessions`, 'info', 6000);
        } else {
            showOutput('Usage: :pomo start/stop/reset/status', 'info');
        }
    },

    ':timer': (args) => {
        const sub = args.trim().toLowerCase();
        if (!sub || sub === 'start') {
            timerControl('toggle');
        } else if (sub === 'reset') {
            timerControl('reset');
        } else if (sub === 'lap') {
            timerControl('lap');
        } else if (sub === 'stopwatch') {
            switchTimerMode('stopwatch');
        } else {
            // treat as countdown time
            switchTimerMode('countdown');
            timerInput.value = sub;
            setCountdown();
        }
        addLog('cmd', `:timer ${args}`);
    },

    ':links': (args) => {
        const sub = args.trim().toLowerCase();
        if (sub === 'edit') {
            openEditLinks();
        } else if (sub === 'reset') {
            userLinks = [...DEFAULT_LINKS];
            localStorage.removeItem(SK.LINKS);
            renderLinks();
            showOutput('Quick access reset to defaults.', 'success');
        } else {
            showOutput('Usage: :links edit | :links reset', 'info');
        }
        addLog('cmd', `:links ${args}`);
    },

    ':myip': () => {
        showOutput('Fetching IP info...', 'info', 2000);
        fetchMyIP();
        addLog('cmd', ':myip');
    },

    ':price': (args) => {
        const ticker = args.trim();
        if (!ticker) { showOutput('Usage: :price BTC / ETH / AED / EUR', 'info'); return; }
        showOutput(`Fetching ${ticker.toUpperCase()}...`, 'info', 2000);
        fetchPrice(ticker);
        addLog('cmd', `:price ${ticker}`);
    },

    ':weather': () => {
        weatherVal.textContent = 'REFRESHING...';
        showOutput('Refreshing weather...', 'info', 2000);
        initWeather();
        addLog('cmd', ':weather refresh');
    },

    ':log': (args) => {
        if (args.trim() === 'clear') {
            clearLog();
        } else {
            showOutput(`Log has ${logStore.length} entries. Use :log clear to wipe.`, 'info');
        }
    },

    ':clip': (args) => {
        const n = parseInt(args.trim());
        if (!args.trim()) {
            if (clipHistory.length === 0) { showOutput('Clipboard history empty.', 'info'); return; }
            const list = clipHistory.map((c, i) => `[${i}] ${c.substring(0, 40)}`).join(' · ');
            showOutput(list, 'info', 10000);
        } else if (!isNaN(n) && clipHistory[n]) {
            navigator.clipboard.writeText(clipHistory[n]).then(() => {
                showOutput(`Copied item ${n} to clipboard.`, 'success');
            }).catch(() => {
                showOutput(`[${n}] ${clipHistory[n].substring(0, 80)}`, 'info', 8000);
            });
        } else {
            showOutput('Usage: :clip (list) | :clip <n>', 'info');
        }
    },

    ':convert': (args) => {
        const parts = args.trim().split(/\s+/);
        if (parts.length !== 3) { showOutput('Usage: :convert 10 km mi', 'info'); return; }
        const [valStr, from, to] = parts;
        const val = parseFloat(valStr);
        if (isNaN(val)) { showOutput('Invalid number.', 'error'); return; }
        const f = from.toLowerCase(), t = to.toLowerCase();
        const CONVERSIONS = {
            'km->mi': v => v * 0.621371, 'mi->km': v => v / 0.621371,
            'kg->lb': v => v * 2.20462,  'lb->kg': v => v / 2.20462,
            'c->f':   v => v * 9/5 + 32, 'f->c':   v => (v - 32) * 5/9,
            'm->ft':  v => v * 3.28084,  'ft->m':  v => v / 3.28084,
            'l->gal': v => v * 0.264172, 'gal->l': v => v / 0.264172,
            'cm->in': v => v / 2.54,     'in->cm': v => v * 2.54,
        };
        const key = `${f}->${t}`;
        if (!CONVERSIONS[key]) { showOutput(`Unsupported: ${f} → ${t}. Try km/mi, kg/lb, c/f, m/ft, l/gal, cm/in.`, 'info'); return; }
        const result = CONVERSIONS[key](val);
        showOutput(`${val} ${f} = ${result.toFixed(2)} ${t}`, 'success', 6000);
        addLog('result', `:convert ${args} = ${result.toFixed(2)}`);
    },

    ':flip': () => {
        const result = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
        showOutput(`🪙 ${result}`, 'success', 4000);
        addLog('result', `:flip = ${result}`);
    },

    ':roll': (args) => {
        const sides = parseInt(args.trim()) || 6;
        const result = Math.floor(Math.random() * sides) + 1;
        showOutput(`🎲 Rolled ${result} (d${sides})`, 'success', 4000);
        addLog('result', `:roll d${sides} = ${result}`);
    },

    ':zen': () => toggleZenMode(),

    ':sound': (args) => {
        const sub = args.trim().toLowerCase();
        if (sub === 'on') setAllSound(true);
        else if (sub === 'off') setAllSound(false);
        else if (['hover', 'click', 'type', 'alert'].includes(sub)) {
            soundSettings[sub] = !soundSettings[sub];
            saveSoundSettings();
            updateSoundUI();
            showOutput(`${sub} sound ${soundSettings[sub] ? 'on' : 'off'}.`, 'info', 2000);
            addLog('cmd', `:sound ${sub}`);
            return;
        } else {
            setAllSound(!(soundSettings.hover || soundSettings.click || soundSettings.type || soundSettings.alert));
        }
        const anyOn = soundSettings.hover || soundSettings.click || soundSettings.type || soundSettings.alert;
        showOutput(`Sound effects ${anyOn ? 'on' : 'off'}.`, 'info', 2000);
        addLog('cmd', `:sound ${anyOn ? 'on' : 'off'}`);
    },

    ':export': () => exportData(),

    ':import': () => document.getElementById('importFile').click(),
};

// ─── COMMAND INPUT EVENTS ──────────────────────────────────
commandInput.addEventListener('keydown', (e) => {
    const ddVisible = !cmdDropdown.classList.contains('hidden');

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (ddVisible && dropdownItems.length) {
            dropdownIdx = dropdownIdx <= 0 ? dropdownItems.length - 1 : dropdownIdx - 1;
            updateDropdownActive();
        } else if (histIdx < cmdHistory.length - 1) {
            histIdx++;
            commandInput.value = cmdHistory[histIdx];
        }
        return;
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (ddVisible && dropdownItems.length) {
            dropdownIdx = dropdownIdx >= dropdownItems.length - 1 ? 0 : dropdownIdx + 1;
            updateDropdownActive();
        } else if (histIdx > 0) {
            histIdx--;
            commandInput.value = cmdHistory[histIdx];
        } else {
            histIdx = -1;
            commandInput.value = '';
        }
        return;
    }
    if (e.key === 'Tab' || (e.key === 'Enter' && ddVisible && dropdownIdx >= 0)) {
        e.preventDefault();
        if (ddVisible && dropdownIdx >= 0) {
            commandInput.value = dropdownItems[dropdownIdx].cmd + ' ';
            hideDropdown();
        } else if (e.key === 'Tab') {
            const val = commandInput.value;
            const match = AUTOCOMPLETE_LIST.find(c => c.startsWith(val) && c !== val);
            if (match) commandInput.value = match + ' ';
        }
        return;
    }

    if (e.key === 'Enter') {
        const query = commandInput.value.trim();
        if (!query) return;

        pushHistory(query);
        addLog('cmd', query);

        const [cmd, ...argParts] = query.split(' ');
        const args = argParts.join(' ');

        if (COMMANDS[cmd]) {
            COMMANDS[cmd](args);
        } else {
            const url = ENGINES[currentEngine](encodeURIComponent(query));
            window.open(url, '_blank');
            addLog('result', `search: ${query} via ${currentEngine}`);
        }
        commandInput.value = '';
    }

    if (e.key === 'Escape') {
        if (!cmdDropdown.classList.contains('hidden')) {
            hideDropdown();
        } else {
            commandInput.value = '';
            commandInput.blur();
            hideOutput();
        }
    }
});

// ─── COMMAND DROPDOWN ──────────────────────────────────────
const CMD_CATALOG = [
    { cmd: ':calc',    desc: 'Calculator',            usage: ':calc 2+2' },
    { cmd: ':todo',    desc: 'Task manager',          usage: ':todo add <task>' },
    { cmd: ':pomo',    desc: 'Pomodoro timer',        usage: ':pomo start/stop/reset' },
    { cmd: ':timer',   desc: 'Stopwatch/Countdown',   usage: ':timer 5:00 | :timer lap' },
    { cmd: ':theme',   desc: 'Switch theme',          usage: '26 themes · or click 🎨 THEME' },
    { cmd: ':engine',  desc: 'Search engine',         usage: 'google/duckduckgo/bing/brave/ecosia/startpage/yahoo/perplexity' },
    { cmd: ':bg',      desc: 'Background mode',       usage: 'matrix/stars/clean/grid/aurora' },
    { cmd: ':price',   desc: 'Crypto/currency price', usage: ':price BTC' },
    { cmd: ':weather', desc: 'Refresh weather',       usage: ':weather' },
    { cmd: ':myip',    desc: 'Network info',          usage: ':myip' },
    { cmd: ':log',     desc: 'Command log',           usage: ':log clear' },
    { cmd: ':clip',    desc: 'Clipboard history',     usage: ':clip <n>' },
    { cmd: ':links',   desc: 'Edit quick access',     usage: ':links edit | :links reset' },
    { cmd: ':convert', desc: 'Unit converter',        usage: ':convert 10 km mi' },
    { cmd: ':flip',    desc: 'Coin flip',             usage: ':flip' },
    { cmd: ':roll',    desc: 'Dice roll',             usage: ':roll 20' },
    { cmd: ':zen',     desc: 'Zen / focus mode',      usage: 'Alt+Z' },
    { cmd: ':sound',   desc: 'Toggle hover/click/type sfx', usage: ':sound on/off/hover/click/type' },
    { cmd: ':export',  desc: 'Backup all data',       usage: ':export' },
    { cmd: ':import',  desc: 'Restore from backup',   usage: ':import' },
    { cmd: ':clear',   desc: 'Wipe notes',            usage: ':clear' },
    { cmd: ':time',    desc: 'Show current time',     usage: ':time' },
    { cmd: ':help',    desc: 'Show all commands',     usage: ':help' },
    { cmd: ':ping',    desc: 'Connection check',      usage: ':ping' },
];

const cmdDropdown = document.getElementById('cmdDropdown');
let dropdownIdx = -1;
let dropdownItems = [];

function showDropdown(matches) {
    dropdownItems = matches;
    dropdownIdx = -1;
    cmdDropdown.innerHTML = '';
    if (!matches.length) { cmdDropdown.classList.add('hidden'); return; }
    matches.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'cmd-dropdown-item';
        div.innerHTML = `<span class="cmd-dropdown-cmd">${item.cmd}</span><span class="cmd-dropdown-desc">${item.desc}</span><span class="cmd-dropdown-shortcut">${item.usage}</span>`;
        div.addEventListener('mousedown', (e) => {
            e.preventDefault();
            commandInput.value = item.cmd + ' ';
            hideDropdown();
            commandInput.focus();
        });
        cmdDropdown.appendChild(div);
    });
    cmdDropdown.classList.remove('hidden');
}

function hideDropdown() {
    cmdDropdown.classList.add('hidden');
    dropdownIdx = -1;
    dropdownItems = [];
}

function updateDropdownActive() {
    [...cmdDropdown.querySelectorAll('.cmd-dropdown-item')].forEach((el, i) => {
        el.classList.toggle('active', i === dropdownIdx);
    });
}

commandInput.addEventListener('blur', () => setTimeout(hideDropdown, 150));

const cmdHint = document.getElementById('cmdHint');
commandInput.addEventListener('input', () => {
    const val = commandInput.value;
    const hint = cmdHint;

    if (val.startsWith(':')) {
        const hasArgs = val.includes(' ');
        const matches = CMD_CATALOG.filter(c => c.cmd.startsWith(val.split(' ')[0]));
        if (!hasArgs && matches.length) {
            showDropdown(matches);
        } else {
            hideDropdown();
        }
        const trimmed = val.trim();
        if (trimmed.startsWith(':calc '))        hint.textContent = 'e.g. 2+2*3';
        else if (trimmed.startsWith(':todo '))   hint.textContent = 'add <task> | clear';
        else if (trimmed.startsWith(':theme '))  hint.textContent = '26 themes — try dark/light/cyber/sakura/void/midnight/lavender/copper...';
        else if (trimmed.startsWith(':engine ')) hint.textContent = 'google / duckduckgo / bing / brave / ecosia / startpage / yahoo / perplexity';
        else if (trimmed.startsWith(':bg '))     hint.textContent = 'matrix / stars / clean / grid / aurora';
        else if (trimmed.startsWith(':pomo'))    hint.textContent = 'start / stop / reset / status';
        else if (trimmed.startsWith(':timer '))  hint.textContent = 'HH:MM:SS or MM:SS (countdown) | lap | reset | stopwatch';
        else if (trimmed.startsWith(':price '))  hint.textContent = 'BTC / ETH / AED / EUR...';
        else if (trimmed.startsWith(':links '))  hint.textContent = 'edit | reset';
        else hint.textContent = '';
    } else {
        hideDropdown();
        hint.textContent = val.length > 0 ? `↵ search ${currentEngine}` : '';
    }
});

// ─── GLOBAL KEYBOARD ───────────────────────────────────────
document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        commandInput.focus();
        return;
    }

    if (e.key === '?' && !isInput) {
        e.preventDefault();
        toggleModal();
        return;
    }

    // Escape closes fullscreen too
    if (e.key === 'Escape') {
        if (!fullscreenOverlay.classList.contains('hidden')) {
            exitFullscreen();
            return;
        }
        if (!shortcutModal.classList.contains('hidden')) {
            shortcutModal.classList.add('hidden');
            return;
        }
        if (!editLinksModal.classList.contains('hidden')) {
            editLinksModal.classList.add('hidden');
            return;
        }
        if (!themeModal.classList.contains('hidden')) {
            themeModal.classList.add('hidden');
            return;
        }
        if (document.body.classList.contains('zen-mode')) {
            toggleZenMode();
            return;
        }
    }

    if (e.altKey && !e.ctrlKey) {
        const key = e.key.toUpperCase();
        if (key === 'N') { e.preventDefault(); notesArea.focus(); return; }
        if (key === 'T') { e.preventDefault(); todoInput.focus(); return; }
        if (key === 'P') { e.preventDefault(); pomoControl('toggle'); return; }
        if (key === 'R') { e.preventDefault(); initWeather(); showOutput('Refreshing weather...', 'info', 2000); return; }
        if (key === 'Z') { e.preventDefault(); toggleZenMode(); return; }
        const link = document.querySelector(`.link-item[data-key="${key}"]`);
        if (link) { e.preventDefault(); link.click(); }
    }
});

// Autofocus only on non-touch devices — popping the mobile keyboard
// immediately on load causes a jarring viewport/layout shift on phones.
if (!window.matchMedia('(pointer: coarse)').matches) commandInput.focus();

// ─── SHORTCUT MODAL ────────────────────────────────────────
function toggleModal() {
    shortcutModal.classList.toggle('hidden');
}

document.getElementById('modalClose').addEventListener('click', () => {
    shortcutModal.classList.add('hidden');
});

shortcutModal.addEventListener('click', (e) => {
    if (e.target === shortcutModal) shortcutModal.classList.add('hidden');
});

// ─── NOTES ─────────────────────────────────────────────────
notesArea.value = localStorage.getItem(SK.NOTES) || '';

let notesTimer = null;
const saveNotesDebounced = debounce(() => localStorage.setItem(SK.NOTES, notesArea.value), 400);
notesArea.addEventListener('input', () => {
    saveNotesDebounced();
    notesSaved.textContent = 'SAVED';
    notesSaved.classList.add('show');
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => notesSaved.classList.remove('show'), 1500);
});
// Flush immediately when leaving the field so nothing is lost mid-debounce
notesArea.addEventListener('blur', () => localStorage.setItem(SK.NOTES, notesArea.value));

// ─── TODO ──────────────────────────────────────────────────
let todos = JSON.parse(localStorage.getItem(SK.TODOS) || '[]');

function saveTodos() { localStorage.setItem(SK.TODOS, JSON.stringify(todos)); }

function addTodo(text) {
    todos.unshift({ id: Date.now(), text, done: false });
    saveTodos();
    renderTodos();
}

function toggleTodo(id) {
    const t = todos.find(t => t.id === id);
    if (t) { t.done = !t.done; saveTodos(); renderTodos(); }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
}

function renderTodos() {
    todoList.innerHTML = '';
    const active = todos.filter(t => !t.done);
    const done   = todos.filter(t => t.done);
    todoCount.textContent = active.length;

    [...active, ...done].forEach(t => {
        const li = document.createElement('li');
        li.className = `todo-item${t.done ? ' done' : ''}`;
        li.innerHTML = `
            <div class="todo-check" onclick="toggleTodo(${t.id})">${t.done ? '✓' : ''}</div>
            <span class="todo-text">${escapeHtml(t.text)}</span>
            <button class="todo-del" onclick="deleteTodo(${t.id})">✕</button>
        `;
        todoList.appendChild(li);
    });
}

function escapeHtml(str) {
    if (typeof str !== 'string') return String(str);
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;

todoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const text = todoInput.value.trim();
        if (text) { addTodo(text); todoInput.value = ''; addLog('cmd', `:todo add ${text}`); }
    }
});

document.getElementById('todoAdd').addEventListener('click', () => {
    const text = todoInput.value.trim();
    if (text) { addTodo(text); todoInput.value = ''; addLog('cmd', `:todo add ${text}`); }
});

renderTodos();

// ─── CLEAR ALL DATA ────────────────────────────────────────
window.clearAllData = function() {
    if (!confirm('Clear ALL data? This cannot be undone.')) return;
    Object.values(SK).forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    location.reload();
};

// ─── INIT LOG ──────────────────────────────────────────────
addLog('result', 'Command Center initialized');
