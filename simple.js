// Command Center — simple layer v3 (loads after script.js)
(function () {
    const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
    const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } };
    const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
    const root = document.documentElement;
    const ar = () => root.getAttribute('lang') === 'ar';
    const L = (e, a) => (ar() ? a : e);
    const langFns = [];
    const onLang = (f) => { langFns.push(f); f(); };
    new MutationObserver(() => setTimeout(() => langFns.forEach((f) => f()), 40)).observe(root, { attributes: true, attributeFilter: ['lang'] });
    const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const isImg = (s) => /^(https?:|data:image)/.test(s || '');
    const iconHTML = (i) => (isImg(i) ? '<img alt="" src="' + esc(i) + '" onerror="this.replaceWith(\'🔗\')">' : esc(i || '🔗'));
    const fav = (d) => 'https://www.google.com/s2/favicons?domain=' + d + '&sz=128';
    const grid = $('.main-grid');

    // ── Text size ──
    const SIZES = [0.9, 1, 1.15, 1.3, 1.5];
    let si = Math.min(SIZES.length - 1, Math.max(0, parseInt(get('cc_size2', '1'), 10) || 1));
    const applySize = () => { root.style.setProperty('--scale', SIZES[si]); set('cc_size2', si); };
    applySize();

    // ── Toolbar ──
    const bar = mk('div', 'cc-toolbar', '<button id="szDown"></button><button id="szUp"></button><button id="secBtn"></button><button id="darkBtn"></button>');
    grid.parentNode.insertBefore(bar, grid);
    $('#szDown').onclick = () => { si = Math.max(0, si - 1); applySize(); };
    $('#szUp').onclick = () => { si = Math.min(SIZES.length - 1, si + 1); applySize(); };
    const darkBtn = $('#darkBtn');
    darkBtn.onclick = () => {
        const toDark = !root.classList.contains('theme-cleandark');
        root.classList.remove('theme-clean', 'theme-cleandark');
        root.classList.add(toDark ? 'theme-cleandark' : 'theme-clean');
        set('cc_theme', toDark ? 'cleandark' : 'clean');
        paintBar();
    };
    function paintBar() {
        const dk = root.classList.contains('theme-cleandark');
        $('#szDown').textContent = L('A−', 'أ−'); $('#szUp').textContent = L('A+', 'أ+');
        $('#szDown').setAttribute('aria-label', L('Smaller text', 'تصغير الخط')); $('#szUp').setAttribute('aria-label', L('Larger text', 'تكبير الخط'));
        $('#secBtn').textContent = L('☰ Sections', '☰ الأقسام');
        darkBtn.textContent = dk ? L('☀ Light', '☀ فاتح') : L('🌙 Dark', '🌙 داكن');
    }
    onLang(paintBar);

    // ── Today / prayer card ──
    const card = mk('section', 'panel today-panel', '');
    card.id = 'panel-today';
    card.innerHTML = '<h2 class="panel-title"><span id="tdTitle"></span><button class="panel-fs-btn" id="tdFs" aria-label="Fullscreen">⛶</button></h2>' +
        '<div class="td-bismillah" id="tdBism"></div><div class="td-orn">❖ ❖ ❖</div>' +
        '<div class="td-date" id="todayDate"></div><div class="td-hijri" id="todayHijri"></div>' +
        '<div class="td-next" id="todayNext">…</div><div class="td-count" id="todayCount"></div><div class="prayer-list" id="prayerList"></div>';
    grid.insertBefore(card, grid.children[1]);
    try { PANEL_MAP.today = 'panel-today'; } catch {}
    $('#tdFs').onclick = () => window.enterFullscreen('today');

    const NAMES = { Fajr: ['Fajr', 'الفجر'], Sunrise: ['Sunrise', 'الشروق'], Dhuhr: ['Dhuhr', 'الظهر'], Asr: ['Asr', 'العصر'], Maghrib: ['Maghrib', 'المغرب'], Isha: ['Isha', 'العشاء'] };
    let times = null;
    const toMin = (t) => { const [h, m] = t.split(' ')[0].split(':'); return +h * 60 + +m; };
    const fmt = (t) => { const [h, m] = t.split(' ')[0].split(':'); const H = +h; return (H % 12 || 12) + ':' + m + ' ' + (H < 12 ? L('AM', 'ص') : L('PM', 'م')); };
    const pad = (n) => String(n).padStart(2, '0');
    function paintStatic() {
        $('#tdTitle').textContent = L('Today', 'اليوم');
        $('#tdBism').textContent = L('In the name of God, the Most Gracious, the Most Merciful', 'بسم الله الرحمن الرحيم');
        $('#todayDate').textContent = new Date().toLocaleDateString(ar() ? 'ar-AE-u-nu-latn' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
        try { $('#todayHijri').textContent = new Intl.DateTimeFormat(ar() ? 'ar-SA-u-ca-islamic-umalqura-nu-latn' : 'en-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()); } catch {}
        tick(true);
    }
    function tick(rebuild) {
        const list = $('#prayerList'); if (!times) { return; }
        const now = new Date(), cur = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
        const keys = Object.keys(NAMES), main = keys.filter((k) => k !== 'Sunrise');
        const next = main.find((k) => toMin(times[k]) > cur);
        const idx = ar() ? 1 : 0;
        const sig = (next || 'none') + (ar() ? 'a' : 'e');
        if (rebuild || list.dataset.sig !== sig) {
            list.dataset.sig = sig;
            list.innerHTML = keys.map((k) => '<div class="prayer-row' + (k === next ? ' next' : '') + (k === 'Sunrise' ? ' dim' : '') + '"><span>' + NAMES[k][idx] + '</span><span>' + fmt(times[k]) + '</span></div>').join('');
        }
        const target = next ? toMin(times[next]) : toMin(times.Fajr) + 1440;
        const nm = next || 'Fajr', sec = Math.max(0, Math.round((target - cur) * 60));
        $('#todayNext').innerHTML = L('Next prayer', 'الصلاة القادمة') + ' <b>' + NAMES[nm][idx] + '</b>';
        $('#todayCount').textContent = pad(Math.floor(sec / 3600)) + ':' + pad(Math.floor((sec % 3600) / 60)) + ':' + pad(sec % 60);
    }
    function load(lat, lon) {
        const day = new Date().toDateString();
        try { const c = JSON.parse(get('cc_prayer', 'null')); if (c && c.day === day && c.lat === lat) { times = c.t; paintStatic(); return; } } catch {}
        fetch('https://api.aladhan.com/v1/timings?latitude=' + lat + '&longitude=' + lon)
            .then((r) => r.json()).then((j) => { times = j.data.timings; set('cc_prayer', JSON.stringify({ day, lat, t: times })); paintStatic(); })
            .catch(() => { $('#todayNext').textContent = L('Could not load prayer times', 'تعذر تحميل أوقات الصلاة'); });
    }
    let loc = null; try { loc = JSON.parse(get('cc_loc', 'null')); } catch {}
    if (loc) load(loc[0], loc[1]);
    else if (navigator.geolocation) navigator.geolocation.getCurrentPosition((p) => { set('cc_loc', JSON.stringify([+p.coords.latitude.toFixed(2), +p.coords.longitude.toFixed(2)])); load(+p.coords.latitude.toFixed(2), +p.coords.longitude.toFixed(2)); }, () => load(25.35, 55.42), { timeout: 6000 });
    else load(25.35, 55.42);
    onLang(paintStatic);
    setInterval(() => tick(false), 1000);

    // ── Sections: show / hide any panel ──
    const PANELS = [['panel-links', 'Quick access', 'وصول سريع'], ['panel-today', 'Today & prayers', 'اليوم والصلاة'], ['panel-todo', 'To-do', 'المهام'], ['panel-notes', 'Notes', 'الملاحظات'], ['panel-status', 'Status', 'الحالة'], ['panel-pomo', 'Pomodoro', 'بومودورو'], ['panel-timer', 'Timer', 'المؤقت'], ['panel-calc', 'Calculator', 'الآلة الحاسبة'], ['panel-pins', 'Pins', 'المثبتات'], ['panel-habits', 'Habits', 'العادات'], ['panel-quote', 'Quote', 'اقتباس'], ['panel-log', 'Log', 'السجل']];
    const DEFAULT_OFF = ['panel-status', 'panel-pomo', 'panel-timer', 'panel-calc', 'panel-pins', 'panel-habits', 'panel-quote', 'panel-log'];
    let off = null; try { off = JSON.parse(get('cc_hidden', 'null')); } catch {}
    if (!Array.isArray(off)) off = get('cc_view', '') === 'all' ? [] : DEFAULT_OFF.slice();
    const applyOff = () => { PANELS.forEach(([id]) => { const p = document.getElementById(id); if (p) p.classList.toggle('is-off', off.includes(id)); }); set('cc_hidden', JSON.stringify(off)); };
    PANELS.forEach(([id, en, a]) => {
        const t = document.querySelector('#' + id + ' > .panel-title'); if (!t) return;
        const b = mk('button', 'panel-hide-btn', '−'); b.type = 'button';
        onLang(() => { const s = L('Hide this section', 'إخفاء هذا القسم'); b.title = s; b.setAttribute('aria-label', s); });
        b.onclick = () => { if (!off.includes(id)) off.push(id); applyOff(); };
        t.appendChild(b);
    });
    applyOff();
    const secModal = mk('div', 'modal-overlay hidden', '<div class="modal modal-wide"><div class="modal-header"><span class="modal-title" id="secT"></span><button class="modal-close" aria-label="Close">✕</button></div><div class="modal-body sec-list" id="secList"></div><div class="modal-footer" style="padding:14px 18px;text-align:end"><button class="pomo-btn pomo-btn-secondary" id="secReset"></button></div></div>');
    secModal.id = 'secModal'; document.body.appendChild(secModal);
    function paintSec() {
        $('#secT').textContent = L('Show or hide sections', 'إظهار أو إخفاء الأقسام');
        $('#secReset').textContent = L('Back to simple view', 'العودة للعرض المبسط');
        const list = $('#secList'); list.innerHTML = '';
        PANELS.forEach(([id, en, a]) => {
            const row = mk('label', 'sec-row', '<span>' + L(en, a) + '</span><span class="sw"><input type="checkbox"' + (off.includes(id) ? '' : ' checked') + '><span></span></span>');
            row.querySelector('input').onchange = (e) => { off = off.filter((x) => x !== id); if (!e.target.checked) off.push(id); applyOff(); };
            list.appendChild(row);
        });
    }
    $('#secBtn').onclick = () => { paintSec(); secModal.classList.remove('hidden'); };
    $('#secReset').onclick = () => { off = DEFAULT_OFF.slice(); applyOff(); paintSec(); };
    secModal.querySelector('.modal-close').onclick = () => secModal.classList.add('hidden');
    secModal.onclick = (e) => { if (e.target === secModal) secModal.classList.add('hidden'); };

    // ── Quick access editor ──
    const POP = [['Gemini', 'جيميني', 'gemini.google.com'], ['ChatGPT', 'شات جي بي تي', 'chatgpt.com'], ['Claude', 'كلود', 'claude.ai'], ['DeepSeek', 'ديب سيك', 'chat.deepseek.com'], ['Perplexity', 'بيربليكسيتي', 'perplexity.ai'], ['Grok', 'جروك', 'grok.com'], ['Copilot', 'كوبايلوت', 'copilot.microsoft.com'], ['Google', 'جوجل', 'google.com'], ['Gmail', 'جيميل', 'mail.google.com'], ['Drive', 'درايف', 'drive.google.com'], ['Maps', 'الخرائط', 'maps.google.com'], ['YouTube', 'يوتيوب', 'youtube.com'], ['WhatsApp', 'واتساب', 'web.whatsapp.com'], ['Telegram', 'تيليجرام', 'web.telegram.org'], ['X', 'إكس', 'x.com'], ['Facebook', 'فيسبوك', 'facebook.com'], ['Instagram', 'إنستغرام', 'instagram.com'], ['TikTok', 'تيك توك', 'tiktok.com'], ['LinkedIn', 'لينكدإن', 'linkedin.com'], ['Reddit', 'ريديت', 'reddit.com'], ['GitHub', 'جيت هب', 'github.com'], ['Netflix', 'نتفليكس', 'netflix.com'], ['Spotify', 'سبوتيفاي', 'open.spotify.com'], ['Amazon', 'أمازون', 'amazon.ae'], ['Noon', 'نون', 'noon.com'], ['Wikipedia', 'ويكيبيديا', 'wikipedia.org'], ['Outlook', 'أوتلوك', 'outlook.live.com'], ['Calendar', 'التقويم', 'calendar.google.com'], ['Translate', 'المترجم', 'translate.google.com'], ['Notion', 'نوشن', 'notion.so'], ['Twitch', 'تويتش', 'twitch.tv'], ['Pinterest', 'بنترست', 'pinterest.com']];
    const EMOJI = '🔗 🌐 🏠 📧 📅 📁 📝 📰 🎵 🎬 🎮 📷 🛒 💳 🏦 ✈️ 🚗 🍽 ☕ 📚 🎓 💼 🔧 💡 ❤️ ⭐ 🔔 📍 ☁️ 🕌 📖 🤖 🧠 💬 📞 🔒 ⚽ 🏋️ 🩺 🧾'.split(' ');
    const domain = (u) => { try { return new URL(/^https?:/.test(u) ? u : 'https://' + u).hostname; } catch { return ''; } };
    let draft = [], pickIdx = -1;
    const le = mk('div', 'modal-overlay hidden', '<div class="modal"><div class="modal-header"><span class="modal-title" id="leT"></span><button class="modal-close" aria-label="Close">✕</button></div><div class="le-body"><div class="le-list" id="leList"></div><div><div class="le-sub" id="leAddT"></div><div class="le-pop" id="lePop"></div></div></div><div class="modal-footer"><button class="pomo-btn pomo-btn-secondary" id="leCustom"></button><button class="pomo-btn pomo-btn-secondary" id="leReset"></button><button class="pomo-btn" id="leSave"></button></div></div>');
    le.id = 'leModal'; document.body.appendChild(le);
    const ip = mk('div', 'modal-overlay hidden', '<div class="modal"><div class="modal-header"><span class="modal-title" id="ipT"></span><button class="modal-close" aria-label="Close">✕</button></div><div class="le-body"><div class="ip-actions"><button id="ipAuto"></button><label id="ipUpL"><input type="file" accept="image/*" hidden id="ipUp"><span id="ipUpT"></span></label></div><div class="ip-grid" id="ipGrid"></div></div></div>');
    ip.id = 'ipModal'; document.body.appendChild(ip);
    const closeLe = () => le.classList.add('hidden'), closeIp = () => ip.classList.add('hidden');
    le.querySelector('.modal-close').onclick = closeLe; ip.querySelector('.modal-close').onclick = closeIp;
    le.onclick = (e) => { if (e.target === le) closeLe(); }; ip.onclick = (e) => { if (e.target === ip) closeIp(); };
    function paintLe() {
        $('#leT').textContent = L('Edit quick access', 'تعديل الوصول السريع');
        $('#leAddT').textContent = L('Add a popular site — one tap', 'أضف موقعاً شائعاً بنقرة واحدة');
        $('#leCustom').textContent = L('+ Add your own', '+ أضف رابطك'); $('#leReset').textContent = L('Reset to defaults', 'استعادة الافتراضي');
        $('#leSave').textContent = L('Save changes', 'حفظ التغييرات');
        const list = $('#leList'); list.innerHTML = '';
        draft.forEach((l, i) => {
            const r = mk('div', 'le-row', '<button type="button" class="le-icon" title="' + L('Change icon', 'تغيير الأيقونة') + '">' + iconHTML(l.icon) + '</button><input class="le-name" placeholder="' + L('Name', 'الاسم') + '" value="' + esc(l.text || '') + '"><input class="le-url" dir="ltr" placeholder="https://…" value="' + esc(l.url || '') + '"><input class="le-key" maxlength="1" dir="ltr" placeholder="Alt+" value="' + esc(l.key || '') + '" title="' + L('Keyboard shortcut (Alt + letter)', 'اختصار لوحة المفاتيح (Alt + حرف)') + '"><div class="le-tools"><button type="button" data-a="up">↑</button><button type="button" data-a="dn">↓</button><button type="button" data-a="rm">✕</button></div>');
            r.querySelector('.le-name').oninput = (e) => { l.text = e.target.value; };
            r.querySelector('.le-url').oninput = (e) => { l.url = e.target.value; };
            r.querySelector('.le-key').oninput = (e) => { l.key = e.target.value.toUpperCase(); };
            r.querySelector('.le-icon').onclick = () => { pickIdx = i; paintIp(); ip.classList.remove('hidden'); };
            r.querySelectorAll('.le-tools button').forEach((b) => b.onclick = () => {
                const a = b.dataset.a;
                if (a === 'rm') draft.splice(i, 1); else { const j = a === 'up' ? i - 1 : i + 1; if (j < 0 || j >= draft.length) return; [draft[i], draft[j]] = [draft[j], draft[i]]; }
                paintLe();
            });
            list.appendChild(r);
        });
        const pop = $('#lePop'); pop.innerHTML = '';
        POP.forEach(([en, a, d]) => {
            const b = mk('button', '', '<img alt="" src="' + fav(d) + '" onerror="this.style.visibility=\'hidden\'"><span>' + L(en, a) + '</span>'); b.type = 'button';
            b.onclick = () => { draft.push({ icon: fav(d), text: L(en, a), url: 'https://' + d, key: '' }); paintLe(); list.lastElementChild && list.lastElementChild.scrollIntoView({ block: 'nearest' }); };
            pop.appendChild(b);
        });
    }
    function paintIp() {
        $('#ipT').textContent = L('Choose an icon', 'اختر أيقونة');
        $('#ipAuto').textContent = L('Use the website’s own icon', 'استخدم أيقونة الموقع نفسه'); $('#ipUpT').textContent = L('Upload an image', 'ارفع صورة');
        const g = $('#ipGrid'); g.innerHTML = '';
        EMOJI.forEach((e) => { const b = mk('button', '', e); b.type = 'button'; b.onclick = () => { draft[pickIdx].icon = e; closeIp(); paintLe(); }; g.appendChild(b); });
    }
    $('#ipAuto').onclick = () => { const d = domain(draft[pickIdx].url); if (d) draft[pickIdx].icon = fav(d); else alert(L('Type the website address first.', 'اكتب عنوان الموقع أولاً.')); closeIp(); paintLe(); };
    $('#ipUp').onchange = (e) => {
        const f = e.target.files[0]; if (!f) return;
        const img = new Image(), fr = new FileReader();
        fr.onload = () => { img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'); const s = Math.min(img.width, img.height); x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 96, 96); draft[pickIdx].icon = c.toDataURL('image/png'); closeIp(); paintLe(); }; img.src = fr.result; };
        fr.readAsDataURL(f); e.target.value = '';
    };
    window.openEditLinks = () => { draft = userLinks.map((l) => ({ ...l })); paintLe(); le.classList.remove('hidden'); };
    $('#leCustom').onclick = () => { draft.push({ icon: '', text: '', url: '', key: '' }); paintLe(); const r = $('#leList').lastElementChild; if (r) { r.scrollIntoView({ block: 'nearest' }); r.querySelector('.le-name').focus(); } };
    $('#leReset').onclick = () => { draft = DEFAULT_LINKS.map((l) => ({ ...l })); paintLe(); };
    $('#leSave').onclick = () => {
        const out = draft.filter((l) => (l.text || '').trim() && (l.url || '').trim()).map((l) => {
            const url = /^[a-z]+:\/\//i.test(l.url.trim()) ? l.url.trim() : 'https://' + l.url.trim();
            const icon = !l.icon || l.icon === '🔗' ? (domain(url) ? fav(domain(url)) : '🔗') : l.icon;
            return { icon, text: l.text.trim(), url, key: (l.key || '').toUpperCase() };
        });
        userLinks = out; set('cc_links', JSON.stringify(out)); renderLinks(); closeLe();
        showOutput(L('Quick access updated — ' + out.length + ' links saved.', 'تم تحديث الوصول السريع — حُفظ ' + out.length + ' روابط.'), 'success');
    };
    onLang(() => { if (!le.classList.contains('hidden')) paintLe(); });

    // ── Fullscreen buttons for every panel ──
    ['panel-todo', 'panel-notes', 'panel-links'].forEach((id) => {
        const t = document.querySelector('#' + id + ' > .panel-title'); if (t && !t.querySelector('.panel-fs-btn')) { const b = mk('button', 'panel-fs-btn', '⛶'); b.type = 'button'; b.onclick = () => window.enterFullscreen(id.replace('panel-', '')); t.insertBefore(b, t.querySelector('.panel-hide-btn')); }
    });

    // ── Clear completed tasks ──
    const tl = $('#todoList');
    if (tl) {
        const cd = mk('button', '', ''); cd.id = 'clearDone'; cd.type = 'button'; cd.hidden = true; tl.parentNode.appendChild(cd);
        const paint = () => { const n = tl.querySelectorAll('.todo-item.done').length; cd.hidden = !n; cd.textContent = L('Clear completed (' + n + ')', 'مسح المنجزة (' + n + ')'); };
        cd.onclick = () => { tl.querySelectorAll('.todo-item.done').forEach((li) => { try { deleteTodo(Number(li.dataset.id)); } catch {} }); paint(); };
        new MutationObserver(paint).observe(tl, { childList: true }); onLang(paint);
    }

    // ── Clear ALL site data ──
    window.clearAllData = async function () {
        if (!confirm(L('Clear ALL data, cookies and cache for this site? This cannot be undone. (Browser permissions can only be reset from the lock icon in the address bar.)', 'مسح كل بيانات الموقع وملفات الارتباط والذاكرة المؤقتة؟ لا يمكن التراجع. (الأذونات تُعاد من أيقونة القفل في شريط العنوان.)'))) return;
        try { localStorage.clear(); sessionStorage.clear(); } catch {}
        document.cookie.split(';').forEach((c) => { const n = c.split('=')[0].trim(); if (!n) return; ['', location.hostname, '.' + location.hostname].forEach((d) => { document.cookie = n + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/' + (d ? ';domain=' + d : ''); }); });
        const jobs = [];
        try { jobs.push(caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k))))); } catch {}
        try { jobs.push(navigator.serviceWorker.getRegistrations().then((rs) => Promise.all(rs.map((r) => r.unregister())))); } catch {}
        try { jobs.push(indexedDB.databases().then((ds) => Promise.all(ds.map((d) => indexedDB.deleteDatabase(d.name))))); } catch {}
        await Promise.allSettled(jobs);
        location.replace(location.pathname);
    };

    // ── Status values: ONLINE → Online ──
    const KEEP = /^(UAE|AM|PM|UTC|KM\/H|ISP|IP)$/;
    const nice = (n) => { const v = n.nodeValue; if (!/[A-Z]{2}/.test(v) || /[a-z]/.test(v)) return; const r = v.replace(/[A-Z][A-Z]+/g, (w) => KEEP.test(w) ? w : w[0] + w.slice(1).toLowerCase()); if (r !== v) n.nodeValue = r; };
    const fixVals = () => $$('.status-value').forEach((e) => { const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) nice(n); });
    const sg = $('#panel-status'); if (sg) { new MutationObserver(fixVals).observe(sg, { childList: true, subtree: true, characterData: true }); fixVals(); }

    // ── Voice search ──
    const input = $('#commandInput');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR && input) {
        const mic = mk('button', '', '🎤'); mic.id = 'micBtn'; mic.type = 'button'; input.parentNode.appendChild(mic);
        onLang(() => mic.setAttribute('aria-label', L('Speak to search', 'تحدث للبحث')));
        mic.onclick = () => {
            const r = new SR(); r.lang = ar() ? 'ar-AE' : 'en-US'; mic.classList.add('on');
            r.onresult = (e) => { input.value = e.results[0][0].transcript; input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })); };
            r.onend = r.onerror = () => mic.classList.remove('on');
            try { r.start(); } catch { mic.classList.remove('on'); }
        };
    }

    // ── First visit follows the device's light/dark ──
    if (!get('cc_dark_seen', '') && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) darkBtn.click();
    set('cc_dark_seen', '1');
})();
