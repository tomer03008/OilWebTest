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
  // mobile address-bar show/hide fires resize events mid-pin; refreshing
  // during that re-measures the pinned stage at a bogus size (width 0).
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (lenis) lenis.on('scroll', ScrollTrigger.update);

  /* --- hero entrance + slow drift out --- */
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .fromTo('.hero__media img', { scale: 1.12 }, { scale: 1.05, duration: 2.2, ease: 'power2.out' }, 0)
    .to('.hero__kicker .line__inner', { y: 0, duration: 0.8 }, 0.25)
    .to('.hero__title .line__inner', { y: 0, duration: 0.95, stagger: 0.12 }, 0.4)
    .to('.hero__lede .line__inner', { y: 0, duration: 0.85, stagger: 0.1 }, 0.75)
    .fromTo('.hero__ctas', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.8 }, 1.05)
    .to('.hero__rule', { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 1.1);

  // Parallax layers on scroll trigger
  gsap.to('.hero__media', {
    yPercent: 12, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__content', {
    yPercent: -8, opacity: 0.3, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '50% 35%', end: 'bottom top', scrub: true }
  });

  /* ============ THE SHOWCASE — ZestySip-style stage ============ */
  const showcase = document.querySelector('.showcase');
  const bgEl = document.querySelector('.showcase__bg');
  const revealEl = document.querySelector('.showcase__reveal');
  const slides = gsap.utils.toArray('.slide');
  const dots = gsap.utils.toArray('.showcase__progress .dot');
  const N = slides.length;

  // idle drift: every float breathes, sways and slowly rotates forever.
  // uses yPercent/xPercent/rotation — the scroll timeline owns x/y/scale/opacity,
  // so the two never fight over the same property.
  document.querySelectorAll('.float').forEach((el, i) => {
    gsap.to(el, {
      yPercent: gsap.utils.random(-10, -17),
      duration: gsap.utils.random(2.2, 3.6),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: i * 0.25
    });
    gsap.to(el, {
      xPercent: gsap.utils.random(-7, 7),
      duration: gsap.utils.random(3.4, 5.6),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: gsap.utils.random(0, 1.5)
    });
    gsap.to(el, {
      rotation: gsap.utils.random(-7, 7),
      duration: gsap.utils.random(3, 5),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: gsap.utils.random(0, 2)
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

  // phones get a much shorter pin distance — a thumb-flick covers far fewer
  // pixels than a mouse wheel, so the same 2800px feels endless on touch
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const pinDistance = isTouch ? 2200 : 2800;

  const st = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: '.showcase',
      start: 'top top',
      end: `+=${pinDistance}`,
      pin: true,
      scrub: isTouch ? 0.7 : 0.4,
      invalidateOnRefresh: true,
      // stop mid-transition? snap carries the animation to the nearest
      // settled slide instead of freezing halfway
      snap: {
        snapTo: 'labelsDirectional',
        duration: { min: 0.3, max: 0.9 },
        delay: 0.05,
        ease: 'power2.out'
      },
      onUpdate: (self) => setDots(Math.min(N - 1, Math.floor(self.progress * N)))
    }
  });

  // settled resting points for the snap — one per slide, plus the release
  st.addLabel('rest0', 0.2);
  st.addLabel('rest1', 1.2);
  st.addLabel('rest2', 2.2);
  st.addLabel('release', 3);

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

  /* ============ SITE-WIDE MICRO-INTERACTIONS ============ */
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // thin gold progress line — how deep into the page you are
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progressBar);
  gsap.to(progressBar, {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
  });

  // nav slips away on the way down, returns on the way up
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 420 && y > lastScrollY + 6) nav.classList.add('nav--hidden');
    else if (y < lastScrollY - 6 || y <= 420) nav.classList.remove('nav--hidden');
    lastScrollY = y;
  }, { passive: true });

  // scrollspy: the section you're in keeps its nav link underlined
  ['oils', 'pairings', 'seasons', 'story', 'visit'].forEach(id => {
    const link = document.querySelector(`.nav__links a[href="#${id}"]`);
    if (!link || !document.getElementById(id)) return;
    ScrollTrigger.create({
      trigger: '#' + id,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: self => link.classList.toggle('is-current', self.isActive)
    });
  });

  // buttons: click ripple + press scale + magnetic pull toward the cursor
  document.querySelectorAll('.btn, .nav__order').forEach(btn => {
    btn.classList.add('has-ripple');

    btn.addEventListener('pointerdown', (e) => {
      const r = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const d = Math.max(r.width, r.height) * 2.2;
      ripple.style.width = ripple.style.height = d + 'px';
      ripple.style.left = (e.clientX - r.left) + 'px';
      ripple.style.top = (e.clientY - r.top) + 'px';
      btn.appendChild(ripple);
      gsap.to(ripple, { scale: 1, opacity: 0, duration: 0.65, ease: 'power2.out', onComplete: () => ripple.remove() });
      gsap.to(btn, { scale: 0.95, duration: 0.12, ease: 'power2.out' });
    });
    const release = () => gsap.to(btn, { scale: 1, duration: 0.3, ease: 'back.out(2.5)' });
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);

    if (finePointer) {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, {
          x: (e.clientX - r.left - r.width / 2) * 0.22,
          y: (e.clientY - r.top - r.height / 2) * 0.3,
          duration: 0.4, ease: 'power2.out'
        });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.5)' });
      });
    }
  });

  // the facts count up from zero when they enter the view
  document.querySelectorAll('.story__facts strong').forEach(el => {
    const m = el.textContent.trim().match(/^([\d.,]+)(.*)$/);
    if (!m) return;
    const hasComma = m[1].includes(',');
    const target = parseFloat(m[1].replace(/,/g, ''));
    const decimals = (m[1].split('.')[1] || '').length;
    const suffix = m[2];
    const counter = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(counter, {
        v: target, duration: 1.8, ease: 'power2.out',
        onUpdate: () => {
          let s = counter.v.toFixed(decimals);
          if (hasComma) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals });
          el.textContent = s + suffix;
        }
      })
    });
  });

  // season panels slide up into the stage one after the other
  gsap.utils.toArray('.season-panel').forEach((panel, i) => {
    gsap.from(panel, {
      y: 70, opacity: 0, duration: 0.85, delay: i * 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.seasons__panels', start: 'top 84%' }
    });
  });

  // visit card tilts in 3D under the cursor
  const visitCard = document.querySelector('.visit__card');
  if (visitCard && finePointer) {
    gsap.set(visitCard, { transformPerspective: 800 });
    visitCard.addEventListener('mousemove', (e) => {
      const r = visitCard.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(visitCard, { rotationY: nx * 7, rotationX: -ny * 6, duration: 0.5, ease: 'power2.out' });
    });
    visitCard.addEventListener('mouseleave', () => {
      gsap.to(visitCard, { rotationY: 0, rotationX: 0, duration: 0.7, ease: 'elastic.out(1, 0.55)' });
    });
  }

  // hero photo leans gently away from the cursor
  const heroImg = document.querySelector('.hero__media img');
  if (heroImg && finePointer) {
    // (the intro tween already settles the image at scale 1.05 — overscan
    // headroom so this drift never exposes the photo's edges)
    const hx = gsap.quickTo(heroImg, 'x', { duration: 0.8, ease: 'power2.out' });
    const hy = gsap.quickTo(heroImg, 'y', { duration: 0.8, ease: 'power2.out' });
    document.querySelector('.hero').addEventListener('mousemove', (e) => {
      hx((e.clientX / window.innerWidth - 0.5) * -18);
      hy((e.clientY / window.innerHeight - 0.5) * -10);
    });
  }

  /* ============ STORY & GENERAL GENERAL RISE ============ */
  gsap.utils.toArray('.st-rise').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });

  /* ============ PAIRINGS ============ */
  gsap.fromTo('.pairings__card',
    { opacity: 0, y: 50 },
    {
      opacity: 1,
      y: 0,
      duration: 1.1,
      stagger: 0.16,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.pairings__grid',
        start: 'top 86%'
      }
    }
  );

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

