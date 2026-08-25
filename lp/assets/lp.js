/* =========================================================
   GROWV — Landing page behavior
   Shared by every /lp/ page. Two jobs:
     1. Post the 3-field lead form to the same Apps Script
        endpoint the main site uses, tagged with a per-page
        `source` so leads are attributable to the campaign.
     2. Run the rent-vs-own estimator (rent-vs-own.html only).
   ========================================================= */
(function () {
  'use strict';

  /* Same deployment the main site posts to (assets/js/app.js).
     The Apps Script sheet already has a Source column — each page
     sets data-source on the <form>, which becomes that column. */
  var FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbykbcAN9feeY_O1rbPiibOs3bK-0WHDpKurE9pGkOU_-mStIWCE5d70cbF-YwWwBY4hyw/exec';
  var FALLBACK_EMAIL = 'jonathan@mygrowv.com';
  var FALLBACK_PHONE = '(801) 888-8817';

  /* ---------- lead form ---------- */
  function initForm() {
    var form = document.querySelector('form[data-lead]');
    if (!form) return;

    var button = form.querySelector('button[type="submit"]');
    var status = form.querySelector('[data-status]');
    var label = button ? button.textContent : '';

    function say(kind, msg) {
      if (!status) return;
      status.className = 'status ' + kind;
      status.textContent = msg;
      status.hidden = false;
    }

    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();

      /* Honeypot — real visitors leave it empty. */
      var trap = form.elements['company_website'];
      if (trap && trap.value) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = {
        name:  (form.elements['name']  || {}).value || '',
        email: (form.elements['email'] || {}).value || '',
        phone: (form.elements['phone'] || {}).value || '',
        message: buildMessage(form),
        source: form.getAttribute('data-source') || 'growv-lp',
        submitted_at: new Date().toISOString()
      };
      Object.keys(data).forEach(function (k) {
        if (typeof data[k] === 'string') data[k] = data[k].trim();
      });

      if (!FORM_ENDPOINT) {
        window.location.href = 'mailto:' + FALLBACK_EMAIL +
          '?subject=' + encodeURIComponent(data.source) +
          '&body=' + encodeURIComponent(
            'Name: ' + data.name + '\nEmail: ' + data.email +
            '\nPhone: ' + data.phone + '\n\n' + data.message);
        return;
      }

      if (button) { button.disabled = true; button.textContent = 'Sending…'; }

      try {
        var res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          /* Apps Script web apps reject a JSON content-type preflight,
             so the payload goes as text/plain — same as the main site. */
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('status ' + res.status);
        form.reset();
        say('ok', form.getAttribute('data-success') ||
          'Got it — Jonathan will reach out shortly.');
      } catch (err) {
        say('err', 'Something went wrong on our end. Call or text ' + FALLBACK_PHONE +
          ', or email ' + FALLBACK_EMAIL + ' — your details were not lost on your side.');
      } finally {
        if (button) { button.disabled = false; button.textContent = label; }
      }
    });
  }

  /* Any extra page-specific inputs (address, timeline, rent) ride along
     in the message body so the sheet's column layout stays unchanged. */
  function buildMessage(form) {
    var parts = [];
    var intro = form.getAttribute('data-intro');
    if (intro) parts.push(intro);
    Array.prototype.forEach.call(form.querySelectorAll('[data-extra]'), function (el) {
      if (el.value) parts.push(el.getAttribute('data-extra') + ': ' + el.value.trim());
    });
    var calc = document.querySelector('[data-calc-summary]');
    if (calc && calc.textContent.trim()) {
      parts.push('Calculator: ' + calc.textContent.trim());
    }
    return parts.join('\n');
  }

  /* ---------- rent vs own estimator ---------- */
  var UT_TAX_RATE = 0.0055;   /* ~0.55% effective UT property tax */
  var INSURANCE_MO = 105;     /* typical UT homeowner premium, monthly */
  var FHA_MIP_RATE = 0.0055;  /* annual MIP when under 20% down */

  function money(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function initCalc() {
    var root = document.querySelector('[data-calc]');
    if (!root) return;

    var els = {
      rent:  root.querySelector('#rent'),
      price: root.querySelector('#price'),
      down:  root.querySelector('#down'),
      rate:  root.querySelector('#rate')
    };
    var out = {
      payment: root.querySelector('[data-out="payment"]'),
      diff:    root.querySelector('[data-out="diff"]'),
      cash:    root.querySelector('[data-out="cash"]'),
      verdict: root.querySelector('[data-out="verdict"]'),
      summary: root.querySelector('[data-calc-summary]')
    };

    function num(el, fallback) {
      var v = parseFloat(String(el && el.value).replace(/[^0-9.]/g, ''));
      return isFinite(v) && v > 0 ? v : fallback;
    }

    function compute() {
      var rent  = num(els.rent, 1600);
      var price = num(els.price, 380000);
      var downPct = num(els.down, 3.5);
      var apr   = num(els.rate, 6.5);

      var down = price * (downPct / 100);
      var principal = price - down;
      var r = (apr / 100) / 12;
      var n = 360;

      var pi = r > 0
        ? principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
        : principal / n;

      var tax = (price * UT_TAX_RATE) / 12;
      var mip = downPct < 20 ? (principal * FHA_MIP_RATE) / 12 : 0;
      var total = pi + tax + INSURANCE_MO + mip;
      var delta = total - rent;

      if (out.payment) out.payment.textContent = money(total);
      if (out.cash)    out.cash.textContent    = money(down);

      if (out.diff) {
        out.diff.textContent = (delta >= 0 ? '+' : '−') + money(Math.abs(delta));
        out.diff.classList.toggle('pos', delta < 0);
      }

      if (out.verdict) {
        out.verdict.innerHTML = delta < 0
          ? 'At these numbers owning would run about <strong>' + money(Math.abs(delta)) +
            ' less per month</strong> than your rent — and part of each payment goes ' +
            'toward a balance you keep. The obstacle is the ' + money(down) +
            ' due at closing, which is precisely what Utah’s assistance programs exist to cover.'
          : 'Owning would cost about <strong>' + money(delta) + ' more per month</strong> ' +
            'than your rent at these numbers. That is the honest gap at today’s rates, and ' +
            'it is why the timing question matters: your rent will keep climbing, while a ' +
            'fixed payment holds. What actually narrows this is a lower price point, a ' +
            'different loan product, or assistance covering the ' + money(down) +
            ' down payment — worth mapping before your next lease renewal.';
      }

      if (out.summary) {
        out.summary.textContent =
          'rent ' + money(rent) + ' · price ' + money(price) + ' · ' +
          downPct + '% down · ' + apr + '% · est. payment ' + money(total);
      }
    }

    Object.keys(els).forEach(function (k) {
      if (els[k]) els[k].addEventListener('input', compute);
    });
    compute();
  }

  /* ---------- year stamp ---------- */
  function initYear() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initForm();
    initCalc();
    initYear();
  });
})();
