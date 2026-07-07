// כרם אדר — הכוריאוגרפיה.
// המסע (עץ ← מסיק ← כבישה ← בקבוק) מוצמד לגלילה; הכול מתפרק בכבוד
// בלי JS, בלי CDN או עם prefers-reduced-motion.

document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const forceStatic = new URLSearchParams(location.search).has('static');
const motionOn = !reduceMotion && hasGsap && !forceStatic;
document.documentElement.classList.add(motionOn ? 'motion' : 'no-motion');
if (forceStatic) document.documentElement.classList.add('static');

/* ============ NAV ============ */
const nav = document.querySelector('.nav');
const setNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 30);
setNav();
window.addEventListener('scroll', setNav, { passive: true });

/* ============ LENIS SMOOTH SCROLL ============ */
let lenis = null;
if (!reduceMotion && !forceStatic && typeof window.Lenis !== 'undefined') {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
  window.__lenis = lenis;
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -60, duration: 1.3 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

/* ============ MOTION ============ */
if (motionOn) {
  gsap.registerPlugin(ScrollTrigger);
  if (lenis) lenis.on('scroll', ScrollTrigger.update);

  /* --- hero entrance --- */
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to('.hero__kicker .line__inner', { y: 0, duration: 0.8 }, 0.15)
    .to('.hero__title .line__inner', { y: 0, duration: 1, stagger: 0.13 }, 0.3)
    .to('.hero__lede .line__inner', { y: 0, duration: 0.85 }, 0.7)
    .to('.hero__ctas', { opacity: 1, duration: 0.7 }, 0.95)
    .to('.hero__rule', { scaleX: 1, duration: 1, ease: 'power2.inOut' }, 1.0)
    .from('.hero__scene svg', { y: 70, opacity: 0, duration: 1.2, ease: 'power2.out' }, 0.35);

  /* --- hero grove: gentle idle sway + an olive drops now and then --- */
  gsap.to('#hero-canopy', {
    rotation: 1.3,
    svgOrigin: '262 400',
    duration: 4.5,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1
  });

  const heroDrops = gsap.utils.toArray('#hero-drops ellipse');
  const dropOne = (el, delay) => {
    gsap.timeline({ delay, onComplete: () => dropOne(el, gsap.utils.random(3, 7)) })
      .set(el, { opacity: 1, y: 0 })
      .to(el, { y: 215, duration: 0.9, ease: 'power2.in' })
      .to(el, { opacity: 0, duration: 0.25 }, '-=0.1');
  };
  heroDrops.forEach((el, i) => dropOne(el, 2 + i * 2.3));

  /* --- click the tree: shake + a burst of olives --- */
  const tree = document.getElementById('hero-tree');
  let shaking = false;
  tree.addEventListener('click', () => {
    if (shaking) return;
    shaking = true;
    gsap.timeline({ onComplete: () => { shaking = false; } })
      .to('#hero-canopy', { rotation: 2.6, svgOrigin: '262 400', duration: 0.09, yoyo: true, repeat: 7, ease: 'power1.inOut' })
      .to('#hero-canopy', { rotation: 0, svgOrigin: '262 400', duration: 0.3 });
    heroDrops.forEach((el, i) => {
      gsap.timeline()
        .set(el, { opacity: 1, y: 0, x: gsap.utils.random(-14, 14) })
        .to(el, { y: 215, duration: 0.75 + i * 0.08, ease: 'power2.in' })
        .to(el, { opacity: 0, duration: 0.2 }, '-=0.08');
    });
  });

  /* --- hero parallax out --- */
  gsap.to('.hero__content', {
    yPercent: -14, opacity: 0.35, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '55% 40%', end: 'bottom top', scrub: true }
  });

  /* ============ THE JOURNEY — pinned scroll story ============ */
  const scenes = {
    branch: document.querySelector('.scene--branch'),
    press: document.querySelector('.scene--press'),
    oil: document.querySelector('.scene--oil')
  };
  const captions = gsap.utils.toArray('.caption');
  const dots = gsap.utils.toArray('.journey__progress .dot');

  const showScene = (key) => {
    Object.entries(scenes).forEach(([k, el]) => el.classList.toggle('is-active', k === key));
  };
  let currentBeat = -1;
  const showBeat = (i) => {
    if (i === currentBeat) return;
    currentBeat = i;
    captions.forEach((c, ci) => c.classList.toggle('is-active', ci === i));
    dots.forEach((d, di) => d.classList.toggle('is-active', di === i));
    showScene(i <= 1 ? 'branch' : i === 2 ? 'press' : 'oil');
  };

  // prepare the oil stream for line-drawing
  const stream = document.getElementById('oil-stream');
  const streamLen = 164;
  stream.setAttribute('stroke-dasharray', streamLen);
  stream.setAttribute('stroke-dashoffset', streamLen);

  const jt = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.journey',
      start: 'top top',
      end: '+=3400',
      pin: true,
      scrub: 0.55,
      onUpdate: (self) => showBeat(Math.min(3, Math.floor(self.progress * 4)))
    }
  });

  jt
    /* beat 0 — olives ripen on the branch */
    .from('#branch-olives ellipse', {
      scale: 0, svgOrigin: '440 160', transformOrigin: 'center', stagger: 0.09, duration: 0.55, ease: 'back.out(2.2)'
    }, 0.05)
    .fromTo('#branch-sway', { rotation: -1.2 }, { rotation: 1.2, svgOrigin: '620 60', duration: 0.95 }, 0.05)

    /* beat 1 — the shake: olives fall into the net */
    .to('#branch-sway', { rotation: -2.2, svgOrigin: '620 60', duration: 0.1, yoyo: true, repeat: 5, ease: 'power1.inOut' }, 1.05)
    .set('#fall-olives', { opacity: 1 }, 1.12)
    .set('#branch-olives', { opacity: 0 }, 1.12)
    .to('#fall-olives ellipse', {
      y: (i, el) => 460 - parseFloat(el.getAttribute('cy')),
      x: () => gsap.utils.random(-24, 24),
      stagger: 0.06,
      duration: 0.5,
      ease: 'power2.in'
    }, 1.15)
    .to('#net-cloth', { attr: { d: 'M120,440 Q310,545 500,440' }, duration: 0.18, yoyo: true, repeat: 1, ease: 'power1.out' }, 1.62)
    .to('#net-olives', { opacity: 1, duration: 0.12 }, 1.6)
    .to('#fall-olives', { opacity: 0, duration: 0.12 }, 1.62)

    /* beat 2 — the millstone turns */
    .fromTo('#millstone', { rotation: 0 }, { rotation: 620, svgOrigin: '310 330', duration: 0.95 }, 2.02)

    /* beat 3 — oil pours, the bottle fills, the cork seals it */
    .set('#cork', { opacity: 0 }, 3.0)
    .to(stream, { strokeDashoffset: 0, duration: 0.22 }, 3.04)
    .fromTo('#oil-drop', { attr: { cy: 150 }, opacity: 1 }, { attr: { cy: 295 }, opacity: 0, duration: 0.2, repeat: 2 }, 3.1)
    .to('#oil-level', { attr: { y: 328 }, duration: 0.56 }, 3.18)
    .to(stream, { strokeDashoffset: -164, duration: 0.14 }, 3.76)
    .to('#label', { opacity: 1, duration: 0.12 }, 3.82)
    .fromTo('#cork', { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.1 }, 3.9);

  /* ============ generic rise-ins ============ */
  gsap.utils.toArray('.st-rise').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });

  /* ============ story statement — words surface with the scroll ============ */
  const statement = document.querySelector('[data-words]');
  if (statement) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
    gsap.to(statement.querySelectorAll('.w'), {
      opacity: 1, stagger: 0.3, ease: 'none',
      scrollTrigger: { trigger: statement, start: 'top 78%', end: 'bottom 45%', scrub: true }
    });
  }

  /* ============ bottles breathe on entry ============ */
  gsap.utils.toArray('.bottle-item__visual svg').forEach((svg, i) => {
    gsap.from(svg, {
      y: 46, opacity: 0, duration: 0.85, delay: i * 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: svg.closest('.shelf__grid'), start: 'top 80%' }
    });
  });
} else {
  // static tableau: every scene at its "finished" state, everything visible
  document.querySelectorAll('.st-rise').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  document.querySelectorAll('.caption').forEach(c => c.classList.add('is-active'));
  document.querySelectorAll('.scene').forEach(s => s.classList.add('is-active'));
  const netOlives = document.getElementById('net-olives');
  if (netOlives) netOlives.setAttribute('opacity', '1');
  const oilLevel = document.getElementById('oil-level');
  if (oilLevel) oilLevel.setAttribute('y', '328');
  const label = document.getElementById('label');
  if (label) label.setAttribute('opacity', '1');
  // finished tableau: the bottle is corked, so no stream
  const stream = document.getElementById('oil-stream');
  if (stream) stream.setAttribute('opacity', '0');
  const drop = document.getElementById('oil-drop');
  if (drop) drop.setAttribute('opacity', '0');
}

/* ============ ORDER DRAWER ============ */
const drawer = document.getElementById('order-drawer');
const productSelect = document.getElementById('order-product');

document.querySelectorAll('[data-open-drawer]').forEach(btn => {
  btn.addEventListener('click', () => {
    const choose = btn.getAttribute('data-choose');
    if (choose && productSelect) productSelect.value = choose;
    drawer.showModal();
    if (lenis) lenis.stop();
  });
});

const closeDrawer = () => { drawer.close(); };
drawer.querySelector('[data-close-drawer]').addEventListener('click', closeDrawer);
drawer.addEventListener('click', (e) => { if (e.target === drawer) closeDrawer(); });
drawer.addEventListener('close', () => { if (lenis) lenis.start(); });

document.getElementById('order-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const msg = [
    'הזמנה חדשה מהאתר — כרם אדר',
    `שם: ${f.get('name')}`,
    `טלפון: ${f.get('phone')}`,
    `שמן: ${f.get('product')}`,
    `כמות: ${f.get('quantity')}`,
    `כתובת: ${f.get('address')}`
  ].join('\n');
  window.open(`https://wa.me/97246982417?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  closeDrawer();
});
