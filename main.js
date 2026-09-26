/* Aman Adhav, portfolio. Motion layer and small interactions.
   Dependencies (loaded from CDN before this file): GSAP 3 + ScrollTrigger, Lenis.
   Everything degrades: without GSAP the page renders fully visible and static. */
(() => {
  'use strict';

  const html = document.documentElement;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const HAS_GSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  if (HAS_GSAP) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'power3.out' });
    html.classList.add('gsap');
  }

  /* ------------------------------------------------------------------ theme */
  const THEME_KEY = 'aa-theme';
  const themeMeta = $('meta[name="theme-color"]');
  const applyTheme = (t) => {
    html.dataset.theme = t;
    if (themeMeta) themeMeta.content = t === 'dark' ? '#0b0b0b' : '#f3f2ee';
    $$('.theme-toggle').forEach((b) => b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'));
  };
  applyTheme(html.dataset.theme || 'light');
  $$('.theme-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode */ }
      const r = btn.getBoundingClientRect();
      html.style.setProperty('--vt-x', `${r.left + r.width / 2}px`);
      html.style.setProperty('--vt-y', `${r.top + r.height / 2}px`);
      if (document.startViewTransition && !REDUCED) document.startViewTransition(() => applyTheme(next));
      else applyTheme(next);
    });
  });

  /* ---------------------------------------------------------- smooth scroll */
  let lenis = null;
  if (typeof Lenis !== 'undefined' && !REDUCED && FINE) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 });
    if (HAS_GSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const scrollTo = (target, offset = -(parseInt(getComputedStyle(html).getPropertyValue('--nav-h')) || 76) + 8) => {
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.2 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: REDUCED ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      scrollTo(el);
      history.replaceState(null, '', id);
    });
  });

  /* ------------------------------------------------------------ text splits */
  const splitChars = (el) => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    for (const ch of text) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
    }
  };
  const wrapWord = (node, cls) => {
    const wd = document.createElement('span'); wd.className = 'wd';
    const wi = document.createElement('span'); wi.className = 'wi' + (cls ? ' ' + cls : '');
    wi.appendChild(node);
    wd.appendChild(wi);
    return wd;
  };
  const splitWords = (el) => {
    const frag = document.createDocumentFragment();
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
          else frag.appendChild(wrapWord(document.createTextNode(part)));
        });
      } else if (n.nodeName === 'BR') {
        frag.appendChild(n);
      } else {
        frag.appendChild(wrapWord(n));
      }
    });
    el.textContent = '';
    el.appendChild(frag);
    el.classList.add('is-split');
  };

  /* --------------------------------------------------------- hero + loader */
  const hero = $('.hero');
  const heroName = $('.hero-name');
  if (heroName) $$('.w', heroName).forEach(splitChars);

  const loader = $('.loader');
  let seen = false;
  try { seen = sessionStorage.getItem('aa-seen') === '1'; } catch (e) { /* ignore */ }

  const introTimeline = () => {
    if (!HAS_GSAP) return null;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero-name .ch', { yPercent: 115, rotate: 3, duration: 1.15, stagger: { each: 0.035, from: 'start' } }, 0)
      .from('.hero-photo', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.25, ease: 'expo.inOut' }, 0.05)
      .from('.hero-photo img', { scale: 1.3, duration: 1.8 }, 0.05)
      .from('[data-hero-fade]', { y: 22, opacity: 0, duration: 0.9, stagger: 0.07 }, 0.5)
      .from('.hero-watermark', { opacity: 0, xPercent: -6, duration: 1.6 }, 0.2);
    return tl;
  };

  if (loader && HAS_GSAP && !REDUCED && !seen) {
    try { sessionStorage.setItem('aa-seen', '1'); } catch (e) { /* ignore */ }
    const num = $('.loader-n span');
    const counter = { v: 0 };
    const tl = gsap.timeline();
    tl.to(counter, { v: 100, duration: 1.1, ease: 'power2.inOut', onUpdate: () => { if (num) num.textContent = Math.round(counter.v); } })
      .to('.loader-n, .loader-tag', { yPercent: -30, opacity: 0, duration: 0.45, ease: 'power2.in' }, '-=0.1')
      .to(loader, { yPercent: -100, duration: 0.95, ease: 'expo.inOut', onComplete: () => loader.remove() }, '-=0.3')
      .add(introTimeline(), '-=0.6');
  } else {
    if (loader) loader.remove();
    if (HAS_GSAP && !REDUCED) introTimeline();
  }

  if (HAS_GSAP && !REDUCED && hero) {
    const isDesktop = matchMedia('(min-width: 901px)');
    const heroScrub = () => gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero-photo', { yPercent: -22, ease: 'none' }, 0)
      .to('.hero-name .w:first-child', { xPercent: -9, ease: 'none' }, 0)
      .to('.hero-name .w:last-child', { xPercent: 9, ease: 'none' }, 0)
      .to('.hero-watermark', { xPercent: -14, ease: 'none' }, 0)
      .to('.hero-kicker, .hero-role, .hero-side, .hero-social, .hero-scroll', { opacity: 0, y: -24, ease: 'none' }, 0);
    let scrub = isDesktop.matches ? heroScrub() : null;
    isDesktop.addEventListener('change', (e) => {
      if (scrub) { scrub.scrollTrigger.kill(); scrub.kill(); gsap.set('.hero-photo, .hero-name .w, .hero-watermark, .hero-kicker, .hero-role, .hero-side, .hero-social, .hero-scroll', { clearProps: 'all' }); scrub = null; }
      if (e.matches) scrub = heroScrub();
    });
  }

  /* ----------------------------------------------------------------- nav */
  const nav = $('.nav');
  if (nav) {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 24);
      const menuOpen = $('.menu')?.classList.contains('is-open');
      nav.classList.toggle('is-hidden', !menuOpen && y > 160 && y > lastY + 4);
      if (y < lastY - 4 || y < 160) nav.classList.remove('is-hidden');
      lastY = y;
    };
    if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const links = $$('.nav-links a');
    const setActive = (id) => links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    if (HAS_GSAP) {
      $$('main section[id]').forEach((sec) => {
        ScrollTrigger.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%', onEnter: () => setActive(sec.id), onEnterBack: () => setActive(sec.id) });
      });
    } else {
      const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -45% 0px' });
      $$('main section[id]').forEach((s) => io.observe(s));
    }
  }

  /* ------------------------------------------------------------ mobile menu */
  const menu = $('.menu');
  const burger = $('.burger');
  const openMenu = () => {
    if (!menu) return;
    menu.classList.add('is-open');
    burger?.classList.add('is-open');
    burger?.setAttribute('aria-expanded', 'true');
    nav?.classList.remove('is-hidden');
    lenis ? lenis.stop() : (document.body.style.overflow = 'hidden');
    if (HAS_GSAP && !REDUCED) gsap.from('.menu-links a, .menu-foot > *', { y: 36, opacity: 0, duration: 0.7, stagger: 0.06, ease: 'expo.out' });
  };
  function closeMenu() {
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    burger?.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
    lenis ? lenis.start() : (document.body.style.overflow = '');
  }
  burger?.addEventListener('click', () => (menu.classList.contains('is-open') ? closeMenu() : openMenu()));
  addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

  /* ---------------------------------------------------------------- reveals */
  if (HAS_GSAP) {
    const once = { once: true };
    $$('[data-split]').forEach((el) => {
      splitWords(el);
      if (REDUCED) return;
      gsap.from($$('.wi', el), { yPercent: 112, duration: 1, ease: 'expo.out', stagger: 0.045, scrollTrigger: { trigger: el, start: 'top 88%', ...once } });
    });
    if (!REDUCED) {
      $$('[data-reveal]').forEach((el) => {
        gsap.fromTo(el, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: parseFloat(el.dataset.delay || 0), ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', ...once } });
      });
      $$('[data-reveal-group]').forEach((g) => {
        gsap.fromTo(g.children, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: g, start: 'top 88%', ...once } });
      });
      $$('.rule').forEach((r) => {
        gsap.from(r, { scaleX: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 92%', ...once } });
      });
      $$('[data-parallax]').forEach((el) => {
        const amt = parseFloat(el.dataset.parallax) || 8;
        gsap.fromTo(el, { yPercent: amt }, { yPercent: -amt, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    } else {
      gsap.set('[data-reveal], [data-reveal-group] > *', { opacity: 1 });
    }
  }

  /* ------------------------------------------------- statement word scrub */
  const statement = $('.statement');
  if (statement) {
    const words = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(' '));
            else { const s = document.createElement('span'); s.className = 'aw'; s.textContent = p; frag.appendChild(s); words.push(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(statement);
    if (HAS_GSAP && !REDUCED) {
      gsap.set(words, { opacity: 0.18 });
      gsap.to(words, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: statement, start: 'top 78%', end: 'bottom 40%', scrub: 0.6 } });
    }
  }

  /* ---------------------------------------------------------------- counters */
  const fmt = (el, v) => {
    const dec = +(el.dataset.dec || 0);
    let s = v.toFixed(dec);
    if (el.dataset.comma) s = (+s).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    el.textContent = (el.dataset.prefix || '') + s + (el.dataset.suffix || '');
  };
  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    if (!HAS_GSAP || REDUCED) { fmt(el, end); return; }
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 1.6, ease: 'power4.out', onUpdate: () => fmt(el, o.v) }),
    });
  });

  /* ------------------------------------------------ flow diagrams (agents) */
  $$('[data-flow]').forEach((root) => {
    const nodes = $$('.node', root);
    const status = $('.flow-status', root);
    if (!nodes.length || !status) return;
    const cmds = JSON.parse(root.dataset.cmds || '[]');
    const blocked = root.dataset.blocked || 'Blocked by the gate.';
    const passed = root.dataset.passed || 'Gate passed';
    const done = root.dataset.done || 'Done';
    let i = 0, hold = 0, c = 0, timer = null;
    const label = () => cmds.length ? `${root.dataset.prompt || 'Input'}: ${cmds[c]}` : '';
    const reset = () => { nodes.forEach((n) => n.classList.remove('lit', 'block')); i = 0; c = (c + 1) % Math.max(cmds.length, 1); status.textContent = label(); status.className = 'flow-status'; };
    status.textContent = label();
    if (REDUCED) { nodes.forEach((n) => n.classList.add('lit')); status.textContent = `${done}: ${cmds[0] || ''}`; status.className = 'flow-status ok'; return; }
    const tick = () => {
      if (hold > 0) { hold--; if (hold === 0) reset(); return; }
      nodes.forEach((n) => n.classList.remove('lit'));
      const n = nodes[i];
      n.classList.add('lit');
      if (n.classList.contains('gate')) {
        if (Math.random() < 0.34) { n.classList.add('block'); status.textContent = blocked; status.className = 'flow-status bad'; hold = 4; return; }
        status.textContent = `${passed}: ${cmds[c] || ''}`; status.className = 'flow-status ok';
      }
      i++;
      if (i >= nodes.length) { status.textContent = `${done}: ${cmds[c] || ''}`; status.className = 'flow-status ok'; hold = 3; }
    };
    const start = () => { if (!timer) timer = setInterval(tick, 720); };
    const stop = () => { clearInterval(timer); timer = null; };
    const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), { threshold: 0.2 });
    io.observe(root);
  });

  /* ----------------------------------------------------- canvas helpers */
  const cssVar = (name) => getComputedStyle(html).getPropertyValue(name).trim();
  const fitCanvas = (cv) => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return null;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    return { ctx: cv.getContext('2d'), W: cv.width, H: cv.height, dpr };
  };
  const onView = (el, cb, threshold = 0.25) => {
    const io = new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { threshold });
    io.observe(el);
  };

  /* -------------------------------------------- TraderAI: grounded chart */
  const tcv = $('#traderViz');
  if (tcv) {
    // Deterministic pseudo-random walk so the chart reads the same on every load.
    let seed = 20260926;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const N = 140, series = [];
    let p = 100;
    for (let k = 0; k < N; k++) {
      let drift = 0.25;
      if (k > 62 && k < 74) drift = -1.9;           // sharp drop: the falling knife guard fires
      if (k >= 74 && k < 92) drift = -0.15;
      if (k >= 92) drift = 0.55;
      p += drift + (rnd() - 0.5) * 2.2;
      series.push(p);
    }
    const min = Math.min(...series), max = Math.max(...series);
    let prog = 0, running = false, raf = null;
    const draw = () => {
      const f = fitCanvas(tcv); if (!f) return;
      const { ctx, W, H, dpr } = f;
      const ink = cssVar('--ink'), ink3 = cssVar('--ink-3'), line = cssVar('--line-2'), acc = cssVar('--accent'), ok = cssVar('--ok');
      ctx.clearRect(0, 0, W, H);
      const padL = 18 * dpr, padR = 26 * dpr, padT = 26 * dpr, padB = 34 * dpr;
      const x = (k) => padL + (k / (N - 1)) * (W - padL - padR);
      const y = (v) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
      // grid
      ctx.strokeStyle = line; ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) { const gy = padT + (g / 4) * (H - padT - padB); ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(W - padR, gy); ctx.stroke(); }
      const upto = Math.max(2, Math.floor(prog * N));
      // ATR stop band (below price)
      ctx.beginPath();
      for (let k = 0; k < upto; k++) { const yy = y(series[k] - 6.5); k === 0 ? ctx.moveTo(x(k), yy) : ctx.lineTo(x(k), yy); }
      for (let k = upto - 1; k >= 0; k--) ctx.lineTo(x(k), y(series[k] - 11));
      ctx.closePath(); ctx.fillStyle = ink; ctx.globalAlpha = 0.06; ctx.fill(); ctx.globalAlpha = 1;
      // guard zone
      const g0 = 62, g1 = 76;
      if (upto > g0) {
        const gx0 = x(g0), gx1 = x(Math.min(g1, upto - 1));
        ctx.fillStyle = acc; ctx.globalAlpha = 0.1; ctx.fillRect(gx0, padT, gx1 - gx0, H - padT - padB); ctx.globalAlpha = 1;
        ctx.setLineDash([3 * dpr, 4 * dpr]); ctx.strokeStyle = acc; ctx.beginPath(); ctx.moveTo(gx0, padT); ctx.lineTo(gx0, H - padB); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = acc; ctx.font = `${10 * dpr}px ${cssVar('--font-mono')}`; ctx.textAlign = 'left';
        ctx.fillText(W < 520 * dpr ? 'GUARD: ENTRY BLOCKED' : 'GUARD: FALLING KNIFE, ENTRY BLOCKED', gx0 + 6 * dpr, padT + 12 * dpr);
      }
      // earnings marker
      const ek = 108;
      if (upto > ek) {
        ctx.setLineDash([3 * dpr, 4 * dpr]); ctx.strokeStyle = ink3; ctx.beginPath(); ctx.moveTo(x(ek), padT); ctx.lineTo(x(ek), H - padB); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = ink3; ctx.font = `${10 * dpr}px ${cssVar('--font-mono')}`; ctx.textAlign = 'right';
        ctx.fillText(W < 520 * dpr ? 'EARNINGS' : 'PRE-EARNINGS CARD', x(ek) - 6 * dpr, padT + (W < 520 * dpr ? 26 : 12) * dpr);
      }
      // price line
      ctx.beginPath(); ctx.lineWidth = 1.6 * dpr; ctx.strokeStyle = ink; ctx.lineJoin = 'round';
      for (let k = 0; k < upto; k++) { k === 0 ? ctx.moveTo(x(k), y(series[k])) : ctx.lineTo(x(k), y(series[k])); }
      ctx.stroke();
      // head dot
      const hk = upto - 1;
      ctx.beginPath(); ctx.arc(x(hk), y(series[hk]), 3.2 * dpr, 0, 7); ctx.fillStyle = prog >= 1 ? ok : ink; ctx.fill();
      // axis labels
      ctx.fillStyle = ink3; ctx.font = `${10 * dpr}px ${cssVar('--font-mono')}`; ctx.textAlign = 'left';
      ctx.fillText('730-DAY WALK-FORWARD', padL, H - 12 * dpr);
      ctx.textAlign = 'right'; ctx.fillText('ATR STOP BAND', W - padR, H - 12 * dpr);
    };
    const loop = () => {
      if (!running) return;
      prog = Math.min(1, prog + (REDUCED ? 1 : 0.008));
      draw();
      if (prog < 1) raf = requestAnimationFrame(loop);
      else raf = null;
    };
    onView(tcv, (v) => { running = v; if (v && !raf) raf = requestAnimationFrame(loop); });
    addEventListener('resize', () => draw());
    new MutationObserver(() => draw()).observe(html, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ------------------------------------------------ ClassQ: chaos replay */
  const qcv = $('#classqViz');
  if (qcv) {
    const reqEl = $('#cq-req'), seatEl = $('#cq-seat'), waitEl = $('#cq-wait');
    const TOTAL = 500, SEATS = 30;
    let parts = [], fired = 0, seats = 0, wait = 0, running = false, raf = null, settle = 0;
    const reset = () => { parts = []; fired = 0; seats = 0; wait = 0; settle = 0; };
    const draw = () => {
      const f = fitCanvas(qcv); if (!f) return;
      const { ctx, W, H, dpr } = f;
      const ink = cssVar('--ink'), ink3 = cssVar('--ink-3'), ok = cssVar('--ok'), line = cssVar('--line');
      ctx.clearRect(0, 0, W, H);
      const nx = W * 0.5, ny = H * 0.47, r = Math.min(H * 0.28, 60 * dpr);
      if (fired < TOTAL) for (let k = 0; k < 6 && fired < TOTAL; k++) { fired++; parts.push({ x: -8 * dpr, y: H * (0.14 + Math.random() * 0.72), st: 0 }); }
      parts.forEach((q) => {
        if (q.st === 0) {
          const dx = nx - q.x, dy = ny - q.y, d = Math.hypot(dx, dy);
          q.x += (dx / d) * 7 * dpr; q.y += (dy / d) * 7 * dpr;
          if (d < r) { if (seats < SEATS) { seats++; q.st = 2; } else { wait++; q.st = 1; } }
        } else if (q.st === 1) {
          const qx = W * 0.86, qy = H * 0.5, dx = qx - q.x, dy = qy - q.y, d = Math.hypot(dx, dy);
          q.x += (dx / d) * 6 * dpr; q.y += (dy / d) * 6 * dpr;
          if (d < 8 * dpr) q.st = 3;
        }
        if (q.st < 2) { ctx.fillStyle = q.st === 0 ? ink : ink3; ctx.globalAlpha = q.st === 0 ? 0.75 : 0.5; ctx.beginPath(); ctx.arc(q.x, q.y, 1.7 * dpr, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      });
      parts = parts.filter((q) => q.st < 2);
      ctx.lineWidth = 3 * dpr;
      ctx.strokeStyle = line; ctx.beginPath(); ctx.arc(nx, ny, r, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = ok; ctx.beginPath(); ctx.arc(nx, ny, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (seats / SEATS)); ctx.stroke();
      ctx.fillStyle = ink; ctx.font = `${12 * dpr}px ${cssVar('--font-mono')}`; ctx.textAlign = 'center';
      ctx.fillText(`${seats}/${SEATS}`, nx, ny + 4 * dpr);
      ctx.fillStyle = ink3; ctx.font = `${10 * dpr}px ${cssVar('--font-mono')}`;
      ctx.fillText('SECTION · REDIS LUA', nx, ny + r + 18 * dpr);
      ctx.textAlign = 'left';
      const qn = Math.min(wait, 48);
      for (let k = 0; k < qn; k++) { const col = k % 8, row = Math.floor(k / 8); ctx.fillStyle = ink3; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(W * 0.8 + col * 7 * dpr, H * 0.36 + row * 7 * dpr, 2 * dpr, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.fillStyle = ink3; ctx.fillText('WAITLIST · FIFO', W * 0.8, H * 0.36 - 14 * dpr);
      if (reqEl) reqEl.textContent = fired;
      if (seatEl) seatEl.innerHTML = `${seats}<em>/30</em>`;
      if (waitEl) waitEl.textContent = wait;
      if (fired >= TOTAL && parts.length === 0) { settle++; if (settle > 180) reset(); }
    };
    const loop = () => { if (!running) { raf = null; return; } draw(); raf = requestAnimationFrame(loop); };
    onView(qcv, (v) => {
      running = v;
      if (REDUCED) { fired = TOTAL; seats = SEATS; wait = TOTAL - SEATS; draw(); running = false; return; }
      if (v && !raf) raf = requestAnimationFrame(loop);
    });
  }

  /* ----------------------------------------------------- bench bars */
  $$('.bar i').forEach((b) => {
    const w = b.dataset.w || '0%';
    if (!HAS_GSAP || REDUCED) { b.style.width = w; return; }
    ScrollTrigger.create({ trigger: b, start: 'top 90%', once: true, onEnter: () => gsap.to(b, { width: w, duration: 1.4, ease: 'expo.out' }) });
  });

  /* ------------------------------------------------------------- accordion */
  $$('.xp-head').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.xp-item');
      const open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      if (HAS_GSAP) setTimeout(() => ScrollTrigger.refresh(), 520);
    });
  });

  /* ----------------------------------------------------------- video facade */
  $$('.video button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.video');
      const src = wrap.dataset.src;
      const f = document.createElement('iframe');
      f.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
      f.title = wrap.dataset.title || 'Video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      wrap.innerHTML = '';
      wrap.appendChild(f);
    });
  });

  /* ---------------------------------------------------------------- cursor */
  if (FINE && !REDUCED && HAS_GSAP) {
    const dot = $('.cursor'), ring = $('.cursor-ring');
    if (dot && ring) {
      html.classList.add('has-cursor');
      const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' }), dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
      const rx = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3' });
      addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
      document.addEventListener('pointerover', (e) => {
        const view = e.target.closest('[data-cursor="view"]');
        const inter = e.target.closest('a, button, input, textarea, [data-cursor]');
        ring.classList.toggle('is-view', !!view);
        ring.classList.toggle('is-hover', !!inter && !view);
      });
      document.addEventListener('pointerleave', () => gsap.to([dot, ring], { opacity: 0, duration: 0.3 }));
      document.addEventListener('pointerenter', () => gsap.to([dot, ring], { opacity: 1, duration: 0.3 }));
    }
  }

  /* -------------------------------------------------------------- magnetic */
  if (FINE && !REDUCED && HAS_GSAP) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.32);
      });
      el.addEventListener('pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' }); });
    });
  }

  /* --------------------------------------------------------- email + toast */
  const user = 'avadhav', domain = 'asu.edu', addr = `${user}@${domain}`;
  $$('[data-email]').forEach((el) => {
    if (el.tagName === 'A') el.href = `mailto:${addr}`;
    if (el.dataset.email === 'text') el.textContent = addr;
  });
  const toast = $('.toast');
  const say = (msg) => { if (!toast) return; toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove('is-on'), 1800); };
  $$('[data-copy-email]').forEach((b) => b.addEventListener('click', async (e) => {
    e.preventDefault();
    try { await navigator.clipboard.writeText(addr); say('Email copied'); } catch (err) { location.href = `mailto:${addr}`; }
  }));

  /* ------------------------------------------------------------------ clock */
  const clock = $('[data-clock]');
  if (clock) {
    const f = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Phoenix' });
    const tickClock = () => { clock.textContent = f.format(new Date()); };
    tickClock(); setInterval(tickClock, 30000);
  }

  /* ------------------------------------------------------------ back to top */
  $$('[data-top]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); scrollTo(0, 0); }));

  /* ------------------------------------------------------- final refresh */
  if (HAS_GSAP) {
    addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
