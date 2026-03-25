/* ============================================================
   KLINI SAÚDE — Sobre Nós Page JS
   Units section tab navigation
   ============================================================ */

(function () {
  'use strict';

  /* ---- Units tabs ---- */
  var tabs   = document.querySelectorAll('.units__tab');
  var panels = document.querySelectorAll('.units__panel');

  if (tabs.length && panels.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = this.getAttribute('data-tab');

        tabs.forEach(function (t) {
          t.classList.remove('units__tab--active');
          t.setAttribute('aria-selected', 'false');
        });

        panels.forEach(function (p) {
          p.classList.remove('units__panel--active');
        });

        this.classList.add('units__tab--active');
        this.setAttribute('aria-selected', 'true');

        var panel = document.getElementById(target);
        if (panel) {
          panel.classList.add('units__panel--active');
        }
      });
    });
  }

  /* ---- Keyboard nav for tabs ---- */
  var tabBar = document.querySelector('.units__tabs-bar');
  if (tabBar) {
    tabBar.addEventListener('keydown', function (e) {
      var active = tabBar.querySelector('.units__tab--active');
      var all    = Array.from(tabBar.querySelectorAll('.units__tab'));
      var idx    = all.indexOf(active);

      if (e.key === 'ArrowRight') {
        var next = all[(idx + 1) % all.length];
        next.focus();
        next.click();
      } else if (e.key === 'ArrowLeft') {
        var prev = all[(idx - 1 + all.length) % all.length];
        prev.focus();
        prev.click();
      }
    });
  }

}());
