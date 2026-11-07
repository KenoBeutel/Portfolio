/* PlayfulCV · web behaviour: theme toggle, chalk thread, lightbox, copy. */
(function () {
  var root = document.documentElement;
  /* Light paper is the default. The night switch is remembered only for this visit
     (sessionStorage), so moving between pages keeps it but a new visit opens light. */
  var KEY = 'pcv-paper';
  try { if (sessionStorage.getItem(KEY) === 'night') root.setAttribute('data-paper', 'night'); } catch (e) {}

  function isDark() { return root.getAttribute('data-paper') === 'night'; }
  function paintToggle() {
    document.querySelectorAll('.theme-btn').forEach(function (b) {
      var de = document.documentElement.lang === 'de';
      b.setAttribute('aria-label', isDark() ? (de ? 'Zu Tagpapier wechseln' : 'Switch to light paper') : (de ? 'Zu Nachtpapier wechseln' : 'Switch to night paper'));
      b.setAttribute('aria-pressed', isDark() ? 'true' : 'false');
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.theme-btn');
    if (!b) return;
    var night = !isDark();
    if (night) root.setAttribute('data-paper', 'night'); else root.removeAttribute('data-paper');
    try { if (night) sessionStorage.setItem(KEY, 'night'); else sessionStorage.removeItem(KEY); } catch (err) {}
    paintToggle();
  });

  /* ---------- chalk thread along stations ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  function catmull(pts) {
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0] + ' ' + p2[1];
    }
    return d;
  }
  function drawThread(list) {
    var old = list.querySelector('svg.thread'); if (old) old.remove();
    var stations = list.querySelectorAll('.station');
    if (!stations.length) return;
    var box = list.getBoundingClientRect();
    var w = parseFloat(getComputedStyle(list).paddingLeft) || 30;
    var cx = w / 2 - 2;
    var rings = [];
    stations.forEach(function (s, i) {
      var yr = s.querySelector('.yr');
      var r = yr.getBoundingClientRect();
      var lh = parseFloat(getComputedStyle(yr).fontSize);
      var sway = list.hasAttribute('data-straight') ? 0 : 1;
      rings.push({ x: cx + sway * (i % 2 ? 2.6 : -2.2), y: r.top - box.top + lh * .48, focus: s.hasAttribute('data-focus') });
    });
    var pts = [[cx + 1, rings[0].y - 26]];
    rings.forEach(function (r, i) {
      pts.push([r.x, r.y]);
      var nx = rings[i + 1];
      if (nx) pts.push([cx + (list.hasAttribute('data-straight') ? 0 : (i % 2 ? -1.4 : 1.8)), (r.y + nx.y) / 2]);
    });
    pts.push([cx - 1, rings[rings.length - 1].y + 30]);

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'thread'); svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', w); svg.setAttribute('height', box.height);
    var fid = 'chalk-' + Math.random().toString(36).slice(2, 7);
    svg.innerHTML = '<defs><filter id="' + fid + '" x="-50%" y="-5%" width="200%" height="110%">' +
      '<feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="7"/>' +
      '<feDisplacementMap in="SourceGraphic" scale="1.8"/></filter></defs>';
    var g = document.createElementNS(NS, 'g');
    if (!list.hasAttribute('data-straight')) g.setAttribute('filter', 'url(#' + fid + ')');
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', catmull(pts)); path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', '1.1'); path.setAttribute('stroke-linecap', 'round');
    g.appendChild(path);
    rings.forEach(function (r) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', r.x); c.setAttribute('cy', r.y); c.setAttribute('r', r.focus ? 6 : 5);
      c.setAttribute('stroke', 'currentColor'); c.setAttribute('stroke-width', '1.2');
      c.setAttribute('fill', r.focus ? 'currentColor' : 'var(--paper)');
      g.appendChild(c);
    });
    svg.appendChild(g);
    list.prepend(svg);
  }
  function drawAll() { document.querySelectorAll('.stations').forEach(drawThread); }

  /* ---------- lightbox ---------- */
  function lightbox() {
    var dlg = document.querySelector('dialog.lb');
    if (!dlg || !dlg.showModal) return;
    var img = dlg.querySelector('img');
    document.querySelectorAll('[data-full]').forEach(function (b) {
      b.addEventListener('click', function () {
        img.src = b.getAttribute('data-full'); img.alt = b.getAttribute('data-alt') || '';
        dlg.showModal();
      });
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  /* ---------- portrait: tap makes the eyes wander on touch screens ---------- */
  var portrait = document.querySelector('.portrait');
  if (portrait && portrait.querySelector('.look')) {
    portrait.addEventListener('click', function () { portrait.classList.toggle('is-looking'); });
  }

  /* ---------- copy ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.copy');
    if (!b) return;
    var text = b.getAttribute('data-copy');
    var done = function () { var o = b.textContent; b.textContent = document.documentElement.lang === 'de' ? 'kopiert' : 'copied'; setTimeout(function () { b.textContent = o; }, 1400); };
    try {
      navigator.clipboard.writeText(text).then(done, function () { selectText(b.previousElementSibling); });
    } catch (err) { selectText(b.previousElementSibling); }
  });
  function selectText(el) {
    if (!el) return; var r = document.createRange(); r.selectNodeContents(el);
    var s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* ---------- remote images that fail → placeholder sheets ---------- */
  function guardRemote() {
    document.querySelectorAll('.swap.remote img').forEach(function (img) {
      var fail = function () { img.closest('.swap').classList.add('missing'); if (window.__redraw) window.__redraw(); };
      if (img.complete && img.naturalWidth === 0) fail(); else img.addEventListener('error', fail);
    });
    document.querySelectorAll('img.remote-cover').forEach(function (img) {
      var fail = function () { var s = document.createElement('span'); s.className = 'cover missing'; s.setAttribute('aria-hidden', 'true'); img.replaceWith(s); };
      if (img.complete && img.naturalWidth === 0) fail(); else img.addEventListener('error', fail);
    });
  }

  function boot() {
    paintToggle();
    guardRemote();
    window.__redraw = function () { requestAnimationFrame(drawAll); };
    document.querySelectorAll('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });
    lightbox();
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(drawAll);
    window.addEventListener('load', drawAll);
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(drawAll, 120); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
