/* =========================================================
   GROWV — interactions
   - Agents rendered from a single data array (easy handoff)
   - Mobile nav toggle (ARIA-correct, focus-trap, ESC to close)
   - Header scroll state
   - IntersectionObserver scroll reveals (respects reduced motion)
   - Smooth in-page nav offset for sticky header
   ========================================================= */

(() => {
  'use strict';

  /* -----------------------------------------------------
     AGENT DATA — EDIT HERE
     Each agent renders a clickable card linking to their
     personal website. Use a square or 4:5 portrait photo.
     ----------------------------------------------------- */
  /*
   * To add a real broker, copy a placeholder object and fill in:
   *   name, role, bio, photo (path or URL), url (their personal website).
   * Photos should be portrait ~4:5 aspect, minimum 900px wide.
   */
  const AGENTS = [
    {
      name: 'Jonathan Perez',
      role: 'Broker · Owner',
      bio: 'A decade across lending, property management, and negotiation. Bilingual EN/ES. Personally accountable on every transaction.',
      photo: 'assets/images/jonathan-headshot.jpg',
      photoSm: 'assets/images/jonathan-headshot-sm.jpg',
      url: 'https://mygrowv.com/?fromCms=1'
    },
    {
      name: 'Joining the Team',
      role: 'Associate Broker',
      bio: 'A new addition to the GROWV bench. Profile and listings forthcoming.',
      placeholder: 'AB',
      url: '#contact'
    },
    {
      name: 'Joining the Team',
      role: 'Buyer Specialist',
      bio: 'A new addition to the GROWV bench. Profile and listings forthcoming.',
      placeholder: 'BS',
      url: '#contact'
    },
    {
      name: 'Joining the Team',
      role: 'Listing Specialist',
      bio: 'A new addition to the GROWV bench. Profile and listings forthcoming.',
      placeholder: 'LS',
      url: '#contact'
    },
  ];

  /* Inline SVG monogram for placeholder agents — luxe gold-on-ink */
  const placeholderSVG = (initials = '··') => {
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500' preserveAspectRatio='xMidYMid slice'>` +
        `<defs>` +
          `<linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
            `<stop offset='0%' stop-color='%231B2C24'/>` +
            `<stop offset='100%' stop-color='%230E1A14'/>` +
          `</linearGradient>` +
        `</defs>` +
        `<rect width='400' height='500' fill='url(%23g)'/>` +
        `<circle cx='200' cy='205' r='62' fill='none' stroke='%23BFA164' stroke-width='1.2' opacity='0.55'/>` +
        `<text x='200' y='225' text-anchor='middle' font-family='Georgia,serif' font-size='52' font-style='italic' fill='%23BFA164' letter-spacing='2'>${initials}</text>` +
        `<text x='200' y='340' text-anchor='middle' font-family='Inter,Helvetica,Arial,sans-serif' font-size='10' fill='%23BFA164' letter-spacing='4'>GROWV</text>` +
        `<text x='200' y='362' text-anchor='middle' font-family='Inter,Helvetica,Arial,sans-serif' font-size='9' fill='%23ffffff' opacity='0.4' letter-spacing='3'>BROKER PROFILE</text>` +
      `</svg>`;
    return `data:image/svg+xml;utf8,${svg}`;
  };

  /* ---------- Helpers ---------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const escapeHTML = (str) =>
    String(str).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  /* ---------- Render team grid ---------- */
  const renderTeam = () => {
    const grid = $('#teamGrid');
    if (!grid) return;

    grid.innerHTML = AGENTS.map((a, i) => {
      const isExternal = /^https?:\/\//i.test(a.url) && !a.url.startsWith(window.location.origin);
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      const externalIndicator = isExternal
        ? ' <span class="sr-only">(opens in a new tab)</span>'
        : '';
      const delay = i * 80;

      const photo = a.photo || placeholderSVG(a.placeholder || '··');
      const altText = a.photo
        ? `Portrait of ${a.name}, ${a.role} at GROWV.`
        : `Placeholder portrait card for a future ${a.role} at GROWV.`;
      const linkLabel = a.photo
        ? `View ${a.name}'s profile, ${a.role}`
        : `Contact GROWV about the ${a.role} role`;
      const cardLabel = a.photo ? 'View profile' : 'Inquire';

      const srcsetAttr = a.photoSm
        ? ` srcset="${escapeHTML(a.photoSm)} 900w, ${escapeHTML(a.photo)} 1600w" sizes="(min-width: 1024px) 360px, (min-width: 600px) 45vw, 90vw"`
        : '';

      return `
        <li class="agent reveal" data-reveal style="--reveal-delay:${delay}ms">
          <div class="agent__media">
            <img src="${escapeHTML(photo)}"${srcsetAttr}
                 alt="${escapeHTML(altText)}"
                 loading="lazy" decoding="async" width="900" height="1125">
          </div>
          <div class="agent__body">
            <p class="agent__role">${escapeHTML(a.role)}</p>
            <h3 class="agent__name">${escapeHTML(a.name)}</h3>
            <p class="agent__bio">${escapeHTML(a.bio)}</p>
            <span class="agent__link" aria-hidden="true">${escapeHTML(cardLabel)}</span>
          </div>
          <a class="agent__cover"
             href="${escapeHTML(a.url)}"${target}
             aria-label="${escapeHTML(linkLabel)}">
            ${escapeHTML(linkLabel)}${externalIndicator}
          </a>
        </li>
      `;
    }).join('');

    // Newly-injected reveal nodes need to be observed.
    observeReveals(grid.querySelectorAll('.reveal'));
  };

  /* ---------- Header scroll state ---------- */
  const initHeader = () => {
    const header = $('#siteHeader');
    if (!header) return;
    let ticking = false;
    const update = () => {
      header.dataset.scrolled = window.scrollY > 20 ? 'true' : 'false';
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  };

  /* ---------- Mobile navigation ---------- */
  const initMobileNav = () => {
    const toggle = $('#navToggle');
    const nav    = $('#mobileNav');
    if (!toggle || !nav) return;

    const focusableSel = 'a[href], button:not([disabled])';
    let lastFocused = null;
    let lockedScrollY = 0;

    // iOS Safari has known issues with `overflow: hidden` on <html> while
    // the page is scrolled — the layout glitches and position:fixed elements
    // get computed against the wrong viewport. Use the body-position-fixed
    // technique instead, which is the iOS-friendly way to lock scroll.
    const lockScroll = () => {
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      const body = document.body;
      body.style.position = 'fixed';
      body.style.top = `-${lockedScrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
    };
    const unlockScroll = () => {
      const body = document.body;
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      window.scrollTo(0, lockedScrollY);
    };

    const open = () => {
      lastFocused = document.activeElement;
      lockScroll();
      // The body-scroll-lock zeros out window.scrollY, so the header's
      // scroll-state detector would flip back to its translucent hero
      // state. Mark <html> as nav-open so CSS can keep the header opaque
      // while the menu is on screen.
      document.documentElement.classList.add('is-nav-open');
      nav.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      // Focus the first link so it picks up the gold "active" color
      // (via the existing :focus-visible rule). The outline ring is
      // suppressed in CSS — the color change is the focus indicator.
      const first = nav.querySelector(focusableSel);
      if (first) first.focus({ preventScroll: true });
    };

    const close = () => {
      nav.hidden = true;
      document.documentElement.classList.remove('is-nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      unlockScroll();
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus({ preventScroll: true });
      } else {
        toggle.focus({ preventScroll: true });
      }
    };

    toggle.addEventListener('click', () => {
      toggle.getAttribute('aria-expanded') === 'true' ? close() : open();
    });

    // ESC to close, focus-trap inside the panel
    document.addEventListener('keydown', (e) => {
      if (nav.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {
        const focusable = Array.from(nav.querySelectorAll(focusableSel))
          .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });

    // Close when a link is tapped
    nav.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (a) close();
    });

    // Close if viewport grows past mobile breakpoint
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => { if (mq.matches && !nav.hidden) close(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
  };

  /* ---------- IntersectionObserver reveals ---------- */
  let revealObserver = null;
  const observeReveals = (nodes) => {
    if (prefersReducedMotion) {
      nodes.forEach(n => n.classList.add('is-visible'));
      return;
    }
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(n => n.classList.add('is-visible'));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const extra = parseInt(el.dataset.revealDelay || '0', 10);
            if (extra) el.style.setProperty('--reveal-delay', `${extra}ms`);
            el.classList.add('is-visible');
            revealObserver.unobserve(el);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    }
    nodes.forEach(n => revealObserver.observe(n));
  };

  /* ---------- Smooth scroll for in-page links (respects sticky header) ---------- */
  const initSmoothScroll = () => {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-h'),
        10
      ) || 80;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH + 1;
      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
      // Move focus for accessibility (skip if it's the hero target)
      if (target.id !== 'top') {
        const prevTab = target.getAttribute('tabindex');
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        if (prevTab === null) {
          // Allow blur to remove the tabindex so the page tab order isn't polluted
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        }
      }
    });
  };

  /* ---------- Year stamp ---------- */
  const initYear = () => {
    const el = $('#year');
    if (el) el.textContent = String(new Date().getFullYear());
  };

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initMobileNav();
    initSmoothScroll();
    initYear();
    renderTeam();
    observeReveals(document.querySelectorAll('.reveal'));
  });
})();
