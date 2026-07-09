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

/* ============ BOTTLE SLOTS ============ */
// drop transparent PNGs at assets/img/bottle-1.png / bottle-2.png / bottle-3.png
// and each slide upgrades from the placeholder automatically.
document.querySelectorAll('.bottle-inner[data-bottle]').forEach(async holder => {
  const src = holder.dataset.bottle;
  try {
    const head = await fetch(src, { method: 'HEAD' });
    if (!head.ok) return;
  } catch { return; }
  const img = new Image();
  img.src = src;
  img.alt = '';
  img.decoding = 'async';
  img.addEventListener('load', () => {
    holder.querySelector('.bottle-ph')?.remove();
    holder.appendChild(img);
  }, { once: true });
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

  /* ============ THE SHOWCASE ============ */
  const showcase = document.querySelector('.showcase');
  const bgEl = document.querySelector('.showcase__bg');
  const watermark = document.querySelector('.showcase__watermark');
  const slides = gsap.utils.toArray('.slide');
  const dots = gsap.utils.toArray('.showcase__progress .dot');
  const N = slides.length;

  // idle drift: every floating element breathes forever, out of phase
  document.querySelectorAll('.float').forEach((el, i) => {
    gsap.to(el, {
      y: gsap.utils.random(-16, -30),
      rotation: gsap.utils.random(-5, 5),
      duration: gsap.utils.random(2.6, 4.2),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: i * 0.35
    });
  });
  // idle float lives on the INNER element — the scroll timeline owns the outer,
  // so the two never write to the same transform property.
  document.querySelectorAll('.bottle-inner').forEach((el, i) => {
    gsap.to(el, { y: -14, rotation: 1.2, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.4 });
  });

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
      end: '+=2600',
      pin: true,
      scrub: true,
      onUpdate: (self) => setDots(Math.min(N - 1, Math.floor(self.progress * N)))
    }
  });

  slides.forEach((slide, i) => {
    const parts = {
      bottle: slide.querySelector('.slide__bottle'),
      floats: slide.querySelectorAll('.float'),
      text: slide.querySelectorAll('.slide__text > *')
    };

    if (i > 0) {
      // arrive: background morphs, bottle rises in with a tilt, floats pop, text staggers
      st.set(slide, { visibility: 'visible' }, i - 0.42);
      st.to(bgEl, { backgroundColor: slide.dataset.bg, duration: 0.5 }, i - 0.45);
      st.fromTo(watermark, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3,
        onStart: () => { watermark.textContent = slide.dataset.watermark; },
        onReverseComplete: () => { watermark.textContent = slides[i - 1].dataset.watermark; }
      }, i - 0.18);
      st.to(slide, { opacity: 1, duration: 0.28 }, i - 0.3);
      st.fromTo(parts.bottle, { y: 190, rotation: 9, opacity: 0 },
        { y: 0, rotation: 0, opacity: 1, duration: 0.42, ease: 'power3.out' }, i - 0.3);
      st.fromTo(parts.floats, { scale: 0.4, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, stagger: 0.045, ease: 'back.out(1.8)' }, i - 0.22);
      st.fromTo(parts.text, { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power3.out' }, i - 0.24);
    }

    if (i < N - 1) {
      // leave: bottle lifts away, floats scatter, text fades up
      st.to(parts.bottle, { y: -170, rotation: -7, opacity: 0, duration: 0.4, ease: 'power2.in' }, i + 0.58);
      st.to(parts.floats, { scale: 0.5, opacity: 0, duration: 0.28, stagger: 0.03 }, i + 0.6);
      st.to(parts.text, { y: -26, opacity: 0, duration: 0.28, stagger: 0.03 }, i + 0.62);
      st.to(slide, { opacity: 0, duration: 0.24, onComplete: () => gsap.set(slide, { visibility: 'hidden' }),
        onReverseComplete: () => gsap.set(slide, { visibility: 'visible' }) }, i + 0.72);
      st.to(watermark, { opacity: 0, y: -40, duration: 0.24 }, i + 0.6);
    }
  });
  // hold the last slide for a beat before the pin releases
  st.to({}, { duration: 0.35 }, N - 0.35);

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
