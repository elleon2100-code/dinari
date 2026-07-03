/* ============================================================
   DINARI — main.js
   Navbar scroll · Mobile menu · Reveal animations
   ============================================================ */

(function () {
  'use strict';

  // ── NAVBAR SCROLL ──
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── MOBILE MENU ──
  const toggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Cerrar al hacer clic en un enlace
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ── REVEAL ON SCROLL (IntersectionObserver) ──
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: mostrar todo si no hay soporte
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // ── COUNTER ANIMATION (números en hero) ──
  function animateCounter(el, target, duration = 1500, prefix = '', suffix = '') {
    const start = performance.now();
    const isDecimal = String(target).includes('.');

    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = target * eased;
      el.textContent = prefix + (isDecimal
        ? current.toFixed(1)
        : Math.round(current).toLocaleString('es-MX')) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  const statEls = document.querySelectorAll('[data-counter]');
  if (statEls.length > 0 && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            animateCounter(
              el,
              parseFloat(el.dataset.counter),
              1500,
              el.dataset.prefix || '',
              el.dataset.suffix || ''
            );
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
  }

  // ── AJUSTE DINÁMICO DE PADDING PARA PREFIJOS DE MONEDA ──
  function adjustPrefixPaddings() {
    document.querySelectorAll('.field__prefix').forEach(prefix => {
      const input = prefix.nextElementSibling;
      if (input && (input.classList.contains('field__input--prefixed') || input.tagName === 'INPUT')) {
        const text = prefix.textContent.trim();
        const textLength = text.length;
        let paddingLeft = 32; // Valor por defecto
        if (textLength > 1) {
          // Ajustar padding proporcionalmente para evitar solapamientos (ej. RD$, USD$)
          paddingLeft = 20 + textLength * 9.5;
        }
        input.style.paddingLeft = `${paddingLeft}px`;
      }
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        adjustPrefixPaddings();
        setupPrefixObserver();
      });
    } else {
      adjustPrefixPaddings();
      setupPrefixObserver();
    }
  }

  function setupPrefixObserver() {
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        adjustPrefixPaddings();
      });
      // Observar todo el body para capturar inserciones dinámicas de filas de deudas o cambios de texto
      observer.observe(document.body, { 
        childList: true, 
        characterData: true, 
        subtree: true 
      });
    }
  }

})();
