// ─── STORAGE KEYS ───────────────────────────────────────────
const SK = {
    NOTES:       'cc_notes',
    TODOS:       'cc_todos',
    ENGINE:      'cc_engine',
    THEME:       'cc_theme',
    BG:          'cc_bg',
    POMO_SESS:   'cc_pomo_sessions',
    POMO_STATE:  'cc_pomo_state',
    TIMER_STATE: 'cc_timer_state',
    LINKS:       'cc_links',
    HABITS:      'cc_habits',
    LOG:         'cc_log',
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
const linksGrid    = document.getElementById('linksGrid');

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
    if (h >= 4 && h < 12)       greeting = '> GOOD MORNING, USER';
    else if (h >= 12 && h < 17) greeting = '> GOOD AFTERNOON, USER';
    else if (h >= 17 && h < 21) greeting = '> GOOD EVENING, USER';
    else                         greeting = '> GOOD NIGHT, USER';
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
            () => fetchWeather()
        );
    } else {
        fetchWeather();
    }
}

initWeather();
setInterval(initWeather, 30 * 60 * 1000);

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
}

const savedBg = localStorage.getItem(SK.BG) || 'matrix';
applyBg(savedBg);

// ─── THEME ─────────────────────────────────────────────────
const THEMES = ['dark', 'light', 'solarized', 'dracula', 'minimal', 'cyber', 'nord', 'mocha'];

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
};

window.enterFullscreen = function(panelKey) {
    const panelId = PANEL_MAP[panelKey];
    if (!panelId) return;
    const panel = document.getElementById(panelId);
    if (!panel) return;

    fullscreenOrigPanel = { panel, parent: panel.parentNode, next: panel.nextSibling };
    fullscreenInner.appendChild(panel);
    fullscreenOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    addLog('cmd', `fullscreen: ${panelKey}`);
};

function exitFullscreen() {
    if (!fullscreenOrigPanel) return;
    const { panel, parent, next } = fullscreenOrigPanel;
    if (next) {
        parent.insertBefore(panel, next);
    } else {
        parent.appendChild(panel);
    }
    fullscreenOverlay.classList.add('hidden');
    document.body.style.overflow = '';
    fullscreenOrigPanel = null;
}

fullscreenClose.addEventListener('click', exitFullscreen);
fullscreenOverlay.addEventListener('click', (e) => {
    if (e.target === fullscreenOverlay) exitFullscreen();
});

// ─── POMODORO ──────────────────────────────────────────────
const _savedPomo = JSON.parse(localStorage.getItem(SK.POMO_STATE) || 'null');
let pomoState = {
    running: false,
    phase:     _savedPomo?.phase     || 'work',
    total:     _savedPomo?.total     || 25 * 60,
    remaining: _savedPomo?.remaining || 25 * 60,
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
        savePomoState();
        updatePomoDisplay();
        addLog('cmd', ':pomo reset');
    }
};

updatePomoDisplay();

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
        saveTimerState();
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
            if (Notification.permission === 'granted') {
                new Notification('Timer', { body: 'Countdown complete!' });
            }
            return;
        }
        updateTimerDisplay();
        saveTimerState();
    }
}

window.timerControl = function(action) {
    if (action === 'toggle') {
        if (timerState.running) {
            clearInterval(timerState.interval);
            timerState.running = false;
            timerStartBtn.textContent = '▶ RESUME';
            addLog('cmd', 'timer pause');
        } else {
            if (timerState.mode === 'countdown' && timerState.countdownRemaining <= 0) {
                showOutput('Set a countdown time first.', 'info');
                return;
            }
            if (Notification.permission === 'default') Notification.requestPermission();
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
    if (Notification.permission === 'default') Notification.requestPermission();
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
    if (Notification.permission === 'default') Notification.requestPermission();
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
    if (Notification.permission === 'default') Notification.requestPermission();
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

// ─── COMMAND PROCESSOR ─────────────────────────────────────
const AUTOCOMPLETE_LIST = [
    ':calc', ':clear', ':todo', ':time', ':help', ':ping',
    ':theme', ':engine', ':bg', ':pomo', ':myip', ':price',
    ':weather', ':log', ':timer', ':links',
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
        showOutput(':calc  :todo  :clear  :time  :ping  :pomo  :timer  :theme  :engine  :bg  :price  :myip  :weather  :log  :links — or type to search', 'info', 10000);
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
    { cmd: ':theme',   desc: 'Switch theme',          usage: 'dark/light/solarized/dracula/minimal/cyber/nord/mocha' },
    { cmd: ':engine',  desc: 'Search engine',         usage: 'google/duckduckgo/bing' },
    { cmd: ':bg',      desc: 'Background mode',       usage: 'matrix/stars/clean/grid' },
    { cmd: ':price',   desc: 'Crypto/currency price', usage: ':price BTC' },
    { cmd: ':weather', desc: 'Refresh weather',       usage: ':weather' },
    { cmd: ':myip',    desc: 'Network info',          usage: ':myip' },
    { cmd: ':log',     desc: 'Command log',           usage: ':log clear' },
    { cmd: ':clip',    desc: 'Clipboard history',     usage: ':clip <n>' },
    { cmd: ':links',   desc: 'Edit quick access',     usage: ':links edit | :links reset' },
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
        else if (trimmed.startsWith(':theme '))  hint.textContent = 'dark / light / solarized / dracula / minimal / cyber / nord / mocha';
        else if (trimmed.startsWith(':engine ')) hint.textContent = 'google / duckduckgo / bing';
        else if (trimmed.startsWith(':bg '))     hint.textContent = 'matrix / stars / clean / grid';
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
    }

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
