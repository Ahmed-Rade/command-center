/* Tiles: column count, stagger index, scroll reveal, pointer light */
(() => {
  const grid = document.querySelector('.main-grid'); if (!grid) return;
  const root = document.documentElement;
  const cols = () => { const w = grid.clientWidth; return w >= 1500 ? 4 : w >= 1040 ? 3 : w >= 680 ? 2 : 1; };
  const sync = () => { grid.dataset.cols = cols(); };
  sync(); new ResizeObserver(sync).observe(grid);

  const vis = () => [...grid.children].filter((p) => p.classList.contains('panel') && !p.classList.contains('is-off'))
    .sort((a, b) => (parseInt(getComputedStyle(a).order, 10) || 0) - (parseInt(getComputedStyle(b).order, 10) || 0));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('tile-in'); io.unobserve(e.target);
    e.target.querySelectorAll('.link-item').forEach((l, j) => { l.style.setProperty('--j', j); l.classList.add('tile-in'); });
  }), { threshold: 0.05 });

  const start = () => {
    if (reduce) return;
    root.classList.add('tiles-js');
    vis().forEach((p, i) => { p.style.setProperty('--i', Math.min(i, 8)); io.observe(p); });
    setTimeout(() => grid.querySelectorAll('.panel:not(.tile-in)').forEach((p) => p.classList.add('tile-in')), 2500); // safety
  };
  // panels added later (e.g. Today card) / un-hidden → reveal immediately
  new MutationObserver(() => grid.querySelectorAll('.panel:not(.tile-in)').forEach((p) => {
    if (!p.classList.contains('is-off') && root.classList.contains('tiles-js') && !p.dataset.seen) { p.dataset.seen = 1; io.observe(p); }
  })).observe(grid, { childList: true, subtree: false, attributes: true, attributeFilter: ['class'] });
  window.addEventListener('load', () => setTimeout(start, 60));

  grid.addEventListener('pointermove', (e) => {
    const p = e.target.closest('.panel'); if (!p) return;
    const r = p.getBoundingClientRect();
    p.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    p.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  }, { passive: true });
})();
