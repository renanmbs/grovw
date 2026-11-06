/* =========================================================
   GROWV — analytics
   ---------------------------------------------------------
   Two jobs:
     1. Load GA4 and (optionally) the Meta pixel.
     2. Fire named events on the things that actually matter on
        this site — calls, emails, form submits, listing clicks,
        the Spanish badge, agent cards.

   PASTE YOUR IDS BELOW. Until an ID is filled in, that tool
   simply does not load — no broken requests, no console noise,
   nothing sent anywhere. The event wiring still runs, so you
   can watch events in the browser console with DEBUG = true.
   ========================================================= */

const CONFIG = {
  // Google Analytics 4 — looks like 'G-XXXXXXXXXX'
  // Admin → Data streams → your web stream → Measurement ID
  GA4_ID: 'G-P6HFKQYNF0',

  // Meta (Facebook/Instagram) pixel — a 15-16 digit number
  // Events Manager → Data sources → your pixel → Pixel ID
  META_PIXEL_ID: '',

  // true  -> log every event to the browser console instead of
  //          relying on the dashboards. Leave on while testing.
  DEBUG: true,
};

(() => {
  'use strict';

  /* ---------- loaders ---------- */
  const loadGA4 = (id) => {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    // The whole site is one page, so send_page_view on load is correct.
    window.gtag('config', id, { send_page_view: true });
  };

  const loadMeta = (id) => {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  };

  if (CONFIG.GA4_ID) loadGA4(CONFIG.GA4_ID);
  if (CONFIG.META_PIXEL_ID) loadMeta(CONFIG.META_PIXEL_ID);

  /* ---------- one place to send an event ---------- */
  // metaName maps our event to the standard Meta event, where one fits —
  // 'Lead' and 'Contact' are the two that matter for a brokerage.
  const track = (name, params = {}, metaName = null) => {
    if (CONFIG.DEBUG) console.log('[analytics]', name, params);
    if (window.gtag) window.gtag('event', name, params);
    if (window.fbq && metaName) window.fbq('track', metaName, params);
  };
  window.growvTrack = track;   // available for manual calls

  /* ---------- wiring ---------- */
  const on = (sel, ev, fn) => document.querySelectorAll(sel)
    .forEach((el) => el.addEventListener(ev, () => fn(el)));

  // For anything app.js renders. This file is deferred ahead of app.js, so
  // both DOMContentLoaded handlers are queued in load order and ours runs
  // FIRST — before renderTeam() has put the team cards in the DOM. A direct
  // querySelectorAll binding therefore matches nothing and the events never
  // fire. Delegating from the document avoids depending on that ordering.
  const onLive = (sel, ev, fn) => document.addEventListener(ev, (e) => {
    const el = e.target.closest?.(sel);
    if (el) fn(el);
  });

  document.addEventListener('DOMContentLoaded', () => {
    // Phone taps — the highest-intent action on a real estate site.
    on('a[href^="tel:"]', 'click', (el) => track('contact_call', {
      phone: el.getAttribute('href').replace('tel:', ''),
      location: el.closest('.agent-dialog') ? 'agent_card'
              : el.closest('.es-badge') ? 'spanish_badge'
              : el.closest('.site-footer') ? 'footer' : 'page',
    }, 'Contact'));

    on('a[href^="mailto:"]', 'click', (el) => track('contact_email', {
      email_to: el.getAttribute('href').replace('mailto:', ''),
    }, 'Contact'));

    // The bilingual badge, so you can see whether it earns its place.
    on('.es-badge', 'click', () => track('spanish_cta', { label: 'Claro que Si' }));

    // Listing cards — which properties people actually open.
    on('.property__media', 'click', (el) => {
      const card = el.closest('.property');
      track('select_listing', {
        address: card?.querySelector('.property__title')?.textContent.trim(),
        city: card?.querySelector('.property__loc')?.textContent.trim(),
        status: card?.querySelector('.property__sold') ? 'sold' : 'active',
      }, 'ViewContent');
    });

    // Outbound to a listings site — the hero button, the agent cards.
    // Matched by host rather than one hard-coded domain so swapping where
    // "View Properties" points doesn't silently stop the event firing.
    on('a[href*="utahrealestate.com"], a[href*="jonathanperez.site"]', 'click', (el) => {
      let destination = 'unknown';
      try { destination = new URL(el.href).hostname.replace(/^www\./, ''); } catch (_) {}
      track('outbound_listings', { destination });
    });

    // Social and review links on the agent cards — rendered by app.js.
    onLive('.agent__social', 'click', (el) => {
      const name = el.closest('.agent')?.querySelector('.agent__name')?.textContent.trim();
      const href = el.getAttribute('href') || '';
      const network = href.indexOf('instagram.com') !== -1 ? 'instagram'
                    : href.indexOf('g.page') !== -1 ? 'google_reviews' : 'other';
      track('outbound_social', { network, agent: name });
    });

    // Agent cards opening the contact dialog — also rendered by app.js.
    onLive('.agent__cover[data-agent]', 'click', (el) => {
      const name = el.closest('.agent')?.querySelector('.agent__name')?.textContent.trim();
      track('view_agent', { agent: name });
    });

    // Contact form — this is the ATTEMPT, not the conversion. The send can
    // still fail, so the lead itself is counted on /thank-you.html, which is
    // only reachable after a successful submit. Keeping the two separate
    // means generate_lead stays clean and the gap between form_submit and
    // generate_lead tells you the form is erroring.
    const form = document.querySelector('form[data-contact], #contactForm, .contact form');
    if (form) {
      form.addEventListener('submit', () => track('form_submit', { form: 'contact' }));
    }

    // Scroll depth — tells you whether anyone reaches the listings at all.
    const seen = new Set();
    const marks = [25, 50, 75, 100];
    window.addEventListener('scroll', () => {
      const d = document.documentElement;
      const pct = Math.round(((window.scrollY + window.innerHeight) / d.scrollHeight) * 100);
      for (const m of marks) {
        if (pct >= m && !seen.has(m)) { seen.add(m); track('scroll_depth', { percent: m }); }
      }
    }, { passive: true });

    // Which section people actually look at.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !seen.has('s:' + e.target.id)) {
            seen.add('s:' + e.target.id);
            track('view_section', { section: e.target.id });
          }
        }
      }, { threshold: 0.5 });
      document.querySelectorAll('main > section[id]').forEach((s) => io.observe(s));
    }
  });
})();
