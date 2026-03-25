/**
 * Klini Saúde — Main JavaScript
 * Handles: header scroll, mobile menu, scroll reveal, plans carousel
 */

(function () {
  'use strict';

  // ── Header scroll effect ──────────────────────────────────
  const header = document.getElementById('header');

  function handleHeaderScroll() {
    if (window.scrollY > 20) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  // ── Mobile drawer ─────────────────────────────────────────
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const mobileClose = document.getElementById('mobileClose');

  function openDrawer() {
    mobileDrawer.classList.add('open');
    mobileOverlay.classList.add('visible');
    mobileToggle.classList.add('active');
    mobileToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    mobileDrawer.classList.remove('open');
    mobileOverlay.classList.remove('visible');
    mobileToggle.classList.remove('active');
    mobileToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  mobileToggle.addEventListener('click', function () {
    if (mobileDrawer.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  mobileClose.addEventListener('click', closeDrawer);
  mobileOverlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileDrawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  mobileDrawer.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      setTimeout(closeDrawer, 150);
    });
  });

  // ── Plans carousel ────────────────────────────────────────
  var carousel = document.getElementById('plansCarousel');
  var prevBtn = document.getElementById('plansPrev');
  var nextBtn = document.getElementById('plansNext');
  var dotsContainer = document.getElementById('plansDots');

  if (carousel && prevBtn && nextBtn && dotsContainer) {
    var slides = carousel.querySelectorAll('.plan-slide');
    var currentIndex = 0;
    var slidesVisible = 2;
    var totalPages = 1;

    function calcSlidesVisible() {
      var w = window.innerWidth;
      if (w <= 480) return 1;
      if (w <= 768) return 1;
      return 2;
    }

    function buildDots() {
      slidesVisible = calcSlidesVisible();
      totalPages = Math.max(1, slides.length - slidesVisible + 1);
      if (currentIndex >= totalPages) currentIndex = totalPages - 1;

      dotsContainer.innerHTML = '';
      for (var i = 0; i < totalPages; i++) {
        var dot = document.createElement('button');
        dot.className = 'plans__dot' + (i === currentIndex ? ' plans__dot--active' : '');
        dot.setAttribute('aria-label', 'Ir para página ' + (i + 1));
        dot.dataset.index = i;
        dot.addEventListener('click', function () {
          goTo(parseInt(this.dataset.index));
        });
        dotsContainer.appendChild(dot);
      }
    }

    function updateCarousel() {
      if (!slides.length) return;
      var slide = slides[0];
      var gap = 24;
      var slideWidth = slide.offsetWidth + gap;
      var offset = currentIndex * slideWidth;
      carousel.style.transform = 'translateX(-' + offset + 'px)';

      // Update dots
      var dots = dotsContainer.querySelectorAll('.plans__dot');
      dots.forEach(function (d, i) {
        d.classList.toggle('plans__dot--active', i === currentIndex);
      });
    }

    function goTo(index) {
      currentIndex = Math.max(0, Math.min(index, totalPages - 1));
      updateCarousel();
    }

    prevBtn.addEventListener('click', function () {
      goTo(currentIndex - 1);
    });

    nextBtn.addEventListener('click', function () {
      goTo(currentIndex + 1);
    });

    // Touch/drag support
    var startX = 0;
    var isDragging = false;

    carousel.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });

    carousel.addEventListener('touchend', function (e) {
      if (!isDragging) return;
      isDragging = false;
      var diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goTo(currentIndex + 1);
        else goTo(currentIndex - 1);
      }
    }, { passive: true });

    // Mouse drag
    carousel.addEventListener('mousedown', function (e) {
      startX = e.clientX;
      isDragging = true;
      carousel.classList.add('grabbing');
      e.preventDefault();
    });

    document.addEventListener('mouseup', function () {
      if (!isDragging) return;
      carousel.classList.remove('grabbing');
      isDragging = false;
    });

    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var diff = startX - e.clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goTo(currentIndex + 1);
        else goTo(currentIndex - 1);
        isDragging = false;
        carousel.classList.remove('grabbing');
      }
    });

    // Prevent click navigation while dragging
    carousel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (carousel.classList.contains('grabbing')) {
          e.preventDefault();
        }
      });
    });

    // Init
    buildDots();
    updateCarousel();

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildDots();
        updateCarousel();
      }, 150);
    });
  }

  // ── Scroll reveal animations ──────────────────────────────
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    function handleReveal() {
      var windowHeight = window.innerHeight;
      revealElements.forEach(function (el) {
        var top = el.getBoundingClientRect().top;
        if (top < windowHeight - 80) {
          el.classList.add('visible');
        }
      });
    }
    window.addEventListener('scroll', handleReveal, { passive: true });
    handleReveal();
  }

  // ── Dropdown hover with reliable close delay ──────────────
  var navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(function (item) {
    var trigger = item.querySelector('.nav-item__trigger');
    var dropdown = item.querySelector('.nav-item__dropdown');
    var closeTimer;

    if (!trigger || !dropdown) return;

    function openMenu() {
      clearTimeout(closeTimer);
      item.classList.add('nav-item--open');
      trigger.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      closeTimer = setTimeout(function () {
        item.classList.remove('nav-item--open');
        trigger.setAttribute('aria-expanded', 'false');
      }, 300);
    }

    item.addEventListener('mouseenter', openMenu);
    item.addEventListener('mouseleave', closeMenu);

    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var isOpen = item.classList.contains('nav-item--open');
        if (isOpen) {
          item.classList.remove('nav-item--open');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          openMenu();
          var firstLink = dropdown.querySelector('a');
          if (firstLink) firstLink.focus();
        }
      }
    });

    dropdown.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        item.classList.remove('nav-item--open');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      }
    });
  });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;
  
        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          var headerHeight = header.offsetHeight;
          var targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
  
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  
    // ── FAQ Accordion ─────────────────────────────────────────
    var faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(function(item) {
      var question = item.querySelector('.faq-question');
      if (question) {
        question.addEventListener('click', function() {
          var isOpen = item.classList.contains('is-open');
          // Close all
          faqItems.forEach(function(fi) {
            fi.classList.remove('is-open');
            fi.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          });
          // Toggle current
          if (!isOpen) {
            item.classList.add('is-open');
            question.setAttribute('aria-expanded', 'true');
          }
        });
      }
    });
  
  })();
