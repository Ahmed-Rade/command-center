/* Fullscreen stage: hero, live stats, tile dock, ←/→ switching, persistence */
(() => {
  const ov = document.getElementById('fullscreenOverlay'), inner = document.getElementById('fullscreenInner');
  if (!ov || !inner || typeof enterFullscreen !== 'function') return;
  const KEY = 'cc_fs';
  const M = {
    links:  ['🔗', 'Your shortcuts, one tap away', 'اختصاراتك بلمسة واحدة'],
    today:  ['☪', '', ''],
    todo:   ['✅', 'One task at a time', 'مهمة بعد مهمة'],
    notes:  ['📝', 'Write freely. Saved automatically', 'اكتب بحرية. يُحفظ تلقائياً'],
    status: ['📡', 'System at a glance', 'نظرة سريعة على النظام'],
    pomo:   ['🍅', 'Focus. Rest. Repeat', 'ركّز. استرح. كرّر'],
    timer:  ['⏱', 'Stopwatch and countdown', 'ساعة إيقاف وعدّ تنازلي'],
    calc:   ['🧮', 'Scientific calculator', 'آلة حاسبة علمية'],
    habits: ['🔥', 'Small steps, every day', 'خطوات صغيرة كل يوم'],
    pins:   ['📌', 'Saved for later', 'محفوظ لوقت لاحق'],
    quote:  ['❝', 'Words worth keeping', 'كلمات تستحق الحفظ'],
    log:    ['🖥', 'Everything you ran', 'كل ما نفّذته'],
  };
  const ORDER = Object.keys(M);
  const $ = (id) => document.getElementById(id);
  const ar = () => document.documentElement.lang === 'ar';
  const L = (k) => (ar() ? M[k][2] : M[k][1]);
  const avail = () => ORDER.filter((k) => { const p = $('panel-' + k); return p && !p.classList.contains('is-off'); });
  let cur = null, dock = null, timer = null;

  const title = (k, p) => (p.querySelector(k === 'today' ? '#tdTitle' : '.panel-title [data-i18n]')?.textContent || k).trim().toLowerCase();
  const n = (sel, p) => p.querySelectorAll(sel).length;
  const stat = (k, p) => {
    const a = ar();
    if (k === 'todo') { const t = n('.todo-item', p), d = n('.todo-item.done', p); return { s: t ? (a ? `${d} من ${t} منجزة` : `${d} of ${t} done`) : (a ? 'لا مهام بعد' : 'No tasks yet'), pct: t ? d / t * 100 : 0, bar: true }; }
    if (k === 'notes') { const v = p.querySelector('textarea')?.value || '', w = (v.trim().match(/\S+/g) || []).length;
      return { s: a ? `${w} كلمة · ${v.length} حرف · ${Math.max(1, Math.round(w / 200))} د قراءة` : `${w} words · ${v.length} characters · ${Math.max(1, Math.round(w / 200))} min read` }; }
    const c = { links: n('.link-item', p), pins: $('pinsList')?.children.length, habits: $('habitsList')?.children.length, log: $('logEntries')?.children.length }[k];
    if (c === undefined) return {};
    return { s: a ? `${c} عنصر` : `${c} ${c === 1 ? 'item' : 'items'}` };
  };
  const paint = () => {
    if (!cur) return;
    const p = $('panel-' + cur), h = p && p.querySelector(':scope > .fs-hero'); if (!h) return;
    const st = stat(cur, p);
    h.querySelector('.fs-sub').textContent = [L(cur), st.s].filter(Boolean).join('  ·  ');
    const b = h.querySelector('.fs-bar'); b.hidden = !st.bar; if (st.bar) b.firstElementChild.style.width = st.pct + '%';
  };
  const hero = (k, p) => {
    const h = document.createElement('div'); h.className = 'fs-hero';
    h.innerHTML = `<div class="fs-glyph" aria-hidden="true">${M[k][0]}</div><h1></h1><div class="fs-orn" aria-hidden="true">❖ ❖ ❖</div><div class="fs-sub"></div><div class="fs-bar" hidden><i></i></div>`;
    h.querySelector('h1').textContent = title(k, p); p.insertBefore(h, p.firstChild);
  };

  const buildDock = () => {
    if (!dock) { dock = document.createElement('nav'); dock.className = 'fs-dock'; dock.setAttribute('aria-label', 'Tiles'); ov.appendChild(dock);
      dock.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.d) step(+b.dataset.d); else if (b.dataset.k) window.enterFullscreen(b.dataset.k); }); }
    const rtl = document.documentElement.dir === 'rtl';
    dock.innerHTML = `<button data-d="${rtl ? 1 : -1}" class="fs-arr" aria-label="Previous">${rtl ? '›' : '‹'}</button><span class="fs-sep"></span><div class="fs-scroll">` +
      avail().map((k) => { const p = $('panel-' + k); return `<button data-k="${k}" class="${k === cur ? 'on' : ''}" title="${title(k, p)}" aria-label="${title(k, p)}">${M[k][0]}</button>`; }).join('') +
      `</div><span class="fs-sep"></span><button data-d="${rtl ? -1 : 1}" class="fs-arr" aria-label="Next">${rtl ? '‹' : '›'}</button>`;
    dock.querySelector('.on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  };
  const step = (d) => { const a = avail(), i = a.indexOf(cur); if (i < 0) return; window.enterFullscreen(a[(i + d + a.length) % a.length]); };

  const origEnter = window.enterFullscreen, origExit = exitFullscreen;
  window.enterFullscreen = function (key) {
    document.querySelectorAll('.fs-hero').forEach((x) => x.remove());
    origEnter(key);
    const p = $('panel-' + key); if (!p || !inner.contains(p)) return;
    cur = key; if (key !== 'today') hero(key, p);
    ov.dataset.fs = key; buildDock(); paint();
    try { localStorage.setItem(KEY, key); } catch {}
    clearInterval(timer); timer = setInterval(paint, 600);
  };
  exitFullscreen = function () {
    document.querySelectorAll('.fs-hero').forEach((x) => x.remove());
    clearInterval(timer); cur = null; ov.removeAttribute('data-fs'); dock?.remove(); dock = null;
    try { localStorage.removeItem(KEY); } catch {}
    origExit();
  };

  document.addEventListener('keydown', (e) => {
    if (!cur || ov.classList.contains('hidden')) return;
    const t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
    if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || (typing && !e.altKey)) return;
    const rtl = document.documentElement.dir === 'rtl';
    step((e.key === 'ArrowRight') === !rtl ? 1 : -1); e.preventDefault();
  });

  // restore last fullscreen tile after reload
  window.addEventListener('load', () => setTimeout(() => {
    let k = null; try { k = localStorage.getItem(KEY); } catch {}
    if (k && M[k] && avail().includes(k)) window.enterFullscreen(k);
  }, 700));
})();
