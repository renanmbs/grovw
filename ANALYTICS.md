# Analytics — how to turn it on and how to read it

Everything lives in one file: `assets/js/analytics.js`. The tracking code is
installed and the events are already wired to your real buttons. It is **not
sending anything yet** — it needs your two IDs.

---

## Step 1 — get your GA4 ID (15 minutes, free)

1. Go to **analytics.google.com** → *Start measuring*.
2. Account name: `GROWV`. Property name: `mygrowv.com`. Time zone: Mountain.
3. Platform: **Web**. URL: `mygrowv.com`. Stream name: `GROWV site`.
4. Copy the **Measurement ID** at the top right — it looks like `G-ABC1234XYZ`.

## Step 2 — get your Meta Pixel ID (optional, only if you run FB/IG ads)

1. **business.facebook.com** → *Events Manager* → *Connect data sources* → *Web*.
2. Name it `GROWV Pixel`. Copy the **Pixel ID** — a 15-16 digit number.

> ⚠️ Housing ads on Meta run under the **Special Ad Category**. Age, gender and
> detailed targeting are restricted, and a pixel does not change that. Plan
> targeting accordingly.

## Step 3 — paste them in

Open `assets/js/analytics.js`. The top of the file:

```js
const CONFIG = {
  GA4_ID: 'G-ABC1234XYZ',        // ← paste here
  META_PIXEL_ID: '123456789012345', // ← paste here (or leave '')
  DEBUG: true,                   // ← set to false once you've verified
};
```

Leave either blank and that tool simply never loads. Nothing breaks.

## Step 4 — verify it works before trusting it

With `DEBUG: true`, open the site, press **F12** → **Console**. Click your own
phone number. You should see:

```
[analytics] contact_call {phone: +18019403551, location: page}
```

If you see that line, the wiring works. Then check GA4 → **Reports → Realtime**
and watch your own visit appear. Once both agree, set `DEBUG: false`.

---

## What is being tracked

These fire automatically — no extra work:

| Event | When it fires | Why you care |
|---|---|---|
| `contact_call` | Any phone number tapped | **Your #1 metric.** Includes *where* they tapped: `spanish_badge`, `agent_card`, `footer` |
| `generate_lead` | `/thank-you.html` loads | **Your actual conversion.** Fires on the confirmation page, not on submit, so a failed send never counts. Also sent to Meta as `Lead` |
| `form_submit` | Contact form submitted | The *attempt*. A gap between this and `generate_lead` means the form is erroring |
| `contact_email` | An email address clicked | Lower intent than a call, still a lead |
| `select_listing` | A property card clicked | Tells you **which homes** draw interest — address, city, active/sold |
| `spanish_cta` | The ¿Español? badge clicked | Proves whether the bilingual angle pays |
| `view_agent` | An agent card opened | Who on the team attracts attention |
| `outbound_listings` | Click out to jonathanperez.site | How many you hand off |
| `view_section` | A section is 50% on screen | Do people reach the listings at all? |
| `scroll_depth` | 25 / 50 / 75 / 100% | Where people give up |

---

## How to actually read it (the 10-minute weekly habit)

**Reports → Realtime** — only for checking the install works. Ignore otherwise.

**Reports → Engagement → Events** — your weekly number. One question:
*how many `contact_call` + `generate_lead` events last week?* That is your lead
count. Everything else is context.

**Reports → Acquisition → Traffic acquisition** — where people came from.
`Direct` means they typed the address or used a QR/yard sign. `Organic Social`
is your posts. If you run ads, `Paid Social` / `Paid Search` appear here. This
is how you learn which marketing works.

**Explore → Free form** (worth learning once) — put `select_listing` in rows
and `address` as a dimension, and you get a ranked list of which of your
properties people open. That directly tells you which listing photos and price
points pull.

### The three numbers that matter for a brokerage

1. **Calls per week** — `contact_call`. If it's zero, nothing else matters yet.
2. **Which source produces calls** — Traffic acquisition, compared week to week.
3. **Where people drop** — if `scroll_depth 25` is high but `view_section →
   properties` is low, the top of your page isn't earning the scroll.

### Set these up once in GA4

**Admin → Events → Mark as key event**: mark `contact_call` and `generate_lead`
as key events. GA4 then reports them as conversions and you can see conversion
rate per traffic source, which is the whole point.

---

## Worth knowing

- **This sets cookies.** GA4 and the Meta pixel both do. There's no consent
  banner on the site. That's normal practice for a US small business, but if
  you ever market to EU visitors you'd need one.
- **Don't count your own visits.** Either set `DEBUG: true` and avoid clicking
  around on the live site, or add an IP filter in GA4 →
  Admin → Data filters.
- **Numbers take 24-48h** to settle in the standard reports. Realtime is
  immediate; everything else lags. Don't panic on day one.
- **A call tracked here is a click, not a conversation.** Someone tapping your
  number isn't necessarily someone who spoke to you. Treat it as intent, and
  compare it against your own call log.

---

## The confirmation page (`/thank-you.html`)

The contact form used to submit over AJAX and never change the URL. That is
invisible to Google Ads, which tracks conversions by watching for a visit to a
particular page. So a successful submit now redirects to `/thank-you.html`.

**The URL to give Google Ads:**

```
https://mygrowv.com/thank-you
```

Set the rule to **URL contains** `/thank-you` rather than an exact match —
Netlify serves the page at both `/thank-you` and `/thank-you.html`, and
"contains" matches either.

Two things about that page are load-bearing, so don't undo them:

- **It is `noindex`.** If Google indexed it, organic visitors landing on it
  would be counted as booked consultations and your conversion data would be
  fiction.
- **It is not linked from anywhere.** Same reason. The only way to reach it is
  to actually submit the form.

To test it yourself, submit the form once — you'll land on the page and
`generate_lead` will fire. Note that this also creates a real row in your Apps
Script sheet, so delete that test row afterward.
