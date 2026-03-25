/* ==========================================================================
   TOKEN DIGITAL v2 — Scroll Animations + FAQ
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // -------------------------------------------------------------------------
  // INTERSECTION OBSERVER — Scroll entrance animations
  // -------------------------------------------------------------------------
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.12
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe slide-up elements
  document.querySelectorAll('.slide-up').forEach(el => observer.observe(el));

  // Observe timeline enter elements with staggered delay per item
  document.querySelectorAll('.tk2-timeline__item').forEach((item, itemIndex) => {
    const enterEls = item.querySelectorAll('.tk2-enter--left, .tk2-enter--right');

    // Use a separate observer per timeline item to stagger left/right entries
    const itemObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Left enters first, right enters 120ms later
          const el = entry.target;
          const delay = el.classList.contains('tk2-enter--right') ? 120 : 0;
          setTimeout(() => {
            el.classList.add('is-visible');
          }, delay);
          itemObserver.unobserve(el);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1
    });

    enterEls.forEach(el => itemObserver.observe(el));
  });

  // -------------------------------------------------------------------------
  // FAQ ACCORDION — toggle icon and open/close
  // -------------------------------------------------------------------------
  document.querySelectorAll('.tk2-faq .faq-item').forEach(item => {
    const summary = item.querySelector('.faq-item__question');
    const icon = item.querySelector('.faq-item__icon');
    if (!summary) return;

    // details/summary works natively — we just manage the icon rotation
    item.addEventListener('toggle', () => {
      if (item.open) {
        icon && (icon.style.transform = 'rotate(45deg)');
        // Close other open items
        document.querySelectorAll('.tk2-faq .faq-item[open]').forEach(other => {
          if (other !== item) {
            other.open = false;
            const otherIcon = other.querySelector('.faq-item__icon');
            if (otherIcon) otherIcon.style.transform = '';
          }
        });
      } else {
        icon && (icon.style.transform = '');
      }
    });
  });

  // -------------------------------------------------------------------------
  // HERO TOKEN — animated code display
  // -------------------------------------------------------------------------
  const tokenEl = document.getElementById('heroTokenCode');
  if (tokenEl) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let shuffleInterval;

    function generateToken() {
      return Array.from({ length: 8 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join('');
    }

    function shuffleAnimate(finalToken) {
      let count = 0;
      const maxShuffles = 10;
      clearInterval(shuffleInterval);
      shuffleInterval = setInterval(() => {
        tokenEl.textContent = generateToken();
        count++;
        if (count >= maxShuffles) {
          clearInterval(shuffleInterval);
          tokenEl.textContent = finalToken;
        }
      }, 60);
    }

    // Every 10 seconds simulate a token refresh for demo effect
    setInterval(() => {
      shuffleAnimate(generateToken());
    }, 10000);
  }

});
