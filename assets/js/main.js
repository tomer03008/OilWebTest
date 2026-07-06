// כרם אדר — progressive enhancement only.
// Without JS the page is fully visible and usable; this file adds
// the scroll-reveal and the nav border, nothing the content depends on.

document.documentElement.classList.add('js');

// nav border once the page is scrolled past the hero kicker
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// reveal on enter; stagger siblings that arrive in the same batch
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const targets = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  targets.forEach(el => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver(entries => {
    const entering = entries.filter(e => e.isIntersecting);
    entering.forEach((entry, i) => {
      entry.target.style.setProperty('--stagger', `${Math.min(i * 90, 360)}ms`);
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => io.observe(el));
}
