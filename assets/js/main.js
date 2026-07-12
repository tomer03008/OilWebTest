// כרם אדר — the pinned bottle showcase.
// Scrolling inside the showcase doesn't move the page: it swaps the bottle,
// the floating ingredients, the texts and the background color. Everything
// degrades to a stacked catalogue without JS / GSAP / with reduced motion.

document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const forceStatic = new URLSearchParams(location.search).has('static');
const motionOn = !reduceMotion && hasGsap && !forceStatic;
document.documentElement.classList.add(motionOn ? 'motion' : 'no-motion');
if (forceStatic) document.documentElement.classList.add('static');

// test-only: ?static&only=N isolates one showcase slide for screenshots
const onlySlide = new URLSearchParams(location.search).get('only');
if (forceStatic && onlySlide !== null) {
  document.querySelectorAll('.hero, .story, .visit, .footer, footer').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.slide').forEach(s => {
    if (s.dataset.slide !== onlySlide) s.style.display = 'none';
  });
}

/* ============ NAV ============ */
const nav = document.querySelector('.nav');
const hero = document.querySelector('.hero');
const setNav = () => {
  const past = window.scrollY > (hero ? hero.offsetHeight - 90 : 90);
  nav.classList.toggle('is-solid', past);
};
setNav();
window.addEventListener('scroll', setNav, { passive: true });

