// Command Center — simple layer (loads after script.js)
(function () {
    const $ = (s) => document.querySelector(s);
    const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } };
    const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
    const ar = () => document.documentElement.lang === 'ar';

    // ── Text size (A− / A+) ──
    const SIZES = [1, 1.15, 1.3, 1.5];
    let si = Math.min(SIZES.length - 1, Math.max(0, parseInt(get('cc_size', '0'), 10) || 0));
    const applySize = () => { document.documentElement.style.setProperty('--scale', SIZES[si]); set('cc_size', si); };
    applySize();

    // ── Toolbar ──
    const bar = document.createElement('div');
    bar.className = 'cc-toolbar';
    bar.innerHTML = '<button id="szDown" aria-label="Smaller text">A−</button><button id="szUp" aria-label="Larger text">A+</button>' +
        '<button id="viewBtn"></button><button id="darkBtn"></button>';
    const grid = $('.main-grid');
    grid.parentNode.insertBefore(bar, grid);
    $('#szDown').onclick = () => { si = Math.max(0, si - 1); applySize(); };
    $('#szUp').onclick = () => { si = Math.min(SIZES.length - 1, si + 1); applySize(); };

    const viewBtn = $('#viewBtn');
    const setView = (all) => {
        document.body.classList.toggle('show-all', all);
        viewBtn.textContent = all ? (ar() ? 'عرض مبسط' : 'Show less') : (ar() ? 'المزيد من الأدوات' : 'More tools');
        set('cc_view', all ? 'all' : 'simple');
    };
    viewBtn.onclick = () => setView(!document.body.classList.contains('show-all'));
    setView(get('cc_view', 'simple') === 'all');

    const darkBtn = $('#darkBtn');
    const paintDark = () => { darkBtn.textContent = document.documentElement.classList.contains('theme-cleandark') ? '☀ Light' : '🌙 Dark'; };
    darkBtn.onclick = () => {
        const h = document.documentElement;
        const toDark = !h.classList.contains('theme-cleandark');
        h.classList.remove('theme-clean', 'theme-cleandark');
        h.classList.add(toDark ? 'theme-cleandark' : 'theme-clean');
        set('cc_theme', toDark ? 'cleandark' : 'clean');
        paintDark();
    };
    paintDark();

    // ── Voice search ──
    const input = $('#commandInput');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (input) input.placeholder = ar() ? 'ابحث في الإنترنت…' : 'Search the web…';
    if (SR && input) {
        const mic = document.createElement('button');
        mic.id = 'micBtn'; mic.type = 'button'; mic.textContent = '🎤'; mic.setAttribute('aria-label', 'Speak to search');
        input.parentNode.appendChild(mic);
        mic.onclick = () => {
            const r = new SR();
            r.lang = ar() ? 'ar-AE' : 'en-US';
            mic.classList.add('on');
            r.onresult = (e) => {
                input.value = e.results[0][0].transcript;
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            };
            r.onend = r.onerror = () => mic.classList.remove('on');
            try { r.start(); } catch { mic.classList.remove('on'); }
        };
    }

    // ── Prayer times card (Aladhan, by location; falls back to Sharjah) ──
    const card = document.createElement('section');
    card.className = 'panel today-panel';
    card.id = 'panel-today';
    card.innerHTML = '<h2 class="panel-title"><span>Today</span><button id="todayHide" aria-label="Hide prayer times" title="Hide">✕</button></h2>' +
        '<div class="today-big" id="todayDate"></div><div class="today-next" id="todayNext">…</div><div id="prayerList"></div>';
    grid.insertBefore(card, grid.children[1]);
    $('#todayDate').textContent = new Date().toLocaleDateString(ar() ? 'ar-AE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#todayHide').onclick = () => { card.style.display = 'none'; set('cc_prayer_off', '1'); };
    if (get('cc_prayer_off', '') === '1') card.style.display = 'none';

    const NAMES = { Fajr: ['Fajr', 'الفجر'], Dhuhr: ['Dhuhr', 'الظهر'], Asr: ['Asr', 'العصر'], Maghrib: ['Maghrib', 'المغرب'], Isha: ['Isha', 'العشاء'] };
    let times = null;
    const toMin = (t) => { const [h, m] = t.split(' ')[0].split(':'); return +h * 60 + +m; };
    const fmt = (t) => { const [h, m] = t.split(' ')[0].split(':'); const H = +h; return (H % 12 || 12) + ':' + m + (H < 12 ? ' AM' : ' PM'); };
    function paint() {
        if (!times) return;
        const now = new Date(), cur = now.getHours() * 60 + now.getMinutes();
        const keys = Object.keys(NAMES);
        let next = keys.find((k) => toMin(times[k]) > cur);
        const L = ar() ? 1 : 0;
        $('#prayerList').innerHTML = keys.map((k) => '<div class="prayer-row' + (k === next ? ' next' : '') + '"><span>' + NAMES[k][L] + '</span><span>' + fmt(times[k]) + '</span></div>').join('');
        if (next) {
            const d = toMin(times[next]) - cur;
            $('#todayNext').innerHTML = (L ? 'التالية: ' : 'Next: ') + '<b>' + NAMES[next][L] + '</b> ' + (L ? 'بعد ' : 'in ') + Math.floor(d / 60) + (L ? ' س ' : 'h ') + (d % 60) + (L ? ' د' : 'm');
        } else $('#todayNext').textContent = L ? 'انتهت صلوات اليوم' : "Today's prayers are done";
    }
    function load(lat, lon) {
        fetch('https://api.aladhan.com/v1/timings?latitude=' + lat + '&longitude=' + lon)
            .then((r) => r.json()).then((j) => { times = j.data.timings; paint(); })
            .catch(() => { $('#todayNext').textContent = ar() ? 'تعذر التحميل' : 'Could not load times'; });
    }
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition((p) => load(p.coords.latitude, p.coords.longitude), () => load(25.3463, 55.4209), { timeout: 6000 });
    else load(25.3463, 55.4209);
    setInterval(paint, 30000);
})();
