/* ============================================================
   KLINI SAÚDE — Portal da Transparência JS
   ============================================================ */

(function () {
  'use strict';

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Year tabs ---- */
  var tabs   = document.querySelectorAll('.tp-year-tab');
  var panels = document.querySelectorAll('.tp-fin-panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var year = tab.getAttribute('data-year');

      /* Update tab active state */
      tabs.forEach(function (t) {
        t.classList.remove('tp-year-tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('tp-year-tab--active');
      tab.setAttribute('aria-selected', 'true');

      /* Show matching panel */
      panels.forEach(function (panel) {
        if (panel.id === 'tp-fin-' + year) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      });
    });
  });

}());
