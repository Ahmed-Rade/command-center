// ─── STORAGE KEYS ───────────────────────────────────────────
const SK = {
    NOTES:     'cc_notes',
    TODOS:     'cc_todos',
    ENGINE:    'cc_engine',
    THEME:     'cc_theme',
    BG:        'cc_bg',
    POMO_SESS: 'cc_pomo_sessions',
};

// ─── ELEMENTS ───────────────────────────────────────────────
const greetingEl   = document.getElementById('greeting');
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

const startTime = Date.now();
const RING_CIRC = 263.9;

// ─── CLOCK & GREETING ──────────────────────────────────────
function updateTime() {
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const h12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    clockEl.textContent = `${String(h12).padStart(2, '0')}:${m}:${s} ${ampm}`;

    let greeting;
    if (h >= 4 && h < 12)       greeting = '> GOOD MORNING, AHMED';
    else if (h >= 12 && h < 17) greeting = '> GOOD AFTERNOON, AHMED';
    else if (h >= 17 && h < 21) greeting = '> GOOD EVENING, AHMED';
    else                         greeting = '> GOOD NIGHT, AHMED';
    greetingEl.textContent = greeting;

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
async function updateBattery() {
    if (!navigator.getBattery) { batteryVal.textContent = 'N/A'; return; }
    try {
        const bat = await navigator.getBattery();
        const pct = Math.round(bat.level * 100);
        const charging = bat.charging ? ' ⚡' : '';
        batteryVal.textContent = `${pct}%${charging}`;
        batteryVal.style.color = pct > 50 ? 'var(--text-accent)' : pct > 20 ? 'var(--text-yellow)' : 'var(--text-red)';
        bat.addEventListener('levelchange', updateBattery);
        bat.addEventListener('chargingchange', updateBattery);
    } catch { batteryVal.textContent = 'N/A'; }
}
updateBattery();

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
        weatherVal.textContent  = 'AJMAN, UAE (--°C)';
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
            () => fetchWeather()
        );
    } else {
        fetchWeather();
    }
}

initWeather();
setInterval(initWeather, 30 * 60 * 1000); // every 30 min

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
    window.addEventListener('resize', resize);

    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';

    function draw() {
        if (!matrixEnabled) return;
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

    setInterval(draw, 80);
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
    window.addEventListener('resize', resize);

    window.setStarsBg = (enabled) => {
        starsEnabled = enabled;
        starsCanvas.style.opacity = enabled ? '0.6' : '0';
    };

    function draw() {
        if (!starsEnabled) return;
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

    setInterval(draw, 50);
})();

// ─── BACKGROUND SWITCHER ───────────────────────────────────
function applyBg(mode) {
    localStorage.setItem(SK.BG, mode);
    matrixEnabled = false;
    matrixCanvas.style.opacity = '0';
    window.setStarsBg(false);
    document.body.classList.remove('bg-grid');

    if (mode === 'matrix') {
        matrixEnabled = true;
        matrixCanvas.style.opacity = '0.03';
    } else if (mode === 'stars') {
        window.setStarsBg(true);
    } else if (mode === 'grid') {
        document.body.classList.add('bg-grid');
    }
    // 'clean' → nothing
}

const savedBg = localStorage.getItem(SK.BG) || 'matrix';
applyBg(savedBg);

// ─── THEME ─────────────────────────────────────────────────
const THEMES = ['dark', 'light', 'solarized', 'dracula'];

function applyTheme(name) {
    document.documentElement.className = document.documentElement.className
        .replace(/theme-\w+/g, '').trim();
    if (name !== 'dark') document.documentElement.classList.add(`theme-${name}`);
    localStorage.setItem(SK.THEME, name);
}

applyTheme(localStorage.getItem(SK.THEME) || 'dark');

// ─── SEARCH ENGINE ─────────────────────────────────────────
const ENGINES = {
    google:     q => `https://www.google.com/search?q=${q}`,
    duckduckgo: q => `https://duckduckgo.com/?q=${q}`,
    bing:       q => `https://www.bing.com/search?q=${q}`,
};

let currentEngine = localStorage.getItem(SK.ENGINE) || 'google';
engineInd.textContent = currentEngine.toUpperCase();

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
let logStore = [];

function addLog(type, msg) {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    logStore.unshift({ type, msg, ts });
    if (logStore.length > 100) logStore.pop();
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

// ─── POMODORO ──────────────────────────────────────────────
let pomoState = {
    running: false,
    phase: 'work',   // 'work' | 'break'
    total: 25 * 60,
    remaining: 25 * 60,
    sessions: parseInt(localStorage.getItem(SK.POMO_SESS) || '0'),
    interval: null,
};

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
            pomoState.phase = 'break';
            pomoState.total = 5 * 60;
            pomoState.remaining = 5 * 60;
            showOutput('🍅 Work session complete! Take a break.', 'success', 6000);
        } else {
            pomoState.phase = 'work';
            pomoState.total = 25 * 60;
            pomoState.remaining = 25 * 60;
            showOutput('Break over — back to work!', 'info', 6000);
        }

        if (Notification.permission === 'granted') {
            new Notification('Pomodoro', {
                body: pomoState.phase === 'work' ? 'Break over! Back to work.' : 'Session done! Take a 5 min break.',
                icon: '🍅',
            });
        }

        pomoStartBtn.textContent = '▶ START';
        updatePomoDisplay();
        addLog('result', `Pomodoro: ${pomoState.phase === 'break' ? 'work done' : 'break done'}`);
        return;
    }
    pomoState.remaining--;
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
            // request notification permission
            if (Notification.permission === 'default') Notification.requestPermission();
            pomoState.running = true;
            pomoState.interval = setInterval(pomoTick, 1000);
            pomoStartBtn.textContent = '⏸ PAUSE';
            addLog('cmd', ':pomo start');
        }
    } else if (action === 'reset') {
        clearInterval(pomoState.interval);
        pomoState.running = false;
        pomoState.phase = 'work';
        pomoState.total = 25 * 60;
        pomoState.remaining = 25 * 60;
        pomoStartBtn.textContent = '▶ START';
        updatePomoDisplay();
        addLog('cmd', ':pomo reset');
    }
};

