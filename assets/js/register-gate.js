/* =========================================================
   GROWV — registration gate
   ---------------------------------------------------------
   After DELAY_SECONDS of ACTIVE time on the site, a modal asks
   for name, email and phone before the visitor can carry on.
   The details go to the same Apps Script endpoint the contact
   form uses, so they land in the lead sheet and email
   jonathan@mygrowv.com — tagged source "registration-gate" so
   you can tell them apart from real enquiries.

   Deliberate behaviour, so none of it looks like a bug later:
     - Time is counted only while the tab is VISIBLE. A tab left
       open in the background does not trip it.
     - The count is cumulative across pages in the visit, so
       someone who browses three sections still hits 2:00.
     - Anyone who already registered, or already sent the
       contact form, never sees it again.
     - It never runs on /thank-you.html — they have just
       converted; gating them there would be absurd.
   ========================================================= */

const GATE = {
  // Turn the whole thing off without touching the HTML.
  ENABLED: true,

  // Active seconds before the gate appears.
  DELAY_SECONDS: 120,

  // false = a true gate: no close button, ESC does nothing.
  // true  = adds a "Continue browsing" link that dismisses it for the visit.
  DISMISSIBLE: false,

  // Remembered for this many days once someone registers.
  REMEMBER_DAYS: 180,
};

(() => {
  'use strict';

  if (!GATE.ENABLED) return;

  const KEY_DONE  = 'growv_registered';
  const KEY_TIME  = 'growv_active_seconds';
  const KEY_SKIP  = 'growv_gate_skipped';

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
  if (sessionStorage.getItem?.(KEY_SKIP)) return;

  document.addEventListener('DOMContentLoaded', () => {
    const dlg = document.getElementById('registerGate');
    if (!dlg || typeof dlg.showModal !== 'function') return;

    const form   = dlg.querySelector('#gateForm');
    const status = dlg.querySelector('#gateStatus');
    const button = dlg.querySelector('#gateSubmit');
    const label  = button.querySelector('span');
    const originalLabel = label.textContent;

    /* ---------- the clock ---------- */
    let seconds = parseInt(get(KEY_TIME) || '0', 10);
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;

    const tick = setInterval(() => {
      if (document.visibilityState !== 'visible') return;   // background tabs don't count
      seconds += 1;
      set(KEY_TIME, String(seconds));
      if (seconds >= GATE.DELAY_SECONDS) open();
    }, 1000);

    function open() {
      clearInterval(tick);
      if (dlg.open || alreadyRegistered()) return;
      dlg.showModal();
      document.documentElement.classList.add('gate-open');
      document.body.classList.add('gate-open');
      if (window.growvTrack) window.growvTrack('view_gate', { after_seconds: seconds });
    }

    function close() {
      dlg.close();
      document.documentElement.classList.remove('gate-open');
      document.body.classList.remove('gate-open');
    }

    // Keeping a modal <dialog> open is surprisingly hard. Three layers,
    // because the first two are not reliable on their own:
    //   1. closedby="none" — the modern, declarative way (set in the HTML).
    //   2. preventDefault on 'cancel' — the older way. Chrome still closes
    //      the dialog on ESC in some builds despite it.
    //   3. re-open on 'close' — the backstop that actually holds. Safe from
    //      looping because every legitimate close marks the visitor done
    //      first, and both checks below then pass.
    dlg.addEventListener('cancel', (e) => {
      if (!GATE.DISMISSIBLE) e.preventDefault();
    });

    dlg.addEventListener('close', () => {
      if (alreadyRegistered()) return;
      if (GATE.DISMISSIBLE && sessionStorage.getItem?.(KEY_SKIP)) return;
      // Re-assert on the next frame; closing and re-opening in the same
      // task is ignored by the dialog element.
      requestAnimationFrame(() => {
        if (!dlg.open) {
          dlg.showModal();
          document.documentElement.classList.add('gate-open');
          document.body.classList.add('gate-open');
        }
      });
    });

    if (GATE.DISMISSIBLE) {
      const later = document.createElement('button');
      later.type = 'button';
      later.className = 'gate__later';
      later.textContent = 'Continue browsing';
      later.addEventListener('click', () => {
        try { sessionStorage.setItem(KEY_SKIP, '1'); } catch (_) {}
        if (window.growvTrack) window.growvTrack('gate_dismissed', { after_seconds: seconds });
        close();
      });
      dlg.querySelector('.gate__inner').appendChild(later);
    }

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
            /\(801\)\s*940-3551/,
            '<a href="tel:+18019403551">(801)&nbsp;940-3551</a>'
          );
        } else {
          el.innerHTML = decode(text);
        }
      });
      dlg.querySelectorAll('[data-ph-' + lang + ']').forEach((el) => {
        el.setAttribute('placeholder', decode(el.getAttribute('data-ph-' + lang)));
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

    // A browser set to Spanish gets the Spanish form without having to ask.
    if (/^es/i.test(navigator.language || '')) setLang('es');

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

      // The search criteria are folded into `message` rather than sent as
      // new fields, because the Apps Script writes a fixed set of columns
      // and renders `message` in the notification email. This way the
      // criteria reach Jonathan's inbox without touching the backend.
      const val = (n) => (form.elements[n] ? form.elements[n].value.trim() : '');
      const label = (n) => {
        const sel = form.elements[n];
        if (!sel || !sel.value) return '';
        return sel.options[sel.selectedIndex].textContent.trim();
      };

      const criteria = [
        ['Looking to', label('intent')],
        ['Area',       val('area')],
        ['Bedrooms',   label('beds')],
        ['Baths',      label('baths')],
        ['Price',      label('budget')],
      ].filter(([, v]) => v).map(([k, v]) => k + ': ' + v);

      const notes = val('notes');

      const message = [
        'Registered via the website gate after ' + Math.round(seconds / 60)
          + ' minute(s) of browsing. Form language: ' + current.toUpperCase() + '.',
        criteria.length ? '\nWHAT THEY ARE LOOKING FOR\n' + criteria.join('\n')
                        : '\n(No search criteria given.)',
        notes ? '\nNOTES\n' + notes : '',
      ].filter(Boolean).join('\n');

      const data = {
        name:  val('name'),
        email: val('email'),
        phone: val('phone'),
        message: message,
        source: 'registration-gate',
        submitted_at: new Date().toISOString(),
      };

      const endpoint = window.GROWV_FORM_ENDPOINT;
      if (!endpoint) {
        setStatus('error', current === 'es'
          ? 'No se pudo registrar. Llame al (801) 940-3551.'
          : 'Unable to register right now. Please call (801) 940-3551.');
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

        set(KEY_DONE, String(Date.now() + GATE.REMEMBER_DAYS * 864e5));
        if (window.growvTrack) {
          window.growvTrack('generate_lead', { form: 'registration-gate', value: 1 }, 'Lead');
        }
        setStatus('success', 'Thank you — you’re all set.');
        setTimeout(close, 700);
      } catch (err) {
        setStatus('error', current === 'es'
          ? 'Algo salió mal. Llame al (801) 940-3551 o escriba a jonathan@mygrowv.com.'
          : 'Something went wrong. Please call (801) 940-3551 or email jonathan@mygrowv.com.');
        button.disabled = false;
        label.textContent = originalLabel;
      }
    });
  });
})();