/* ============ LENIS ============ */
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
    if (lenis) lenis.scrollTo(target, { offset: -56, duration: 1.3 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

/* ============ MOTION ============ */
if (motionOn) {
  gsap.registerPlugin(ScrollTrigger);
  if (lenis) lenis.on('scroll', ScrollTrigger.update);

  /* --- hero entrance + slow drift out --- */
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .fromTo('.hero__media img', { scale: 1.08 }, { scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
    .to('.hero__kicker .line__inner', { y: 0, duration: 0.8 }, 0.2)
    .to('.hero__title .line__inner', { y: 0, duration: 1, stagger: 0.13 }, 0.35)
    .to('.hero__lede .line__inner', { y: 0, duration: 0.85 }, 0.75)
    .to('.hero__ctas', { opacity: 1, duration: 0.7 }, 1.0)
    .to('.hero__rule', { scaleX: 1, duration: 1, ease: 'power2.inOut' }, 1.05);

  gsap.to('.hero__media', {
    yPercent: 14, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__content', {
    yPercent: -10, opacity: 0.3, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '55% 40%', end: 'bottom top', scrub: true }
  });

  /* ============ THE SHOWCASE — ZestySip-style stage ============ */
  const showcase = document.querySelector('.showcase');
  const bgEl = document.querySelector('.showcase__bg');
  const revealEl = document.querySelector('.showcase__reveal');
  const slides = gsap.utils.toArray('.slide');
  const dots = gsap.utils.toArray('.showcase__progress .dot');
  const N = slides.length;

  // idle drift: floats breathe forever (yPercent — never clashes with the
  // scroll timeline, which owns x/y/scale/opacity)
  document.querySelectorAll('.float').forEach((el, i) => {
    gsap.to(el, {
      yPercent: gsap.utils.random(-7, -12),
      duration: gsap.utils.random(2.6, 4.2),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: i * 0.3
    });
  });
  document.querySelectorAll('.bottle-inner').forEach((el, i) => {
    gsap.to(el, { y: -14, rotation: 1.2, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.4 });
  });

  // mouse parallax: bottle and giant title drift on opposite depths
  if (window.matchMedia('(pointer: fine)').matches) {
    const qBottle = slides.map(s => gsap.quickTo(s.querySelector('.bottle-inner'), 'xPercent', { duration: 0.7, ease: 'power2.out' }));
    const qGiant = slides.map(s => gsap.quickTo(s.querySelector('.slide__giant'), 'xPercent', { duration: 0.9, ease: 'power2.out' }));
    showcase.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2; // -1..1
      qBottle.forEach(fn => fn(nx * -3.5));
      qGiant.forEach(fn => fn(nx * 2));
    });
  }

  let current = 0;
  const setDots = (i) => {
    if (i === current) return;
    current = i;
    dots.forEach((d, di) => d.classList.toggle('is-active', di === i));
    showcase.classList.toggle('is-dark', slides[i].classList.contains('slide--dark'));
  };

  const st = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: '.showcase',
      start: 'top top',
      end: '+=2800',
      pin: true,
      scrub: 0.4,
      onUpdate: (self) => setDots(Math.min(N - 1, Math.floor(self.progress * N)))
    }
  });

  // each float exits outward, away from the stage center
  const outVec = (el, dist) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2 - window.innerWidth / 2;
    const cy = r.top + r.height / 2 - window.innerHeight / 2;
    const len = Math.hypot(cx, cy) || 1;
    return { x: (cx / len) * dist, y: (cy / len) * dist };
  };

  slides.forEach((slide, i) => {
    const bottle = slide.querySelector('.slide__bottle');
    const giant = slide.querySelector('.slide__giant');
    const floats = gsap.utils.toArray(slide.querySelectorAll('.float'));
    const info = slide.querySelectorAll('.slide__info > *');

    if (i > 0) {
      /* arrive: circle of the new color expands from behind the bottle,
         the bottle drops in with a bounce, ingredients pop outward-in,
         the giant name rises from below */
      const t0 = i - 0.46;
      st.set(revealEl, { backgroundColor: slide.dataset.bg }, t0);
      st.fromTo(revealEl, { clipPath: 'circle(0% at 50% 56%)' },
        { clipPath: 'circle(145% at 50% 56%)', duration: 0.34, ease: 'power2.in', immediateRender: false }, t0);
      st.set(bgEl, { backgroundColor: slide.dataset.bg }, t0 + 0.35);
      st.set(revealEl, { clipPath: 'circle(0% at 50% 56%)' }, t0 + 0.36);

      st.set(slide, { visibility: 'visible' }, t0 + 0.08);
      st.to(slide, { opacity: 1, duration: 0.12 }, t0 + 0.08);
      st.fromTo(giant, { yPercent: 34, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }, t0 + 0.16);
      st.fromTo(bottle, { y: () => window.innerHeight * 0.85, rotation: 10 },
        { y: 0, rotation: 0, duration: 0.4, ease: 'back.out(1.25)' }, t0 + 0.14);
      floats.forEach((f, fi) => {
        st.fromTo(f, { x: () => outVec(f, 260).x, y: () => outVec(f, 260).y, scale: 0.4, opacity: 0 },
          { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(1.6)' }, t0 + 0.2 + fi * 0.028);
      });
      st.fromTo(info, { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.26, stagger: 0.045, ease: 'power3.out' }, t0 + 0.26);
    }

    if (i < N - 1) {
      /* leave: bottle launches upward, ingredients scatter outward,
         giant name lifts away, info drops out */
      const t1 = i + 0.56;
      st.to(bottle, { y: () => -window.innerHeight * 0.8, rotation: -9, duration: 0.36, ease: 'power2.in' }, t1);
      floats.forEach((f, fi) => {
        st.to(f, { x: () => outVec(f, 300).x, y: () => outVec(f, 300).y, scale: 0.45, opacity: 0,
          duration: 0.3, ease: 'power2.in' }, t1 + 0.02 + fi * 0.024);
      });
      st.to(giant, { yPercent: -30, opacity: 0, duration: 0.28, ease: 'power2.in' }, t1 + 0.04);
      st.to(info, { y: 30, opacity: 0, duration: 0.24, stagger: 0.03, ease: 'power2.in' }, t1 + 0.04);
      st.to(slide, { opacity: 0, duration: 0.1,
        onComplete: () => gsap.set(slide, { visibility: 'hidden' }),
        onReverseComplete: () => gsap.set(slide, { visibility: 'visible' }) }, t1 + 0.32);
    }
  });
  // hold the last slide before the pin releases
  st.to({}, { duration: 0.4 }, N - 0.4);

  /* ============ STORY ============ */
  gsap.utils.toArray('.st-rise').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });

  const statement = document.querySelector('[data-words]');
  if (statement) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
    gsap.to(statement.querySelectorAll('.w'), {
      opacity: 1, stagger: 0.3, ease: 'none',
      scrollTrigger: { trigger: statement, start: 'top 78%', end: 'bottom 45%', scrub: true }
    });
  }

  gsap.utils.toArray('.story__photo img').forEach(img => {
    gsap.to(img, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: img.closest('.story__photo'), start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
} else {
  document.querySelectorAll('.st-rise').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
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
