/**
 * Klini Saúde — Plans Page JavaScript
 * Handles: plan filter tabs, form validation, FAQ animations
 */

(function () {
  'use strict';

  // ── Plans explorer tabs ────────────────────────────────────
  var tabs = document.querySelectorAll('.plans-explorer__tab');
  var panels = document.querySelectorAll('.plans-explorer__panel');

  if (tabs.length && panels.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        // Deactivate all
        tabs.forEach(function (t) {
          t.classList.remove('plans-explorer__tab--active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(function (p) {
          p.classList.remove('plans-explorer__panel--active');
          p.hidden = true;
        });

        // Activate clicked
        tab.classList.add('plans-explorer__tab--active');
        tab.setAttribute('aria-selected', 'true');
        var target = document.getElementById(tab.getAttribute('aria-controls'));
        if (target) {
          target.classList.add('plans-explorer__panel--active');
          target.hidden = false;
        }
      });
    });
  }

  // ── Contact form ────────────────────────────────────────────
  var form = document.getElementById('plansForm');

  if (form) {
    // Phone mask
    var phoneInput = document.getElementById('formPhone');
    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        var val = this.value.replace(/\D/g, '');
        if (val.length <= 2) {
          this.value = val.length ? '(' + val : '';
        } else if (val.length <= 7) {
          this.value = '(' + val.substring(0, 2) + ') ' + val.substring(2);
        } else {
          this.value = '(' + val.substring(0, 2) + ') ' + val.substring(2, 7) + '-' + val.substring(7, 11);
        }
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = document.getElementById('formName').value.trim();
      var phone = document.getElementById('formPhone').value.trim();
      var email = document.getElementById('formEmail').value.trim();

      // Basic validation
      var isValid = true;
      var fields = form.querySelectorAll('input[required]');

      fields.forEach(function (field) {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = 'var(--klini-coral-500)';
          isValid = false;
        }
      });

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('formEmail').style.borderColor = 'var(--klini-coral-500)';
        isValid = false;
      }

      if (!isValid) return;

      // Show success state
      var submitBtn = form.querySelector('button[type="submit"]');
      var originalText = submitBtn.textContent;
      submitBtn.textContent = 'Enviado!';
      submitBtn.disabled = true;
      submitBtn.style.background = 'var(--klini-primary-500)';

      setTimeout(function () {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.style.background = '';
        form.reset();
      }, 3000);
    });
  }

  // ── Fade-in animation keyframe (injected once) ──────────────
  if (!document.getElementById('plansAnimations')) {
    var style = document.createElement('style');
    style.id = 'plansAnimations';
    style.textContent = '@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }';
    document.head.appendChild(style);
  }

})();
