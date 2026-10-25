// Command Center — Arabic completion layer (loads last).
// Translates every remaining English string when lang=ar, restores English on switch.
// Skips user content (todos, notes, pins, habits, log messages) and command syntax.
(function () {
    const root = document.documentElement;
    const isAr = () => root.getAttribute('lang') === 'ar';

    const D = {
        // header / misc
        'command center': 'مركز التحكم', 'connected': 'متصل', 'offline': 'غير متصل', 'online': 'متصل',
        'user': 'ضيف', 'on': 'تشغيل', 'off': 'إيقاف', 'ac': 'مسح', 'del': 'حذف', 'deg': 'درجات', 'rad': 'راديان',
        'sin': 'جا', 'cos': 'جتا', 'tan': 'ظا', 'log': 'لو', 'ln': 'لو‌ه', 'clear hist': 'مسح السجل',
        '— history empty —': '— لا يوجد سجل —', 'n/supp': 'غير مدعوم', 'unavailable': 'غير متاح',
        'refreshing...': 'جارٍ التحديث...', 'uae (--°c)': 'الإمارات (--°م)',
        // defaults
        'github': 'جيت هب', 'mail': 'البريد', 'drive': 'درايف', 'youtube': 'يوتيوب', 'chatgpt': 'شات جي بي تي',
        'reddit': 'ريديت', 'claude': 'كلود', 'linux docs': 'مستندات لينكس',
        'jetbrains mono': 'جيتبرينز مونو', 'space mono': 'سبيس مونو', 'inter': 'إنتر', 'orbitron': 'أوربيترون',
        'google': 'جوجل', 'duckduckgo': 'دك دك جو', 'bing': 'بينج', 'brave': 'بريف', 'ecosia': 'إيكوسيا',
        'startpage': 'ستارت بيج', 'yahoo': 'ياهو', 'perplexity': 'بيربليكسيتي',
        // log types
        'cmd': 'أمر', 'info': 'معلومة', 'success': 'نجاح', 'error': 'خطأ', 'result': 'نتيجة', 'warn': 'تنبيه',
        // themes
        'clean': 'نظيف فاتح', 'cleandark': 'نظيف داكن', 'dark': 'داكن', 'light': 'فاتح', 'solarized': 'سولارايزد', 'dracula': 'دراكولا',
        'minimal': 'بسيط', 'cyber': 'سايبر', 'nord': 'نورد', 'mocha': 'موكا', 'amber': 'كهرماني', 'synthwave': 'سينث ويف',
        'ocean': 'محيط', 'forest': 'غابة', 'sakura': 'ساكورا', 'monokai': 'مونوكاي', 'paper': 'ورقي', 'terminal': 'طرفية',
        'blood': 'دموي', 'gold': 'ذهبي', 'ice': 'جليدي', 'autumn': 'خريف', 'midnight': 'منتصف الليل', 'void': 'فراغ',
        'coral': 'مرجاني', 'lavender': 'لافندر', 'lime': 'ليموني', 'copper': 'نحاسي',
        // simple.js
        'today': 'اليوم', '🌙 dark': '🌙 داكن', '☀ light': '☀ فاتح', 'hide': 'إخفاء', 'smaller text': 'تصغير الخط',
        'larger text': 'تكبير الخط', 'speak to search': 'تحدث للبحث', 'hide prayer times': 'إخفاء أوقات الصلاة',
        'could not load times': 'تعذر تحميل الأوقات', "today's prayers are done": 'انتهت صلوات اليوم',
        'a−': 'أ−', 'a+': 'أ+',
        // attributes
        'add pin': 'إضافة تثبيت', 'close edit links': 'إغلاق تعديل الروابط', 'close shortcuts': 'إغلاق الاختصارات',
        'close theme picker': 'إغلاق اختيار المظهر', 'edit quick links': 'تعديل الروابط السريعة', 'edit links': 'تعديل الروابط',
        'get a new quote': 'اقتباس جديد', 'language': 'اللغة', 'open theme picker': 'فتح اختيار المظهر',
        'pomodoro settings': 'إعدادات بومودورو', 'sound effect settings': 'إعدادات المؤثرات الصوتية',
        'your display name': 'اسمك', 'click to set your name': 'اضغط لتعديل اسمك', 'fullscreen': 'ملء الشاشة',
        'decrease break minutes': 'تقليل دقائق الاستراحة', 'increase break minutes': 'زيادة دقائق الاستراحة',
        'decrease long break minutes': 'تقليل دقائق الاستراحة الطويلة', 'increase long break minutes': 'زيادة دقائق الاستراحة الطويلة',
        'decrease session count': 'تقليل عدد الجلسات', 'increase session count': 'زيادة عدد الجلسات',
        'decrease work minutes': 'تقليل دقائق العمل', 'increase work minutes': 'زيادة دقائق العمل',
        'fallback search engine — used by :search and the answer card\'s search button': 'محرك البحث الاحتياطي',
        'click to cycle search engine': 'اضغط لتغيير محرك البحث',
        'name': 'الاسم', 'key': 'المفتاح', 'icon': 'الأيقونة', 'url': 'الرابط',
        // weather
        'clear': 'صافٍ', 'mostly clear': 'صافٍ غالباً', 'partly cloudy': 'غائم جزئياً', 'overcast': 'غائم',
        'foggy': 'ضباب', 'rime fog': 'ضباب جليدي', 'light drizzle': 'رذاذ خفيف', 'drizzle': 'رذاذ',
        'heavy drizzle': 'رذاذ كثيف', 'light rain': 'مطر خفيف', 'rain': 'مطر', 'heavy rain': 'مطر غزير',
        'light snow': 'ثلج خفيف', 'snow': 'ثلج', 'heavy snow': 'ثلج كثيف', 'showers': 'زخات مطر',
        'heavy showers': 'زخات غزيرة', 'violent showers': 'زخات عنيفة', 'thunderstorm': 'عاصفة رعدية',
        'hail storm': 'عاصفة برد', 'heavy hail storm': 'عاصفة برد شديدة',
        // command descriptions
        'calculator': 'آلة حاسبة', 'task manager': 'مدير المهام', 'pomodoro timer': 'مؤقت بومودورو',
        'stopwatch/countdown': 'ساعة إيقاف / عد تنازلي', 'switch theme': 'تغيير المظهر', 'search engine': 'محرك البحث',
        'background mode': 'نمط الخلفية', 'crypto/currency price': 'أسعار العملات', 'refresh weather': 'تحديث الطقس',
        'network info': 'معلومات الشبكة', 'command log': 'سجل الأوامر', 'saved snippets / pins': 'المقتطفات المثبتة',
        'edit quick access': 'تعديل الوصول السريع', 'unit converter': 'محول الوحدات', 'coin flip': 'رمي عملة',
        'dice roll': 'رمي نرد', 'zen / focus mode': 'وضع التركيز', 'toggle hover/click/type sfx': 'المؤثرات الصوتية',
        'backup all data': 'نسخ احتياطي للبيانات', 'restore from backup': 'استعادة نسخة احتياطية', 'wipe notes': 'مسح الملاحظات',
        'notes utilities': 'أدوات الملاحظات', 'dashboard summary': 'ملخص اللوحة', 'show current time': 'عرض الوقت الحالي',
        'show all commands': 'عرض كل الأوامر', 'connection check': 'فحص الاتصال', 'search the web': 'بحث في الإنترنت',
        'switch language': 'تغيير اللغة', '26 themes · or click 🎨 theme': '٢٦ مظهراً · أو اضغط 🎨 المظهر',
        'no pins yet — type a snippet and press +': 'لا توجد عناصر مثبتة — اكتب نصاً واضغط +',
        // output messages (exact)
        'network reconnected.': 'عاد الاتصال بالشبكة.', 'network connection lost.': 'انقطع الاتصال بالشبكة.',
        'accent reset to theme default.': 'تمت إعادة اللون إلى الافتراضي.', 'log cleared.': 'تم مسح السجل.',
        'copied!': 'تم النسخ!', 'pins cleared.': 'تم مسح المثبتات.', 'break over — back to work!': 'انتهت الاستراحة — عد للعمل!',
        '⏰ timer finished!': '⏰ انتهى المؤقت!', 'set a countdown time first.': 'حدد وقت العد التنازلي أولاً.',
        'invalid time. use hh:mm:ss, mm:ss or mm.': 'وقت غير صالح. استخدم س:د:ث أو د:ث أو د.',
        'pick a target time first.': 'اختر وقتاً مستهدفاً أولاً.', 'could not fetch ip info.': 'تعذر جلب معلومات الشبكة.',
        'backup downloaded.': 'تم تنزيل النسخة الاحتياطية.', 'backup restored. reloading...': 'تمت الاستعادة. جارٍ إعادة التحميل...',
        'invalid backup file.': 'ملف النسخة الاحتياطية غير صالح.', 'usage: :calc 2+2': 'الاستخدام: :calc 2+2',
        'invalid expression': 'عملية غير صالحة', 'notes cleared.': 'تم مسح الملاحظات.', 'all tasks cleared.': 'تم مسح كل المهام.',
        'usage: :todo add <task> | :todo clear': 'الاستخدام: :todo add <مهمة> | :todo clear',
        'pinging…': 'جارٍ الفحص…', 'pong — offline (no response)': 'لا يوجد اتصال (لا استجابة)',
        'usage: :pomo start/stop/reset/status': 'الاستخدام: :pomo start/stop/reset/status',
        'quick access reset to defaults.': 'تمت إعادة الوصول السريع إلى الافتراضي.',
        'usage: :links edit | :links reset': 'الاستخدام: :links edit | :links reset', 'fetching ip info...': 'جارٍ جلب معلومات الشبكة...',
        'usage: :price btc / eth / aed / eur': 'الاستخدام: :price BTC / ETH / AED / EUR',
        'usage: :note clear | :note word-count': 'الاستخدام: :note clear | :note word-count',
        'refreshing weather...': 'جارٍ تحديث الطقس...', 'no pins saved. use :pin <text> to add one.': 'لا توجد مثبتات. استخدم :pin <نص> للإضافة.',
        'usage: :convert 10 km mi': 'الاستخدام: :convert 10 km mi', 'invalid number.': 'رقم غير صالح.',
        'usage: :search <query>': 'الاستخدام: :search <كلمات البحث>', 'usage: :lang ar | :lang en': 'الاستخدام: :lang ar | :lang en',
        'zen mode on — alt+z to exit': 'وضع التركيز مفعّل — Alt+Z للخروج', 'zen mode off': 'تم إيقاف وضع التركيز',
        'clear all data? this cannot be undone.': 'مسح كل البيانات؟ لا يمكن التراجع عن هذا.',
        'countdown complete!': 'انتهى العد التنازلي!', 'break over! back to work.': 'انتهت الاستراحة! عد للعمل.',
        'session done! take a break.': 'انتهت الجلسة! خذ استراحة.', 'pomodoro': 'بومودورو', 'timer': 'المؤقت',
        'your countdown has finished. tap to open.': 'انتهى العد التنازلي. اضغط للفتح.',
        ':calc :todo :clear :time :ping :pomo :timer :theme :engine :bg :price :myip :weather :log :pin :convert :flip :roll :zen :export :import :search :lang — or type to search the web':
            ':calc :todo :clear :time :ping :pomo :timer :theme :engine :bg :price :myip :weather :log :pin :convert :flip :roll :zen :export :import :search :lang — أو اكتب للبحث في الإنترنت',
        ':calc :todo :clear :time :ping :pomo :timer :theme :engine :bg :price :myip :weather :log :pin :convert :flip :roll :zen :export :import :search :lang':
            ':calc :todo :clear :time :ping :pomo :timer :theme :engine :bg :price :myip :weather :log :pin :convert :flip :roll :zen :export :import :search :lang',
    };
    const E = (s) => D[(s || '').toLowerCase()] || D[(s || '').toLowerCase().replace(/\.+$/, '')];
    const num = (n) => n;
    const eng = (n) => D[n.toLowerCase()] || n;
    const R = [
        [/^(.*?)(\d+)h (\d+)m$/, (m, a, h, mi) => `${a}${h} س ${mi} د`],
        [/^(\d+)m$/, (m, x) => `${x} د`],
        [/^(\d+)w$/, (m, x) => `${x} كلمة`],
        [/^(\d+) KM\/H$/, (m, x) => `${x} كم/س`],
        [/^(\d+(?:\.\d+)?)°C$/, (m, x) => `${x}°م`], [/^--°C$/, () => '--°م'],
        [/^UTC([+-][\d:]+) · UAE$/, (m, z) => `توقيت الإمارات \u200E${z}`],
        [/^LAP (\d+)$/, (m, n) => `لفة ${n}`],
        [/^((?:[^\w\s]+\s*)+)([A-Z][A-Z ]+)$/, (m, ic, w) => { const t = D[w.toLowerCase().trim()]; return t ? ic + t : m; }],
        [/^(SEARCH ENGINE) → (.+)$/i, (m, a, e) => `محرك البحث ← ${eng(e)}`],
        [/^Theme → (.+)$/, (m, n) => `المظهر ← ${eng(n)}`],
        [/^Background → (.+)$/, (m, n) => `الخلفية ← ${n}`],
        [/^Themes: (.+)$/, (m, l) => 'المظاهر: ' + l.split(' / ').map(eng).join(' / ')],
        [/^Modes: (.+)$/, (m, l) => 'الأنماط: ' + l],
        [/^Unknown engine\. Options: (.+)$/, (m, l) => 'محرك غير معروف. الخيارات: ' + l.split(', ').map(eng).join('، ')],
        [/^Quick access updated — (\d+) links saved\.$/, (m, n) => `تم تحديث الوصول السريع — حُفظ ${n} روابط.`],
        [/^🍅 Work session complete! (Long break|Take a break) — (\d+) min\.$/, (m, k, n) => `🍅 انتهت جلسة العمل! ${k === 'Long break' ? 'استراحة طويلة' : 'خذ استراحة'} — ${n} دقيقة.`],
        [/^Pomodoro settings saved — (\d+)\/(\d+) min\.$/, (m, a, b) => `تم حفظ الإعدادات — ${a}/${b} دقيقة.`],
        [/^Auto-start next phase (on|off)\.$/, (m, s) => `البدء التلقائي للمرحلة التالية: ${s === 'on' ? 'تشغيل' : 'إيقاف'}.`],
        [/^▶ Countdown started: (.+)$/, (m, t) => `▶ بدأ العد التنازلي: ${t}`],
        [/^▶ Countdown to (.+?) (AM|PM) \((.+)\)$/, (m, t, ap, d) => `▶ عد تنازلي حتى ${t} ${ap === 'AM' ? 'ص' : 'م'} (${d})`],
        [/^▶ (\d+)m countdown started$/, (m, n) => `▶ بدأ عد تنازلي ${n} دقيقة`],
        [/^IP: (.+) · ISP: (.+?) · (.+)$/, (m, ip, isp, loc) => `العنوان: ${ip} · المزود: ${isp} · ${loc}`],
        [/^Could not fetch price for (.+)\.$/, (m, t) => `تعذر جلب سعر ${t}.`],
        [/^Fetching (.+)\.\.\.$/, (m, t) => `جارٍ جلب ${t}...`],
        [/^Task added: (.+)$/, (m, t) => `تمت إضافة المهمة: ${t}`],
        [/^PONG — (\d+)ms ✓$/, (m, n) => `الاتصال سليم — ${n} م‌ث ✓`],
        [/^Pomodoro: (WORK|BREAK|LONG BREAK) · (.+) remaining · (\d+) sessions$/, (m, p, t, n) => `بومودورو: ${p === 'WORK' ? 'عمل' : 'استراحة'} · متبقي ${t} · ${n} جلسات`],
        [/^Notes: (\d+) words · (\d+) chars · (\d+) lines$/, (m, w, c, l) => `الملاحظات: ${w} كلمة · ${c} حرف · ${l} سطر`],
        [/^Todos: (\d+)\/(\d+) done · Pomo: (\d+) sessions · Focus: (.+?) · Habits: (\d+) tracked$/, (m, a, b, s, f, h) => `المهام: ${a}/${b} منجزة · بومودورو: ${s} جلسات · التركيز: ${f.replace(/(\d+)h/, '$1 س').replace(/(\d+)m/, '$1 د')} · العادات: ${h}`],
        [/^Log has (\d+) entries\. Use :log clear to wipe\.$/, (m, n) => `السجل يحتوي ${n} عنصراً. استخدم :log clear للمسح.`],
        [/^Copied pin \[(\d+)\]\.$/, (m, n) => `تم نسخ المثبت [${n}].`],
        [/^Pinned: (.+)$/, (m, t) => `تم التثبيت: ${t}`],
        [/^Unsupported: (.+?) → (.+?)\. Try .*$/, (m, a, b) => `غير مدعوم: ${a} ← ${b}. جرّب km/mi, kg/lb, c/f, m/ft, l/gal, cm/in.`],
        [/^🎲 Rolled (\d+) \((d\d+)\)$/, (m, r, d) => `🎲 النتيجة ${r} (${d})`],
        [/^(\w+) sound (on|off)\.$/, (m, k, s) => `صوت ${{ hover: 'التمرير', click: 'النقر', type: 'الكتابة', alert: 'التنبيه' }[k] || k}: ${s === 'on' ? 'تشغيل' : 'إيقاف'}.`],
        [/^Sound effects (on|off)\.$/, (m, s) => `المؤثرات الصوتية: ${s === 'on' ? 'تشغيل' : 'إيقاف'}.`],
        [/^Fullscreen \w+ panel$/, () => 'عرض اللوحة بملء الشاشة'],
        [/^Battery API isn't supported.*$/, () => 'واجهة البطارية غير مدعومة في هذا المتصفح. جرّب كروم أو إيدج.'],
        [/^(Heads|Tails)$/i, (m, s) => (/^h/i.test(s) ? 'صورة' : 'كتابة')],
        [/^🪙 (Heads|Tails)$/i, (m, s) => '🪙 ' + (/^h/i.test(s) ? 'صورة' : 'كتابة')],
        [/^Cmd Center$/, () => 'مركز التحكم'],
    ];
    function tr(s) {
        const t = s.trim();
        if (!t || !/[A-Za-z]/.test(t)) return s;
        let out = E(t);
        if (!out) for (const [re, f] of R) { if (re.test(t)) { out = t.replace(re, f); break; } }
        return out ? s.replace(t, out) : s;
    }
    window.ccTr = (s) => (isAr() ? tr(String(s)) : s);

    const SKIP = '#todoList, #notes, textarea, kbd, .log-msg, .cmd-dropdown-cmd, .cmd-dropdown-shortcut, .prompt-wrapper, #greetingName, .edit-link-row, .lang-toggle, #pinsInput, #quoteText, .calc-hist-expr, .calc-hist-res, script, style';
    const tracked = new Map(); // node/attr key -> original English
    const ATTRS = ['placeholder', 'title', 'aria-label'];
    function doText(n) {
        if (!n.parentElement || n.parentElement.closest(SKIP)) return;
        const v = n.nodeValue, o = tracked.get(n);
        if (o !== undefined && v !== o && !/[\u0600-\u06FF]/.test(v)) tracked.delete(n);
        const r = tr(v);
        if (r !== v) { if (!tracked.has(n)) tracked.set(n, v); n.nodeValue = r; }
    }
    const attrStore = new WeakMap();
    function doAttrs(el) {
        if (el.closest && el.closest(SKIP)) return;
        for (const a of ATTRS) {
            const v = el.getAttribute && el.getAttribute(a);
            if (!v) continue;
            const r = tr(v);
            if (r !== v) { const st = attrStore.get(el) || {}; st[a] = st[a] || v; attrStore.set(el, st); trackedEls.add(el); el.setAttribute(a, r); }
        }
    }
    const trackedEls = new Set();
    function walk(node) {
        if (node.nodeType === 3) return doText(node);
        if (node.nodeType !== 1) return;
        doAttrs(node);
        for (const c of node.childNodes) walk(c);
    }
    function restore() {
        tracked.forEach((o, n) => { if (n.isConnected) n.nodeValue = o; });
        tracked.clear();
        trackedEls.forEach((el) => { const st = attrStore.get(el); if (st && el.isConnected) for (const a in st) el.setAttribute(a, st[a]); });
        trackedEls.clear();
    }
    const mo = new MutationObserver((muts) => {
        if (!isAr()) return;
        mo.disconnect();
        for (const m of muts) {
            if (m.type === 'childList') m.addedNodes.forEach(walk);
            else if (m.type === 'characterData') doText(m.target);
            else if (m.type === 'attributes') doAttrs(m.target);
        }
        observe();
    });
    function observe() { mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS }); }

    // Fixed bits
    function syncStatic() {
        const ar = isAr();
        const name = document.getElementById('greetingName');
        if (name && /^(USER|ضيف)$/.test(name.textContent.trim())) name.textContent = ar ? 'ضيف' : 'USER';
        const en = document.getElementById('langBtnEn'), a = document.getElementById('langBtnAr');
        if (en) en.textContent = 'English';
        if (a) a.textContent = 'العربية';
        document.title = ar ? 'مركز التحكم' : 'Command Center';
        const pi = document.getElementById('commandInput');
        if (pi) pi.placeholder = ar ? 'ابحث في الإنترنت…' : 'Search the web…';
        const bn = document.querySelector('#darkBtn'); if (bn) bn.textContent = root.classList.contains('theme-cleandark') ? (ar ? '☀ فاتح' : '☀ Light') : (ar ? '🌙 داكن' : '🌙 Dark');
        const vb = document.getElementById('viewBtn');
        if (vb) { const all = document.body.classList.contains('show-all'); vb.textContent = all ? (ar ? 'عرض مبسط' : 'Show less') : (ar ? 'المزيد من الأدوات' : 'More tools'); }
        const d = document.getElementById('szDown'), u = document.getElementById('szUp');
        if (d) { d.textContent = ar ? 'أ−' : 'A−'; d.setAttribute('aria-label', ar ? 'تصغير الخط' : 'Smaller text'); }
        if (u) { u.textContent = ar ? 'أ+' : 'A+'; u.setAttribute('aria-label', ar ? 'تكبير الخط' : 'Larger text'); }
        const td = document.getElementById('todayDate');
        if (td) td.textContent = new Date().toLocaleDateString(ar ? 'ar-AE-u-nu-latn' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
        const tz = document.getElementById('timezone');
        if (tz) tz.textContent = ar ? 'توقيت الإمارات \u200E+04:00' : 'UTC+04:00 · UAE';
    }
    const nativeConfirm = window.confirm.bind(window);
    window.confirm = (m) => nativeConfirm(window.ccTr(m));

    function sync() {
        if (isAr()) { walk(document.body); } else restore();
        syncStatic();
    }
    new MutationObserver(() => setTimeout(sync, 0)).observe(root, { attributes: true, attributeFilter: ['lang'] });
    observe();
    sync();
    // Late-loading bits (weather, prayer times) get a second pass.
    setTimeout(sync, 1500);
})();
