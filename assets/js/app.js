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

  /* =====================================================
     CONTACT FORM ENDPOINT — PASTE YOUR APPS SCRIPT URL
     After deploying the Google Apps Script as a Web App,
     replace the value below with the deployment URL
     (it looks like: https://script.google.com/macros/s/AKfy.../exec).
     Until this is filled in, the form falls back to mailto.
     ===================================================== */
  const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbykbcAN9feeY_O1rbPiibOs3bK-0WHDpKurE9pGkOU_-mStIWCE5d70cbF-YwWwBY4hyw/exec';

  // The registration gate posts to this same endpoint. Exposed rather than
  // duplicated so there is only ever one URL to change.
  window.GROWV_FORM_ENDPOINT = FORM_ENDPOINT;

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
      url: 'https://jonathanperez.site/',
      instagram: 'https://www.instagram.com/just_jonathanperez',
      reviews: 'https://g.page/r/CWuFuCoU51YeEAE/review'
    },
    {
      name: 'Stefanie Godinez',
      role: 'Real Estate Agent',
      // bio: add a short bio here — the card renders fine without one.
      photo: 'assets/images/stefanie-godinez.jpg',
      photoSm: 'assets/images/stefanie-godinez-sm.jpg',
      phone: '801-920-1762',
      email: 'godinezstefanie@gmail.com',
      ure: 'https://www.utahrealestate.com'
    },
    {
      name: 'Wilian Guevara',
      role: 'Real Estate Agent',
      // bio: add a short bio here — the card renders fine without one.
      photo: 'assets/images/wilian-guevara.jpg',
      photoSm: 'assets/images/wilian-guevara-sm.jpg',
      phone: '801-347-1054',
      ure: 'https://www.utahrealestate.com'
    },
    {
      name: 'Veronica Toro',
      role: 'Real Estate Agent',
      // bio: add a short bio here — the card renders fine without one.
      photo: 'assets/images/veronica-toro.jpg',
      photoSm: 'assets/images/veronica-toro-sm.jpg',
      phone: '801-941-1591',
      email: 'vtoro4@gmail.com',
      ure: 'https://www.utahrealestate.com'
    },
    // ---- Placeholder roles temporarily hidden until real agents join. ----
    // To restore: uncomment the objects below (or any subset), then refresh.
    // {
    //   name: 'Joining the Team',
    //   role: 'Associate Broker',
    //   bio: 'A new addition to the GROWV bench. Profile and listings forthcoming.',
    //   placeholder: 'AB',
    //   url: '#contact'
    // },
    // {
    //   name: 'Joining the Team',
    //   role: 'Buyer Specialist',
    //   bio: 'A new addition to the GROWV bench. Profile and listings forthcoming.',
    //   placeholder: 'BS',
    //   url: '#contact'
    // },
    // {
    //   name: 'Joining the Team',
    //   role: 'Listing Specialist',
    //   bio: 'A new addition to the GROWV bench. Profile and listings forthcoming.',
    //   placeholder: 'LS',
    //   url: '#contact'
    // },
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
  // Small brand icon links beside an agent's role. Any agent can have
  // either; today only Jonathan does. Drawn in each platform's own colours
  // so they are recognised at a glance rather than read.
  //
  // The Instagram gradient needs an id, and ids must be unique in a
  // document — if a second agent ever gets an Instagram link, two <svg>s
  // with the same gradient id would make the second one render wrong. So
  // the id is suffixed with the agent's index.
  const socialIcon = {
    instagram: (i) => `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="ig-${i}" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#FFD521"/>
            <stop offset="25%"  stop-color="#F50000"/>
            <stop offset="60%"  stop-color="#B900B4"/>
            <stop offset="100%" stop-color="#4F5BD5"/>
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="6.4" fill="url(#ig-${i})"/>
        <rect x="5.1" y="5.1" width="13.8" height="13.8" rx="4.3"
              fill="none" stroke="#fff" stroke-width="1.7"/>
        <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" stroke-width="1.7"/>
        <circle cx="16.9" cy="7.2" r="1.15" fill="#fff"/>
      </svg>`,

    // Google's own four-colour G, on white so it reads against the dark card.
    reviews: () => `
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>`
  };

  const SOCIAL_LABEL = {
    instagram: 'on Instagram',
    reviews: '\u2014 leave a Google review'
  };

  const socialLinks = (a, i) => Object.keys(socialIcon)
    .filter((k) => a[k])
    .map((k) => `<a class="agent__social agent__social--${k}" href="${escapeHTML(a[k])}"
         target="_blank" rel="noopener noreferrer"
         aria-label="${escapeHTML(a.name)} ${escapeHTML(SOCIAL_LABEL[k])} (opens in a new tab)">
         ${socialIcon[k](i)}
       </a>`).join('');

  const renderTeam = () => {
    const grid = $('#teamGrid');
    if (!grid) return;

    grid.innerHTML = AGENTS.map((a, i) => {
      const hasContact = !!(a.phone || a.email);
      const url = a.url || '#contact';
      const isExternal = /^https?:\/\//i.test(url) && !url.startsWith(window.location.origin);
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      const externalIndicator = isExternal
        ? ' <span class="sr-only">(opens in a new tab)</span>'
        : '';
      const delay = i * 80;

      const photo = a.photo || placeholderSVG(a.placeholder || '··');
      const altText = a.photo
        ? `Portrait of ${a.name}, ${a.role} at GROWV.`
        : `Placeholder portrait card for a future ${a.role} at GROWV.`;
      // An agent without their own site links to the contact form, so the label
      // has to promise the form rather than a profile page.
      const hasProfile = a.photo && !url.startsWith('#');
      const linkLabel = hasContact
        ? `Show contact details for ${a.name}, ${a.role}`
        : hasProfile
          ? `View ${a.name}'s profile, ${a.role}`
          : a.photo
            ? `Contact GROWV about ${a.name}, ${a.role}`
            : `Contact GROWV about the ${a.role} role`;
      const cardLabel = hasContact ? 'Contact' : hasProfile ? 'View profile' : 'Get in touch';

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
            <p class="agent__role">
              ${escapeHTML(a.role)}
              ${socialLinks(a, i)}
            </p>
            <h3 class="agent__name">${escapeHTML(a.name)}</h3>
            ${a.bio ? `<p class="agent__bio">${escapeHTML(a.bio)}</p>` : ''}
            <span class="agent__link" aria-hidden="true">${escapeHTML(cardLabel)}</span>
          </div>
          ${hasContact
            ? `<button type="button" class="agent__cover" data-agent="${i}"
                 aria-haspopup="dialog" aria-label="${escapeHTML(linkLabel)}">
                 ${escapeHTML(linkLabel)}
               </button>`
            : `<a class="agent__cover"
                 href="${escapeHTML(url)}"${target}
                 aria-label="${escapeHTML(linkLabel)}">
                 ${escapeHTML(linkLabel)}${externalIndicator}
               </a>`}
        </li>
      `;
    }).join('');

    // Newly-injected reveal nodes need to be observed.
    observeReveals(grid.querySelectorAll('.reveal'));
    wireAgentDialog(grid);
  };

  /* ---------- Agent contact dialog ---------- */
  const telHref = (phone) => 'tel:+1' + String(phone).replace(/\D/g, '');

  const wireAgentDialog = (grid) => {
    const dlg = $('#agentDialog');
    if (!dlg || typeof dlg.showModal !== 'function') return;

    const fill = (a) => {
      const photo = $('#agentDialogPhoto');
      photo.src = a.photoSm || a.photo || '';
      photo.alt = `Portrait of ${a.name}, ${a.role} at GROWV.`;
      $('#agentDialogRole').textContent = a.role;
      $('#agentDialogName').textContent = a.name;

      const rows = [];
      if (a.phone) {
        rows.push(`<li><span class="agent-dialog__label">Phone</span>
          <a href="${escapeHTML(telHref(a.phone))}">${escapeHTML(a.phone)}</a></li>`);
      }
      if (a.email) {
        rows.push(`<li><span class="agent-dialog__label">Email</span>
          <a href="mailto:${escapeHTML(a.email)}">${escapeHTML(a.email)}</a></li>`);
      }
      $('#agentDialogContact').innerHTML = rows.join('');

      // Primary actions: place the call, or go to the listing site. Both are
      // real links (not buttons) so they can be opened in a new tab, copied,
      // or long-pressed on a phone the way people expect.
      const actions = [];
      if (a.phone) {
        actions.push(`<a class="cta cta--gold cta--block" href="${escapeHTML(telHref(a.phone))}">
          Call ${escapeHTML(a.phone)}</a>`);
      }
      if (a.ure) {
        actions.push(`<a class="cta cta--ghost cta--block" href="${escapeHTML(a.ure)}"
          target="_blank" rel="noopener noreferrer">UtahRealEstate.com<span class="sr-only"> (opens in a new tab)</span></a>`);
      }
      $('#agentDialogActions').innerHTML = actions.join('');
    };

    grid.querySelectorAll('.agent__cover[data-agent]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const a = AGENTS[Number(btn.dataset.agent)];
        if (!a) return;
        fill(a);
        dlg.showModal();
      });
    });

    if (!dlg.dataset.wired) {
      dlg.dataset.wired = '1';
      // Clicking the backdrop (outside the panel) closes it.
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
      dlg.querySelectorAll('[data-agent-dialog-close]').forEach((el) => {
        el.addEventListener('click', () => dlg.close());
      });
    }
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

  /* ---------- Contact form ---------- */
  const initContactForm = () => {
    const form = $('#contactForm');
    if (!form) return;
    const status = $('#contactStatus');
    const button = $('#contactSubmit');
    const buttonLabel = button.querySelector('span');
    const originalLabel = buttonLabel.textContent;

    const setStatus = (state, msg) => {
      status.hidden = !msg;
      status.dataset.state = state;
      status.textContent = msg || '';
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Bot check — honeypot must stay empty
      if (form.elements['company_website'].value) return;

      // Native HTML5 validation
      if (!form.checkValidity()) {
        setStatus('error', 'Please complete the highlighted fields and try again.');
        form.reportValidity();
        return;
      }

      const data = {
        name: form.elements['name'].value.trim(),
        email: form.elements['email'].value.trim(),
        phone: form.elements['phone'].value.trim(),
        message: form.elements['message'].value.trim(),
        source: 'mygrowv.com',
        submitted_at: new Date().toISOString()
      };

      // Fallback to mailto if the Apps Script URL hasn't been set yet
      if (!FORM_ENDPOINT) {
        const body = `Name: ${data.name}%0D%0AEmail: ${data.email}%0D%0APhone: ${data.phone}%0D%0A%0D%0A${encodeURIComponent(data.message)}`;
        window.location.href = `mailto:jonathan@mygrowv.com?subject=Inquiry%20from%20${encodeURIComponent(data.name)}&body=${body}`;
        return;
      }

      button.disabled = true;
      buttonLabel.textContent = 'Sending…';
      setStatus('', '');

      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          // Apps Script Web Apps require either text/plain or
          // form-encoded bodies; JSON triggers a CORS preflight Apps
          // Script can't handle, so we send a stringified payload as text.
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Bad response ' + res.status);

        // Apps Script answers HTTP 200 even when the script itself threw —
        // the real verdict is in the body ({ok:true} / {ok:false, error}).
        // Trusting the status alone meant a failed send looked like a sent
        // one: the visitor saw "thank you", and nobody was ever emailed.
        // An unreadable body is left as success rather than inventing a
        // failure, but an explicit ok:false is now treated as one.
        let verdict = null;
        try { verdict = await res.clone().json(); } catch (_) { /* opaque — let it pass */ }
        if (verdict && verdict.ok === false) {
          throw new Error('Script error: ' + (verdict.error || 'unknown'));
        }

        // Share what they told us with the registration gate, so someone who
        // used the contact form first never retypes their details.
        try {
          window.localStorage.setItem('growv_known_contact', JSON.stringify({
            name: data.name, email: data.email, phone: data.phone,
          }));
        } catch (_) {}

        // Hand off to the confirmation page. The redirect is what makes the
        // conversion measurable: Google Ads watches for a visit to
        // /thank-you, and an AJAX form that never changes URL gives it
        // nothing to watch. The page also fires generate_lead, so a lead is
        // only counted once the send actually succeeded.
        form.reset();
        setStatus('success', 'Thank you — taking you to your confirmation…');
        window.location.assign('/thank-you.html');
        return;
      } catch (err) {
        setStatus('error', 'Something went wrong. Please email jonathan@mygrowv.com directly.');
      } finally {
        button.disabled = false;
        buttonLabel.textContent = originalLabel;
      }
    });
  };

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initMobileNav();
    initSmoothScroll();
    initYear();
    renderTeam();
    initContactForm();
    observeReveals(document.querySelectorAll('.reveal'));
  });
})();
