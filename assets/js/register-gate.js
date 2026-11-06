/* =========================================================
   GROWV — registration gate
   ---------------------------------------------------------
   Opens on two triggers: DELAY_SECONDS of ACTIVE time on the site,
   or a click on anything marked data-gate-listings. A modal asks
   for name, email and phone before the visitor can carry on.
   The details go to the same Apps Script endpoint the contact
   form uses, so they land in the lead sheet and email
   jonathan@mygrowv.com — tagged source "registration-gate" so
   you can tell them apart from real enquiries.

   Deliberate behaviour, so none of it looks like a bug later:
     - Time is counted only while the tab is VISIBLE. A tab left
       open in the background does not trip it.
     - Dismissing it restarts the clock, so it comes back after
       RETURN_AFTER_SECONDS rather than going away.
     - Anyone who already registered, or already sent the
       contact form, never sees it again.
     - It never runs on /thank-you.html — they have just
       converted; gating them there would be absurd.
   ========================================================= */

const GATE = {
  // Turn the whole thing off without touching the HTML.
  ENABLED: true,

  // Active seconds of browsing before the gate first appears.
  DELAY_SECONDS: 45,

  // Seconds the gate must be on screen before the X appears. Until then
  // there is no way out — not the X, not Escape. Set to 0 to show the X
  // immediately; raise it to hold people longer.
  EXIT_AFTER_SECONDS: 8,

  // Seconds of browsing between a dismissal and the gate coming back.
  // Separate from DELAY_SECONDS so the first ask can land sooner than the
  // repeats do — being asked again should feel less frequent, not equal.
  RETURN_AFTER_SECONDS: 60,

  // Remembered for this many days once someone registers.
  REMEMBER_DAYS: 180,
};

