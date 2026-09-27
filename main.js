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
  if (typeof Lenis !== 'undefined' && !REDUCED && FINE && !location.search.includes('nolenis')) {
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
    const frag = document.createDocumentFragment();
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 1) { n.classList.add('ch'); n.setAttribute('aria-hidden', 'true'); frag.appendChild(n); return; }
      for (const ch of n.textContent) {
        const s = document.createElement('span');
        s.className = 'ch';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = ch === ' ' ? ' ' : ch;
        frag.appendChild(s);
      }
    });
    el.textContent = '';
    el.appendChild(frag);
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
      .to('.hero-name .track', { x: '-42vw', ease: 'none' }, 0)
      .to('.hero-watermark', { xPercent: -14, ease: 'none' }, 0)
      .to('.hero-kicker, .hero-role, .hero-side, .hero-social, .hero-scroll', { opacity: 0, y: -24, ease: 'none' }, 0);
    let scrub = isDesktop.matches ? heroScrub() : null;
    isDesktop.addEventListener('change', (e) => {
      if (scrub) { scrub.scrollTrigger.kill(); scrub.kill(); gsap.set('.hero-name .track, .hero-watermark, .hero-kicker, .hero-role, .hero-side, .hero-social, .hero-scroll', { clearProps: 'all' }); scrub = null; }
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

  /* ------------------------------------------- featured project cards */
  const cases = $$('.case');
  if (HAS_GSAP && cases.length) {
    const navH = () => parseInt(getComputedStyle(html).getPropertyValue('--nav-h')) || 76;
    if (!REDUCED) {
      // Sticky stack: the card underneath shrinks and dims as the next one slides over it.
      const mm = gsap.matchMedia();
      mm.add('(min-width: 901px) and (min-height: 700px)', () => {
        cases.forEach((card, i) => {
          const next = cases[i + 1];
          if (!next) return;
          gsap.to(card, {
            scale: 0.93, y: -16, '--dim': 0.72, ease: 'none',
            scrollTrigger: { trigger: next, start: 'top bottom', end: () => `top top+=${navH() + 12}`, scrub: true },
          });
        });
      });
      cases.forEach((card) => {
        const vis = $('.case-visual', card);
        const ghost = $('.case-ghost', card);
        const body = $$('.case-body > *', card);
        // Visual panel: scrubbed clip-path wipe with a slow settle from zoomed-in to true size.
        gsap.fromTo(vis,
          { clipPath: 'inset(16% 10% 16% 10% round 32px)', scale: 1.1 },
          { clipPath: 'inset(0% 0% 0% 0% round 18px)', scale: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top 92%', end: 'top 30%', scrub: 0.6 } });
        gsap.from(body, { y: 34, opacity: 0, duration: 1, stagger: 0.075, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 72%', once: true } });
        if (ghost) gsap.fromTo(ghost, { yPercent: 40, rotate: 4 }, { yPercent: -30, rotate: -2, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }
    // Pointer spotlight and a light 3D tilt on the visual panel.
    if (FINE && !REDUCED) {
      cases.forEach((card) => {
        const vis = $('.case-visual', card);
        if (!vis) return;
        const rx = gsap.quickTo(vis, 'rotationX', { duration: 0.6, ease: 'power3' });
        const ry = gsap.quickTo(vis, 'rotationY', { duration: 0.6, ease: 'power3' });
        gsap.set(vis, { transformPerspective: 1100 });
        vis.addEventListener('pointermove', (e) => {
          const r = vis.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          rx((0.5 - py) * 6);
          ry((px - 0.5) * 6);
        });
        vis.addEventListener('pointerleave', () => { rx(0); ry(0); });
      });
    }
  }

  /* --------------------------------------------- project grid entrance */
  const grid = $('.grid-more');
  if (grid) {
    const minis = $$('.mini', grid);
    if (HAS_GSAP && !REDUCED) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: grid, start: 'top 82%', once: true } });
      tl.from(minis, { y: 48, opacity: 0, scale: 0.96, duration: 0.9, stagger: { each: 0.06, from: 'start' }, ease: 'expo.out' }, 0)
        .fromTo(minis, { '--bar-scale': 0 }, { '--bar-scale': 1, duration: 0.7, stagger: 0.06, ease: 'power2.out' }, 0.35); // draws each card's orange top rule in sequence
    } else {
      minis.forEach((m) => m.style.setProperty('--bar-scale', '1'));
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

  /* ------------------------------------------------ shared visual helpers */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // Runs an async loop only while the element is on screen; the token cancels a run mid-way.
  const runWhileVisible = (el, loopFn, threshold = 0.2) => {
    let token = 0, active = false;
    const io = new IntersectionObserver((es) => es.forEach(async (e) => {
      if (e.isIntersecting && !active) { active = true; const my = ++token; while (active && my === token) { await loopFn(() => active && my === token); } }
      else if (!e.isIntersecting && active) { active = false; token++; }
    }), { threshold });
    io.observe(el);
  };

  /* ----------------------------------------- AllVoice: voice on a demo page */
  $$('[data-flow]').forEach((root) => {
    const nodes = $$('.node', root), status = $('.flow-status', root), transcript = $('.transcript', root);
    let cmds = [];
    try { cmds = JSON.parse(root.dataset.cmds || '[]'); } catch (e) { return; }
    if (!nodes.length || !status || !cmds.length) return;
    const targets = $$('[data-target]', root);
    const clearTargets = () => targets.forEach((t) => t.classList.remove('scan', 'act', 'blocked'));
    const tgt = (name) => root.querySelector(`[data-target="${name}"]`);
    const say = (text, cls = '') => { status.textContent = text; status.className = 'flow-status' + (cls ? ' ' + cls : ''); };
    if (REDUCED) { nodes.forEach((n) => n.classList.add('lit')); say(`Executed and logged: "${cmds[0].t}"`, 'ok'); if (transcript) transcript.textContent = `"${cmds[0].t}"`; return; }
    let c = 0;
    runWhileVisible(root, async (alive) => {
      const cmd = cmds[c];
      nodes.forEach((n) => n.classList.remove('lit', 'block'));
      clearTargets();
      root.classList.remove('is-muted');
      if (transcript) transcript.textContent = `"${cmd.t}"`;
      say(`Voice: "${cmd.t}"`);
      await sleep(900);
      for (let i = 0; i < nodes.length && alive(); i++) {
        nodes.forEach((n) => n.classList.remove('lit'));
        const n = nodes[i]; n.classList.add('lit');
        const step = n.dataset.step, t = tgt(cmd.target);
        if (step === 'intent') { say(`Intent parsed: ${cmd.blocked ? 'fill' : (cmd.target === 'article' ? 'read' : cmd.target === 'checkout' ? 'click' : 'fill')} → "${cmd.target}"`); root.classList.add('is-muted'); }
        if (step === 'observe') { if (t) t.classList.add('scan'); say(`Observing DOM: found ${cmd.label || cmd.target}, checking accessible name and field type`); }
        if (step === 'gate') {
          if (cmd.blocked) {
            n.classList.add('block');
            if (t) { t.classList.remove('scan'); t.classList.add('blocked'); }
            say(`Gate blocked: ${cmd.rule}. The action never reaches the page.`, 'bad');
            await sleep(3200);
            break;
          }
          say('Gate passed: 5 rules evaluated, no sensitive field, control is labeled', 'ok');
        }
        if (step === 'execute') { if (t) { t.classList.remove('scan'); t.classList.add('act'); } say(cmd.done || 'Executed'); }
        if (step === 'respond') { say(`Speaking: "${cmd.say || 'Done.'}"`); }
        if (step === 'audit') { say(`Audit log: ${cmd.target} · allowed · ${new Date().toISOString().slice(11, 19)}Z · chrome.storage.local`, 'ok'); }
        await sleep(i === 0 ? 700 : 950);
      }
      await sleep(1800);
      c = (c + 1) % cmds.length;
    });
  });

  /* --------------------------------------------- TraderAI: grounded run */
  const trader = $('.viz-trader');
  if (trader) {
    const rows = $$('.t-row:not(.t-h)', trader), log = $('.t-log ul', trader), count = $('.t-count', trader);
    const brief = $('.t-type', trader), budgetBar = $('.t-budget .bar i', trader), budgetB = $('.t-budget b', trader);
    // Deterministic sparkline shapes.
    let seed = 7;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    rows.forEach((r) => {
      const trend = r.dataset.trend, pts = [];
      let v = 13;
      for (let k = 0; k < 24; k++) {
        const drift = trend === 'up' ? -0.45 : trend === 'down' ? (k > 14 ? 1.3 : 0.1) : 0;
        v = Math.max(3, Math.min(23, v + drift + (rnd() - 0.5) * 3));
        pts.push(`${(k / 23) * 120},${v.toFixed(1)}`);
      }
      $('polyline', r).setAttribute('points', pts.join(' '));
    });
    const BRIEF = 'HELIX leads the tier at 82 with a clean guard and 2.4 R:R to the ATR stop. ORBT fell 9% over three sessions, so the falling-knife guard blocked entry. KESTREL reports in three days: a pre-earnings card is ready. Every figure here was fetched, not recalled.';
    const line = (name, result, cls = '') => { const li = document.createElement('li'); li.className = cls; li.innerHTML = `<b>${name}</b><em>${result}</em>`; log.appendChild(li); while (log.children.length > 8) log.removeChild(log.firstChild); };
    const reset = () => {
      rows.forEach((r) => { r.classList.remove('on'); $('.t-score', r).textContent = '0'; const g = $('.t-guard', r); g.textContent = 'pending'; g.className = 't-guard'; });
      log.innerHTML = ''; if (count) count.textContent = '0 / 11 tools'; if (brief) brief.textContent = ''; if (budgetBar) budgetBar.style.setProperty('--w', '0%'); if (budgetB) budgetB.innerHTML = '$0.00 <em>/ $2.00 cap</em>';
    };
    const countTo = async (el, end, ms) => { const t0 = performance.now(); return new Promise((res) => { const step = (t) => { const p = Math.min(1, (t - t0) / ms); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); }); };
    if (REDUCED) {
      reset();
      rows.forEach((r) => { r.classList.add('on'); $('.t-score', r).textContent = r.dataset.score; const g = $('.t-guard', r); g.textContent = r.dataset.guard; g.className = 't-guard ' + (r.dataset.guard === 'clear' ? 'ok' : r.dataset.guard.includes('knife') ? 'bad' : 'warn'); });
      line('get_snapshot ×5', '612 ms', 'ok'); line('score ×5', 'ok', 'ok'); line('guard.check(ORBT)', 'falling knife', 'bad'); line('briefing', 'cached', 'ok');
      if (brief) brief.textContent = BRIEF; if (budgetBar) budgetBar.style.setProperty('--w', '12%'); if (budgetB) budgetB.innerHTML = '$0.24 <em>/ $2.00 cap</em>';
    } else {
      runWhileVisible(trader, async (alive) => {
        reset();
        await sleep(600);
        let used = 0;
        const tools = (n) => { used = Math.min(11, used + n); if (count) count.textContent = `${used} / 11 tools`; };
        for (const r of rows) {
          if (!alive()) return;
          const sym = r.dataset.sym, score = +r.dataset.score, guard = r.dataset.guard;
          line(`get_snapshot(${sym})`, `${90 + Math.round(Math.random() * 80)} ms`, 'ok'); tools(1);
          await sleep(260);
          r.classList.add('on');
          countTo($('.t-score', r), score, 700);
          line(`score(${sym})`, `→ ${score}`); tools(1);
          await sleep(320);
          const g = $('.t-guard', r);
          if (guard.includes('knife')) { line(`guard.check(${sym})`, 'falling knife · blocked', 'bad'); g.textContent = 'blocked'; g.className = 't-guard bad'; }
          else if (guard.includes('earnings')) { line(`earnings(${sym})`, 'in 3 days · card ready'); g.textContent = 'earnings 3d'; g.className = 't-guard warn'; }
          else { g.textContent = 'clear'; g.className = 't-guard ok'; }
          tools(1);
          await sleep(300);
        }
        if (!alive()) return;
        line('risk.size(HELIX)', 'ATR stop · 2.4 R:R'); tools(1);
        await sleep(400);
        line('briefing()', 'cached · 1 call today', 'ok'); tools(1);
        if (budgetBar) budgetBar.style.setProperty('--w', '12%'); if (budgetB) budgetB.innerHTML = '$0.24 <em>/ $2.00 cap</em>';
        for (let k = 0; k <= BRIEF.length && alive(); k += 3) { if (brief) brief.textContent = BRIEF.slice(0, k); await sleep(18); }
        if (brief) brief.textContent = BRIEF;
        await sleep(4200);
      });
    }
  }

  /* ----------------------------------- Adversarial pipeline: terminal run */
  const term = $('#acpTerm');
  if (term) {
    const acpStatus = $('#acpStatus');
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const L = (segs, delay = 420) => ({ segs, delay });
    const BUILD = [
      L([['p', '$ forge run --task "validate-json CLI" --mode build']], 300),
      L([['a', '[architect] '], ['', 'drafting design.md … '], ['hl', '12 requirements, interfaces locked']]),
      L([['a', '[architect] '], ['', 'waiting for human approval … '], ['ok', 'approved']], 900),
      L([['a', '[coder]     '], ['', 'writing failing tests first … '], ['hl', '37 tests, 37 failing']]),
      L([['a', '[coder]     '], ['', 'implementing against the locked design … '], ['ok', '37 passing · 99% coverage']], 700),
      L([['a', '[reviewer]  '], ['', 'phase 1 · spec compliance … '], ['ok', 'ok']]),
      L([['a', '[reviewer]  '], ['', 'phase 2 · attacker mindset … '], ['p1', 'P1'], ['', '  $ref "file:///etc/passwd" reads arbitrary local files']], 600),
      L([['a', '[reviewer]  '], ['', 'phase 2 · attacker mindset … '], ['p1', 'P1'], ['', '  self-referencing $ref → RecursionError, wrong exit code']]),
      L([['a', '[reviewer]  '], ['', 'phase 2 · attacker mindset … '], ['hl', 'P2'], ['', '  TOCTOU race in the file-size guard']]),
      L([['a', '[coder]     '], ['', 'change cycle 2 of 3 … '], ['ok', '3 fixes · 39 passing']], 800),
      L([['a', '[reviewer]  '], ['', 'phase 3 · QA verification … '], ['ok', 'ok']]),
      L([['a', '[gate]      '], ['', 'scanning 8 files, regex only, no model … '], ['ok', 'clean · 14/14 gate tests']], 700),
      L([['ok', '✔ delivered '], ['hl', 'validate-json'], ['', '  ·  1 review cycle  ·  0 P1 open  ·  exit 0']], 500),
    ];
    const AUDIT = [
      L([['p', '$ forge run --mode audit --target tinydb@4.9.0 --read-only']], 300),
      L([['a', '[baseline]  '], ['', 'upstream suite … '], ['ok', '225 passing · 94% coverage']]),
      L([['a', '[gate]      '], ['', 'scanning 10 source files … '], ['ok', 'clean']], 600),
      L([['a', '[architect] '], ['', 'ranking attack surfaces … '], ['hl', '6 surfaces: doc_id coercion, key coercion, query cache, middleware']]),
      L([['a', '[reviewer]  '], ['', 'reproducing … '], ['p1', 'P1'], ['', '  int() leniency collapses keys "1", " 1", "+1", "01" → documents silently destroyed']], 700),
      L([['a', '[reviewer]  '], ['', 'reproducing … '], ['p1', 'P1'], ['', '  string doc_id bypasses duplicate-ID ValueError → silent overwrite']]),
      L([['a', '[reviewer]  '], ['', 'reproducing … '], ['p1', 'P1'], ['', '  regex flags dropped from query-cache hash → stale empty result']]),
      L([['a', '[reviewer]  '], ['', 'candidate 13 … '], ['hl', 'NOT REPRODUCED'], ['', '  rejected, not padded into the count']], 800),
      L([['a', '[qa]        '], ['', 'independent re-reproduction … '], ['ok', '6 of 6 confirmed']]),
      L([['ok', '✔ report    '], ['hl', '14 findings · 6 P1 · runnable PoCs'], ['', '  →  private disclosure, maintainer responded']], 500),
    ];
    const render = (lines) => { term.innerHTML = lines.map((l) => `<span class="ln">${l.segs.map(([c, t]) => `<span class="${c}">${esc(t)}</span>`).join('')}</span>`).join('') + '<span class="cur">▍</span>'; };
    if (REDUCED) { render(BUILD); if (acpStatus) { acpStatus.textContent = 'Build mode: delivered with 0 P1 open'; acpStatus.className = 'flow-status ok'; } }
    else {
      let which = 0;
      runWhileVisible(term.closest('.case-visual'), async (alive) => {
        const script = which % 2 === 0 ? BUILD : AUDIT;
        const shown = [];
        if (acpStatus) { acpStatus.textContent = which % 2 === 0 ? 'Build mode: the agent proposes, the gate disposes' : 'Audit mode: read-only run against a real library'; acpStatus.className = 'flow-status'; }
        render(shown);
        await sleep(500);
        for (const l of script) {
          if (!alive()) return;
          if (l.segs[0][0] === 'p') {
            // Type the prompt line character by character.
            const text = l.segs[0][1];
            for (let k = 1; k <= text.length && alive(); k += 2) { render([...shown, L([['p', text.slice(0, k)]])]); await sleep(14); }
          }
          shown.push(l);
          render(shown);
          if (l.segs.some(([c]) => c === 'p1') && acpStatus) { acpStatus.textContent = 'Reviewer found a P1. The deterministic gate will not let it ship.'; acpStatus.className = 'flow-status bad'; }
          await sleep(l.delay);
        }
        if (acpStatus) { acpStatus.textContent = which % 2 === 0 ? 'Delivered: 1 review cycle, 0 P1 open, exit 0' : 'Reported privately: 14 findings, 6 P1, 1 honestly rejected'; acpStatus.className = 'flow-status ok'; }
        await sleep(4500);
        which++;
      });
    }
  }

  /* ---------------------------------------- ClassQ: registration burst */
  const cqRoot = $('.viz-classq');
  if (cqRoot) {
    const seatsEl = $('#cqSeats'), queueEl = $('#cqQueue'), reqEl = $('#cq-req'), rpsEl = $('#cq-rps'), luaEl = $('#cq-lua'), seatEl = $('#cq-seat'), waitEl = $('#cq-wait'), assertEl = $('#cqAssert');
    const TOTAL = 500, SEATS = 30, SHOW = 18;
    for (let i = 0; i < SEATS; i++) { const d = document.createElement('i'); d.className = 'seat'; seatsEl.appendChild(d); }
    const seats = $$('.seat', seatsEl);
    const paint = (fired, elapsed) => {
      const filled = Math.min(SEATS, fired), waiting = Math.max(0, fired - SEATS);
      seats.forEach((s, i) => s.classList.toggle('on', i < filled));
      reqEl.textContent = fired; luaEl.textContent = fired;
      rpsEl.textContent = elapsed > 0 ? Math.round(fired / Math.max(0.35, elapsed / 1000)) : 0;
      seatEl.textContent = `${filled} / ${SEATS} seats`; waitEl.textContent = `${waiting} waiting`;
      const shown = Math.min(SHOW, waiting);
      while (queueEl.children.length < shown) { const t = document.createElement('span'); t.className = 'qtok'; t.textContent = `#${queueEl.children.length + 1}`; queueEl.appendChild(t); }
      let more = $('.qtok.more', queueEl);
      if (waiting > SHOW) { if (!more) { more = document.createElement('span'); more.className = 'qtok more'; queueEl.appendChild(more); } more.textContent = `+${waiting - SHOW} more, in order`; }
    };
    const reset = () => { queueEl.innerHTML = ''; seats.forEach((s) => s.classList.remove('on')); paint(0, 0); assertEl.textContent = 'waiting for burst'; assertEl.className = 'pill run'; };
    if (REDUCED) { paint(TOTAL, 2400); assertEl.textContent = 'passed · 0 oversold'; assertEl.className = 'pill ok'; }
    else {
      runWhileVisible(cqRoot, async (alive) => {
        reset();
        await sleep(700);
        if (!alive()) return;
        assertEl.textContent = 'burst in flight'; assertEl.className = 'pill run';
        const DUR = 2600, t0 = performance.now();
        await new Promise((res) => {
          const step = (t) => {
            if (!alive()) return res();
            const p = Math.min(1, (t - t0) / DUR), e = 1 - Math.pow(1 - p, 2.2);
            paint(Math.round(TOTAL * e), t - t0);
            if (p < 1) requestAnimationFrame(step); else res();
          };
          requestAnimationFrame(step);
        });
        if (!alive()) return;
        await sleep(400);
        assertEl.textContent = 'checking DB'; assertEl.className = 'pill run';
        await sleep(700);
        assertEl.textContent = 'passed · 0 oversold'; assertEl.className = 'pill ok';
        await sleep(3800);
      });
    }
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

  /* ------------------------------------------------------------ back to top */
  $$('[data-top]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); scrollTo(0, 0); }));

  /* ------------------------------------------------------- final refresh */
  if (HAS_GSAP) {
    addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