/* ============ SEASONS — expanding panels ============ */
(() => {
  const panels = [...document.querySelectorAll('.season-panel')];
  if (!panels.length) return;

  let active = 0;
  let autoplayOn = true;

  const setActive = (i) => {
    if (i === active) return;
    active = i;
    panels.forEach((p, pi) => {
      p.classList.toggle('is-active', pi === i);
      p.setAttribute('aria-selected', pi === i ? 'true' : 'false');
    });
  };

  panels.forEach((p, i) => {
    // hover opens on desktop, click/tap everywhere; any manual touch stops autoplay
    p.addEventListener('mouseenter', () => {
      if (window.matchMedia('(pointer: fine)').matches) { autoplayOn = false; setActive(i); }
    });
    p.addEventListener('click', () => { autoplayOn = false; setActive(i); });
    p.addEventListener('focus', () => setActive(i));
  });

  // gentle autoplay while the section is on screen (motion allowed only)
  if (motionOn && 'IntersectionObserver' in window) {
    let timer = null;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && autoplayOn) {
        timer = setInterval(() => {
          if (!autoplayOn) { clearInterval(timer); return; }
          setActive((active + 1) % panels.length);
        }, 3800);
      } else {
        clearInterval(timer);
      }
    }, { threshold: 0.45 });
    io.observe(document.querySelector('.seasons__panels'));
  }
})();

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
