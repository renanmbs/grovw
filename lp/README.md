# /lp — Paid traffic landing pages

Four standalone landing pages for the Meta and Google campaigns described in
`../marketing/growth-plan.html`. Each one serves a single offer and has a single CTA.

They deliberately **do not** load the main site's CSS or JS. Ad landing pages are judged on
load speed and on not offering exit paths, so these carry their own small stylesheet, no
navigation, and no links off-page except the phone number.

```
lp/
├── home-value.html     Seller valuation      → source: lp-home-value
├── sb240.html          SB 240 $20K program   → source: lp-sb240
├── own-in-ogden.html   Own in Ogden tiers    → source: lp-own-in-ogden
├── rent-vs-own.html    Rent-vs-own estimator → source: lp-rent-vs-own
└── assets/
    ├── lp.css          Brand tokens copied from ../assets/css/styles.css
    └── lp.js           Form POST + the estimator
```

## Preview locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/lp/sb240.html`.

## Where the leads go

Every form POSTs to the **same Apps Script endpoint the main site uses**
(`apps-script/Code.gs`), so leads land in the existing Google Sheet with no new plumbing.

Each page sets `data-source` on its `<form>`, which fills the sheet's existing **Source**
column — that is your campaign attribution. Filter the sheet by Source to get cost-per-lead
per landing page without any extra tooling.

Extra page-specific inputs (property address, employer, city, calculator inputs) ride along
inside the **Message** column via `data-extra`, so the sheet's column layout is unchanged.

If you rotate the Apps Script deployment URL, update it in **two** places:
`assets/js/app.js` and `lp/assets/lp.js`.

## Verified

Checked in-browser at 1280px and 375px:

- No horizontal overflow at either width
- Inputs render at 16px, which stops iOS from zooming when a field is focused — a common,
  silent killer of mobile form completion
- Three visible fields per form, per the growth plan
- Equal Housing Opportunity mark and fair housing statement on every page
- Estimator math verified against an independent calculation

## Before you send traffic

1. **Reconfirm every dollar figure.** `sb240.html` and `own-in-ogden.html` name specific
   amounts and price caps. Programs exhaust funds mid-year. Confirm with a participating
   lender, and pull or edit the page the day a program closes — a stale amount in a live ad
   is a false-advertising exposure.
2. **Install the Meta Pixel and Google tag** in the `<head>` of each page. Nothing is
   installed yet; these pages currently have no tracking of any kind.
3. **Set up conversion events** on form submit so Meta and Google can optimize toward leads
   rather than clicks.
4. **Test one live submission per page** and confirm the row appears in the sheet with the
   right Source value.
5. **Be ready to respond in five minutes.** At a $20–45 cost per lead, response time beats
   every other optimization available to you.

## Compliance notes baked in

These pages are written for Meta's Housing Special Ad Category and Google's housing
restriction. The copy describes **the property and the program, never the person** — no age,
family status, or "perfect for young families" framing anywhere. Keep it that way when
editing.

`rent-vs-own.html` deliberately avoids the industry-standard "your rent already covers a
mortgage" hook, because at current Utah prices and rates **that claim is false** — see the
verified note in the growth plan. It leads with the down payment as the real obstacle
instead, which is both true and a better setup for the assistance programs.

The estimator is labeled throughout as an estimate, not a quote, and the footer states that
GROWV is not a lender. Leave those disclaimers in place.