(() => {
  'use strict';

  if (!GATE.ENABLED) return;

  const KEY_DONE  = 'growv_registered';
  const KEY_TIME  = 'growv_active_seconds';

  // The confirmation page is the one place this must never fire.
  if (/thank-you/.test(location.pathname)) return;

  /* ---------- storage, defensively ---------- */
  // Private windows and blocked site data make these throw. A gate that
  // crashes the page is far worse than a gate that doesn't show.
  const get = (k) => { try { return window.localStorage.getItem(k); } catch (_) { return null; } };
  const set = (k, v) => { try { window.localStorage.setItem(k, v); } catch (_) {} };

  const alreadyRegistered = () => {
    const raw = get(KEY_DONE);
    if (!raw) return false;
    const until = parseInt(raw, 10);
    return Number.isFinite(until) && Date.now() < until;
  };

  if (alreadyRegistered()) return;

  document.addEventListener('DOMContentLoaded', () => {
    const dlg = document.getElementById('registerGate');
    if (!dlg || typeof dlg.showModal !== 'function') return;

    const form   = dlg.querySelector('#gateForm');
    const status = dlg.querySelector('#gateStatus');
    const button = dlg.querySelector('#gateSubmit');
    const label  = button.querySelector('span');
    const originalLabel = label.textContent;

    /* ---------- the clock ---------- */
    // The gate is persistent rather than final: it opens after
    // DELAY_SECONDS of browsing, refuses to close for EXIT_AFTER_SECONDS,
    // then offers an X. Closing it restarts the clock, and every
    // appearance after the first waits RETURN_AFTER_SECONDS instead.
    let onScreen = 0;     // seconds the gate has been visible this time
    let shown = 0;        // how many times it has opened this page load

    let seconds = parseInt(get(KEY_TIME) || '0', 10);
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;

    const closeBtn = dlg.querySelector('#gateClose');

    setInterval(() => {
      if (document.visibilityState !== 'visible') return;   // background tabs don't count

      if (dlg.open) {
        onScreen += 1;
        if (GATE.EXIT_AFTER_SECONDS >= 0
            && onScreen >= GATE.EXIT_AFTER_SECONDS && closeBtn.hidden) {
          closeBtn.hidden = false;
        }
        return;   // time spent looking at a modal is not browsing time
      }

      seconds += 1;
      set(KEY_TIME, String(seconds));
      const threshold = shown === 0 ? GATE.DELAY_SECONDS : GATE.RETURN_AFTER_SECONDS;
      if (seconds >= threshold) open();
    }, 1000);

    function open() {
      if (dlg.open || alreadyRegistered()) return;
      onScreen = 0;
      shown += 1;
      // Measure from the last appearance, not from the first ever visit,
      // so dismissing it genuinely buys a full quiet stretch.
      seconds = 0;
      set(KEY_TIME, '0');
      closeBtn.hidden = true;

      prefill();
      dlg.showModal();
      document.documentElement.classList.add('gate-open');
      document.body.classList.add('gate-open');
      if (window.growvTrack) window.growvTrack('view_gate', { shown: shown });
    }

    function close() {
      dlg.close();
      document.documentElement.classList.remove('gate-open');
      document.body.classList.remove('gate-open');
    }

    // Closable only once the X is showing.
    const escapable = () => !closeBtn.hidden;

    // Keeping a modal <dialog> shut is surprisingly hard. Three layers,
    // because the first two are not reliable on their own:
    //   1. closedby="none" — the modern, declarative way (set in the HTML).
    //   2. preventDefault on 'cancel' — the older way. Chrome still closes
    //      the dialog on Escape in some builds despite it.
    //   3. re-open on 'close' — the backstop that actually holds.
    dlg.addEventListener('cancel', (e) => {
      if (!escapable()) e.preventDefault();
    });

    dlg.addEventListener('close', () => {
      if (alreadyRegistered() || escapable()) return;
      requestAnimationFrame(() => {
        if (!dlg.open) {
          dlg.showModal();
          document.documentElement.classList.add('gate-open');
          document.body.classList.add('gate-open');
        }
      });
    });

    closeBtn.addEventListener('click', () => {
      if (!escapable()) return;
      // Closing means they chose not to register, so the listings trip is
      // off; they stay where they are rather than being sent anyway.
      pendingHref = null;
      if (window.growvTrack) window.growvTrack('gate_dismissed', { shown: shown });
      close();
    });

    /* ---------- language ---------- */
    // Copy lives in data-en / data-es on the elements themselves, so the
    // two languages cannot drift apart in separate files. A pipe in a
    // title splits the second half into the gold italic line.
    const setLang = (lang) => {
      const attr = 'data-' + lang;
      dlg.querySelectorAll('[' + attr + ']').forEach((el) => {
        const text = el.getAttribute(attr);
        if (text == null) return;
        if (el === dlg.querySelector('#gateTitle')) {
          const [a, b] = text.split('|');
          el.innerHTML = decode(a) + (b ? '<br><em>' + decode(b) + '</em>' : '');
        } else if (el.classList.contains('gate__fine')) {
          // Keep the phone number a live link in both languages.
          el.innerHTML = decode(text).replace(
            /\(801\)\s*888-8817/,
            '<a href="tel:+18018888817">(801)&nbsp;888-8817</a>'
          );
        } else {
          el.innerHTML = decode(text);
        }
      });
      dlg.querySelectorAll('[data-ph-' + lang + ']').forEach((el) => {
        el.setAttribute('placeholder', decode(el.getAttribute('data-ph-' + lang)));
      });
      // The X has no text, so its label is the only thing a screen reader
      // gets — it has to switch languages with everything else.
      dlg.querySelectorAll('[data-al-' + lang + ']').forEach((el) => {
        el.setAttribute('aria-label', decode(el.getAttribute('data-al-' + lang)));
      });
      dlg.querySelectorAll('.gate__langbtn').forEach((b) => {
        const on = b.dataset.lang === lang;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      dlg.setAttribute('lang', lang);
      current = lang;
    };

    // Entities live in the attributes; this turns them back into characters.
    const decoder = document.createElement('textarea');
    function decode(str) { decoder.innerHTML = str; return decoder.value; }

    let current = 'en';
    dlg.querySelectorAll('.gate__langbtn').forEach((b) => {
      b.addEventListener('click', () => {
        setLang(b.dataset.lang);
        if (window.growvTrack) window.growvTrack('gate_language', { lang: b.dataset.lang });
      });
    });

    // English is always the default, including for a Spanish-set browser.
    // The maroon pulsing Español button is how a Spanish speaker switches.

    /* ---------- prefill ---------- */
    // Three ways to know who this is before they type, best first. None of
    // them can discover a stranger's identity — there is no browser API for
    // that — but between them most returning and emailed visitors arrive
    // with the fields already filled.
    //
    //   1. autocomplete="name|email|tel" on the inputs. The browser's own
    //      autofill does the work, from the contact card the person already
    //      saved. Nothing to code; it is why those attributes are there.
    //   2. Anything they typed here before, on this device.
    //   3. ?name=&email=&phone= on the link, so a campaign email to the
    //      existing database arrives pre-filled.
    const KEY_WHO = 'growv_known_contact';

    const readKnown = () => {
      try { return JSON.parse(get(KEY_WHO) || '{}'); } catch (_) { return {}; }
    };

    const remember = () => {
      const who = { name: val('name'), email: val('email'), phone: val('phone') };
      if (!who.name && !who.email && !who.phone) return;
      set(KEY_WHO, JSON.stringify(who));
    };

    function prefill() {
      const known = readKnown();
      const params = new URLSearchParams(location.search);
      let fromUrl = false;

      ['name', 'email', 'phone'].forEach((k) => {
        const field = form.elements[k];
        if (!field || field.value) return;
        // A link parameter is more current than anything cached locally.
        const v = (params.get(k) || known[k] || '').trim();
        if (!v) return;
        field.value = v;
        if (params.get(k)) fromUrl = true;
      });

      // Take the details back out of the address bar once they are in the
      // form: a URL carrying someone's email gets copied, pasted, shared and
      // sent along in referrer headers. Reading it once is useful; leaving it
      // on screen is not.
      if (fromUrl) {
        ['name', 'email', 'phone'].forEach((k) => params.delete(k));
        const q = params.toString();
        history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
      }

      if (val('name') || val('email')) {
        if (window.growvTrack) window.growvTrack('gate_prefilled', { from: fromUrl ? 'link' : 'device' });
      }
    }

    // Keep what they type, so a second visit starts further along.
    ['name', 'email', 'phone'].forEach((k) => {
      const field = form.elements[k];
      if (field) field.addEventListener('change', remember);
    });

    /* ---------- the listings link ---------- */
    // Clicking "View Properties" is the strongest signal of intent on the
    // page, so it asks before handing them to the portal rather than
    // waiting out the clock. Registered visitors never reach this — the
    // whole script returns early for them, so the link behaves normally.
    let pendingHref = null;

    document.addEventListener('click', (e) => {
      const link = e.target.closest?.('[data-gate-listings]');
      if (!link || dlg.open) return;
      e.preventDefault();
      pendingHref = link.href;
      open();
      if (window.growvTrack) window.growvTrack('gate_from_listings_click', {});
    });

    /* ---------- payload ---------- */
    // The criteria fold into `message` rather than becoming new fields: the
    // Apps Script writes a fixed column set and renders `message` in the
    // notification email, so this reaches the inbox with no backend change.
    const val = (n) => (form.elements[n] ? form.elements[n].value.trim() : '');
    const optLabel = (n) => {
      const sel = form.elements[n];
      if (!sel || !sel.value) return '';
      return sel.options[sel.selectedIndex].textContent.trim();
    };

    function buildPayload(source) {
      const criteria = [
        ['Looking to', optLabel('intent')],
        ['Area',       val('area')],
        ['Size',       optLabel('size')],
        ['Budget',     optLabel('budget')],
      ].filter(([, v]) => v).map(([k, v]) => k + ': ' + v);

      const partial = source.indexOf('partial') !== -1;

      const message = [
        partial
          ? 'INCOMPLETE — this person started the registration form and left '
            + 'without finishing it. They have NOT agreed to be contacted; '
            + 'treat it as a warm lead, not a request for a call.'
          : 'Registered via the website gate after ' + Math.round(seconds / 60)
            + ' minute(s) of browsing.',
        'Form language: ' + current.toUpperCase() + '.',
        criteria.length ? '\nWHAT THEY ARE LOOKING FOR\n' + criteria.join('\n')
                        : '\n(No search criteria given.)',
      ].filter(Boolean).join('\n');

      return {
        name:  val('name'),
        email: val('email'),
        phone: val('phone'),
        message: message,
        source: source,
        submitted_at: new Date().toISOString(),
      };
    }

    /* ---------- partial capture ---------- */
    // Most people who open a gate never finish it. If they typed a name or
    // an email before giving up, that is still worth having — so it is sent
    // when the page is being unloaded, which is the last moment we can.
    //
    // sendBeacon is the only reliable transport here: a normal fetch is
    // killed mid-flight when the tab closes. It is fire-and-forget, so there
    // is no response to check.
    //
    // These arrive tagged "registration-gate-partial" and say plainly in the
    // body that the person did not complete the form, because they did not
    // consent to being contacted the way a completed registration does.
    let sent = false;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function sendPartial() {
      if (sent || alreadyRegistered()) return;
      const name = val('name');
      const email = val('email');
      const phone = val('phone');

      // Worth sending only if there is a real way to reach them.
      if (!EMAIL_RE.test(email) && phone.replace(/\D/g, '').length < 10) return;
      if (!name && !email) return;

      const endpoint = window.GROWV_FORM_ENDPOINT;
      if (!endpoint || !navigator.sendBeacon) return;

      try {
        const blob = new Blob([JSON.stringify(buildPayload('registration-gate-partial'))],
                              { type: 'text/plain;charset=utf-8' });
        sent = navigator.sendBeacon(endpoint, blob);
      } catch (_) { /* nothing more we can do at unload */ }
    }

    // pagehide covers tab close, navigation and the bfcache on iOS, where
    // unload never fires. visibilitychange catches backgrounding on mobile,
    // which is often the real end of the visit.
    window.addEventListener('pagehide', sendPartial);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sendPartial();
    });

    /* ---------- submit ---------- */
    const setStatus = (state, msg) => {
      status.dataset.state = state;
      status.textContent = msg || '';
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (form.elements['company_website'].value) return;      // honeypot

      if (!form.checkValidity()) {
        setStatus('error', current === 'es'
          ? 'Por favor complete nombre, correo y teléfono.'
          : 'Please complete name, email and phone.');
        form.reportValidity();
        return;
      }

      const data = buildPayload('registration-gate');

      const endpoint = window.GROWV_FORM_ENDPOINT;
      if (!endpoint) {
        setStatus('error', current === 'es'
          ? 'No se pudo registrar. Llame al (801) 888-8817.'
          : 'Unable to register right now. Please call (801) 888-8817.');
        return;
      }

      button.disabled = true;
      label.textContent = current === 'es' ? 'Registrando…' : 'Registering…';
      setStatus('', '');

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Bad response ' + res.status);

        // Apps Script answers 200 even when the script threw, so the body
        // is the real verdict — same reasoning as the contact form.
        let verdict = null;
        try { verdict = await res.clone().json(); } catch (_) {}
        if (verdict && verdict.ok === false) throw new Error(verdict.error || 'unknown');

        sent = true;   // don't also fire a partial on the way out
        remember();
        set(KEY_DONE, String(Date.now() + GATE.REMEMBER_DAYS * 864e5));
        if (window.growvTrack) {
          window.growvTrack('generate_lead', { form: 'registration-gate', value: 1 }, 'Lead');
        }
        if (pendingHref) {
          // They were on their way to the listings. Send them, in this tab:
          // a window.open() here is no longer inside the click gesture, so
          // popup blockers would eat it.
          setStatus('success', current === 'es'
            ? 'Gracias — abriendo las propiedades…'
            : 'Thank you — opening properties…');
          const href = pendingHref;
          pendingHref = null;
          setTimeout(() => { window.location.href = href; }, 900);
          return;
        }
        setStatus('success', current === 'es'
          ? 'Gracias — ya está registrado.'
          : 'Thank you — you’re all set.');
        setTimeout(close, 700);
      } catch (err) {
        setStatus('error', current === 'es'
          ? 'Algo salió mal. Llame al (801) 888-8817 o escriba a jonathan@mygrowv.com.'
          : 'Something went wrong. Please call (801) 888-8817 or email jonathan@mygrowv.com.');
        button.disabled = false;
        label.textContent = originalLabel;
      }
    });
  });
})();
