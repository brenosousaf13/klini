/* ============================================================
   KLINI SAÚDE — Teleconsulta Page JS
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
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Playlist ---- */
  var frame      = document.getElementById('tcVideoFrame');
  var nowTitle   = document.getElementById('tcNowPlaying');
  var playItems  = document.querySelectorAll('.tc-playlist__item');

  playItems.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var videoId = btn.getAttribute('data-video');
      var title   = btn.querySelector('.tc-playlist__item-title').textContent;

      /* swap active state */
      playItems.forEach(function (b) { b.classList.remove('tc-playlist__item--active'); });
      btn.classList.add('tc-playlist__item--active');

      /* swap iframe src */
      if (frame) frame.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1';
      if (nowTitle) nowTitle.textContent = title;
    });
  });

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    item.addEventListener('toggle', function () {
      /* Close siblings */
      if (item.open) {
        document.querySelectorAll('.faq-item').forEach(function (other) {
          if (other !== item && other.open) other.removeAttribute('open');
        });
      }
    });
  });

}());
