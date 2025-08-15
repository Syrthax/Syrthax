// Set footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Respect reduced motion
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveal on scroll
(() => {
	const els = [...document.querySelectorAll('[data-reveal]')];
	if (!els.length || reduceMotion) {
		els.forEach(el => el.classList.add('revealed'));
		return;
	}
	const io = new IntersectionObserver((entries) => {
		for (const e of entries) {
			if (e.isIntersecting) {
				e.target.classList.add('revealed');
				io.unobserve(e.target);
			}
		}
	}, {threshold: 0.15, rootMargin: '0px 0px -40px 0px'});
	els.forEach(el => io.observe(el));
})();

// Lightweight tilt interaction
(() => {
	if (reduceMotion) return;
	const cards = document.querySelectorAll('[data-tilt]');
	const max = 10; // deg
	for (const c of cards) {
		c.addEventListener('mousemove', (e) => {
			const r = c.getBoundingClientRect();
			const px = (e.clientX - r.left) / r.width;
			const py = (e.clientY - r.top) / r.height;
			const rx = (py - 0.5) * -2 * max;
			const ry = (px - 0.5) * 2 * max;
			c.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
		});
		c.addEventListener('mouseleave', () => {
			c.style.transform = '';
		});
	}
})();

// Smooth scroll for internal links (fallback if browser behavior differs)
document.addEventListener('click', (e) => {
	const a = e.target.closest('a[href^="#"]');
	if (!a) return;
	const id = a.getAttribute('href');
	const target = document.querySelector(id);
	if (target) {
		e.preventDefault();
		target.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth'});
	}
});
// ...existing code...

// Auto light/dark is handled via CSS prefers-color-scheme and meta theme-color above.

/* Rubber-band stretch on overscroll (wheel + touch), reduced-motion aware */
(() => {
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduce) return;

  const page = document.getElementById('page');
  const rootScroll = document.scrollingElement || document.documentElement;

  let stretch = 0;          // current stretch amount (0..MAX)
  const MAX = 0.045;        // 4.5% max stretch
  const DECAY = 0.82;       // release damping
  const WHEEL_K = 0.00085;  // stretch per wheel deltaY px
  const TOUCH_K = 0.0022;   // stretch per touch drag px
  let rafId = 0;
  let touching = false;
  let startY = 0;

  const atTop = () => rootScroll.scrollTop <= 0;
  const atBottom = () =>
    Math.ceil(rootScroll.scrollTop + window.innerHeight) >= rootScroll.scrollHeight;

  const apply = () => {
    page.style.setProperty('--stretch-y', String(1 + stretch));
    page.classList.add('is-stretching');
  };

  const clearStretch = () => {
    page.style.removeProperty('--stretch-y');
    page.classList.remove('is-stretching');
  };

  const release = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function animate() {
      stretch *= DECAY;
      if (stretch <= 0.001) {
        stretch = 0;
        clearStretch();
        return;
      }
      apply();
      rafId = requestAnimationFrame(animate);
    });
  };

  // Wheel (mouse/trackpad)
  window.addEventListener('wheel', (e) => {
    const dy = e.deltaY;

    if ((dy < 0 && atTop()) || (dy > 0 && atBottom())) {
      e.preventDefault(); // stop browser edge glow/black bars
      page.style.setProperty('--stretch-origin', dy < 0 ? '0%' : '100%');
      stretch = Math.min(MAX, stretch + Math.abs(dy) * WHEEL_K);
      apply();
      cancelAnimationFrame(rafId); // hold while interacting
    } else if (stretch > 0) {
      release();
    }
  }, { passive: false });

  // Touch (mobile)
  window.addEventListener('touchstart', (e) => {
    touching = true;
    startY = e.touches[0].clientY;
    cancelAnimationFrame(rafId);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!touching) return;
    const y = e.touches[0].clientY;
    const dy = startY - y; // positive when dragging up

    if ((dy < 0 && atTop()) || (dy > 0 && atBottom())) {
      e.preventDefault();
      page.style.setProperty('--stretch-origin', dy < 0 ? '0%' : '100%');
      stretch = Math.min(MAX, Math.abs(dy) * TOUCH_K);
      apply();
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    touching = false;
    if (stretch > 0) release();
  }, { passive: true });

  // Safety: if user scrolls back into range while stretched, release
  window.addEventListener('scroll', () => {
    if (stretch > 0 && !atTop() && !atBottom()) release();
  }, { passive: true });
})();

// Keep your existing JS below/above as needed
// ...existing code...
// ...existing code...

// Ensure #nav-spacer height equals the header height + top offset
(function () {
  const nav = document.querySelector('.nav');
  const spacer = document.getElementById('nav-spacer');
  if (!nav || !spacer) return;

  function sizeNavSpace() {
    const cs = getComputedStyle(nav);
    const top = parseFloat(cs.top) || 0;
    spacer.style.height = (nav.offsetHeight + top) + 'px';
  }

  // run on load/resize and after fonts are ready
  window.addEventListener('load', sizeNavSpace, { once: true });
  window.addEventListener('resize', sizeNavSpace);
  document.fonts && document.fonts.ready && document.fonts.ready.then(sizeNavSpace);
})();

// Intro typing animation (respects reduced motion)
(function () {
  const intro = document.getElementById('intro');
  if (!intro) return;

  const full = intro.getAttribute('data-text') || intro.textContent.trim();
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduce) {
    intro.textContent = full;
    return;
  }

  let i = 0;
  const speed = 28; // ms per char — tweak if you want faster/slower

  function tick() {
    i++;
    intro.textContent = full.slice(0, i);
    if (i < full.length) {
      setTimeout(tick, speed);
    } else {
      // remove caret once finished
      intro.classList.remove('typing');
    }
  }

  // start shortly after load so layout/reveal doesn't clash
  window.addEventListener('load', () => {
    setTimeout(tick, 420);
  }, { once: true });
})();