/* Themes polish: picker filter/search/random, cycle shortcuts, theme-color sync */
(() => {
  const LIGHT = ['clean', 'light', 'minimal', 'sakura', 'paper', 'ice', 'lavender'];
  const ar = () => document.documentElement.lang === 'ar';
  const L = () => ar()
    ? { all: 'الكل', light: 'فاتح', dark: 'داكن', rnd: '🎲 عشوائي', q: 'ابحث عن مظهر…' }
    : { all: 'All', light: 'Light', dark: 'Dark', rnd: '🎲 Random', q: 'Search themes…' };
  const cur = () => lsRaw(SK.THEME, 'clean');
  const pool = () => THEMES.filter((t) => t !== 'clean' && t !== 'cleandark');
  const go = (name) => { applyTheme(name); try { localStorage.setItem('cc_auto', '0'); } catch {} if (typeof renderThemeGrid === 'function') renderThemeGrid(); };

  // keep browser chrome colour in sync with theme
  const syncMeta = () => {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim();
    if (!bg) return;
    document.querySelectorAll('meta[name="theme-color"]').forEach((m, i) => (i ? m.remove() : (m.removeAttribute('media'), m.content = bg)));
  };
  const origApply = applyTheme;
  applyTheme = function (name) { origApply(name); requestAnimationFrame(syncMeta); };
  syncMeta();

  // picker toolbar + filtering
  let mode = 'all', q = '';
  const filter = () => document.querySelectorAll('#themeGrid .theme-card').forEach((c) => {
    const n = c.querySelector('.theme-name').firstChild.textContent.trim();
    if (n === 'clean' || n === 'cleandark') return;
    const okMode = mode === 'all' || (mode === 'light') === LIGHT.includes(n);
    c.hidden = !(okMode && n.includes(q));
  });
  const origGrid = renderThemeGrid;
  renderThemeGrid = function () {
    origGrid();
    const grid = document.getElementById('themeGrid'); if (!grid) return;
    let bar = document.getElementById('tpBar');
    if (!bar) {
      bar = document.createElement('div'); bar.id = 'tpBar'; bar.className = 'tp-bar';
      grid.parentNode.insertBefore(bar, grid);
    }
    const t = L();
    bar.innerHTML = ['all', 'light', 'dark'].map((k) => `<button type="button" data-m="${k}" aria-pressed="${mode === k}">${t[k]}</button>`).join('')
      + `<button type="button" data-r="1">${t.rnd}</button><input type="search" placeholder="${t.q}" value="${q}">`;
    bar.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.r) { const p = pool(); go(p[Math.floor(Math.random() * p.length)]); return; }
      mode = b.dataset.m; bar.querySelectorAll('[data-m]').forEach((x) => x.setAttribute('aria-pressed', x.dataset.m === mode)); filter();
    };
    bar.querySelector('input').oninput = (e) => { q = e.target.value.trim().toLowerCase(); filter(); };
    filter();
  };

  // Alt+Shift+T next · Alt+Shift+Y previous · Alt+Shift+R random
  document.addEventListener('keydown', (e) => {
    if (!e.altKey || !e.shiftKey) return;
    const p = pool(), i = Math.max(0, p.indexOf(cur()));
    const k = e.code;
    if (k === 'KeyT') go(p[(i + 1) % p.length]);
    else if (k === 'KeyY') go(p[(i - 1 + p.length) % p.length]);
    else if (k === 'KeyR') go(p[Math.floor(Math.random() * p.length)]);
    else return;
    e.preventDefault();
  });
})();