updatePomoDisplay();

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
        // Use exchangerate-api for fiat, coingecko-style for crypto
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

// ─── COMMAND PROCESSOR ─────────────────────────────────────
const AUTOCOMPLETE_LIST = [
    ':calc', ':clear', ':todo', ':time', ':help', ':ping',
    ':theme', ':engine', ':bg', ':pomo', ':myip', ':price',
    ':weather', ':log',
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
        showOutput(':calc  :todo  :clear  :time  :ping  :pomo  :theme  :engine  :bg  :price  :myip  :weather  :log  — or type to search', 'info', 10000);
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
        const valid = ['matrix', 'stars', 'clean', 'grid'];
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
    { cmd: ':theme',   desc: 'Switch theme',          usage: 'dark/light/solarized/dracula' },
    { cmd: ':engine',  desc: 'Search engine',         usage: 'google/duckduckgo/bing' },
    { cmd: ':bg',      desc: 'Background mode',       usage: 'matrix/stars/clean/grid' },
    { cmd: ':price',   desc: 'Crypto/currency price', usage: ':price BTC' },
    { cmd: ':weather', desc: 'Refresh weather',       usage: ':weather' },
    { cmd: ':myip',    desc: 'Network info',          usage: ':myip' },
    { cmd: ':log',     desc: 'Command log',           usage: ':log clear' },
    { cmd: ':clip',    desc: 'Clipboard history',     usage: ':clip <n>' },
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

// Live hint + dropdown
commandInput.addEventListener('input', () => {
    const val = commandInput.value;
    const hint = document.getElementById('cmdHint');

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
        else if (trimmed.startsWith(':theme '))  hint.textContent = 'dark / light / solarized / dracula';
        else if (trimmed.startsWith(':engine ')) hint.textContent = 'google / duckduckgo / bing';
        else if (trimmed.startsWith(':bg '))     hint.textContent = 'matrix / stars / clean / grid';
        else if (trimmed.startsWith(':pomo'))    hint.textContent = 'start / stop / reset / status';
        else if (trimmed.startsWith(':price '))  hint.textContent = 'BTC / ETH / AED / EUR...';
        else hint.textContent = '';
    } else {
        hideDropdown();
        hint.textContent = val.length > 0 ? `↵ search ${currentEngine}` : '';
    }
});

// ─── GLOBAL KEYBOARD ───────────────────────────────────────
document.addEventListener('keydown', (e) => {
    // Skip if typing in an input
    const tag = e.target.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        commandInput.focus();
        return;
    }

    // ? → shortcut modal
    if (e.key === '?' && !isInput) {
        e.preventDefault();
        toggleModal();
        return;
    }

    // Alt+letter shortcuts
    if (e.altKey && !e.ctrlKey) {
        const key = e.key.toUpperCase();
        if (key === 'N') { e.preventDefault(); notesArea.focus(); return; }
        if (key === 'T') { e.preventDefault(); todoInput.focus(); return; }
        if (key === 'P') { e.preventDefault(); pomoControl('toggle'); return; }
        if (key === 'R') { e.preventDefault(); initWeather(); showOutput('Refreshing weather...', 'info', 2000); return; }
        const link = document.querySelector(`.link-item[data-key="${key}"]`);
        if (link) { e.preventDefault(); link.click(); }
    }
});

commandInput.focus();

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

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !shortcutModal.classList.contains('hidden')) {
        shortcutModal.classList.add('hidden');
    }
});

// ─── NOTES ─────────────────────────────────────────────────
notesArea.value = localStorage.getItem(SK.NOTES) || '';

let notesTimer = null;
notesArea.addEventListener('input', () => {
    localStorage.setItem(SK.NOTES, notesArea.value);
    notesSaved.textContent = 'SAVED';
    notesSaved.classList.add('show');
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => notesSaved.classList.remove('show'), 1500);
});

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
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

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

// ─── LINK HOVER GLITCH ─────────────────────────────────────
document.querySelectorAll('.link-item').forEach(link => {
    link.addEventListener('mouseenter', () => {
        const icon = link.querySelector('.link-icon');
        if (!icon) return;
        const orig = icon.textContent;
        const glyphs = '⚡◈◉▸▹▻✦✧';
        let i = 0;
        const interval = setInterval(() => {
            icon.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
            if (++i >= 4) { clearInterval(interval); icon.textContent = orig; }
        }, 60);
    });
});

// ─── INIT LOG ──────────────────────────────────────────────
addLog('result', 'Command Center initialized');
