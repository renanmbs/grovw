---
name: utah-fthb-ads
description: >
    Run compliant Meta and Google ads for a Utah real estate practice targeting first-time
    home buyers and sellers in Davis, Weber, and Salt Lake counties. Enforces Meta's Housing
    Special Ad Category (HEC) and Google's Housing personalized-advertising restrictions,
    supplies verified Utah down-payment-assistance program angles, and sets realistic CPL
    planning bands. Use for ANY housing, real estate, mortgage, or homebuyer advertising
    task — campaign planning, targeting, ad copy, creative briefs, budget, or diagnostics.
    Loads BEFORE and OVERRIDES generic ads skills (meta-ads-strategy, google-ads-strategy,
    ads, ad-creative), which are written for B2B SaaS/ecommerce and will recommend targeting
    that is prohibited for housing.
version: 1.0.0
---

# Utah First-Time-Buyer Real Estate Ads

## Hard gate — read before any targeting recommendation

Real estate advertising is legally restricted. **Every generic ads skill on this machine
is wrong for this vertical by default.** They will recommend age brackets, ZIP-code
geofencing, income/net-worth targeting, "young families" copy, and Lookalike Audiences.
All of those are prohibited or restricted for housing, and following them risks ad
rejection, account restriction, and Fair Housing Act exposure.

When any ads task touches housing, real estate, mortgages, or homebuyers:
1. Load this skill first.
2. Apply the constraints below to anything a generic skill proposes.
3. If a generic skill's advice conflicts with this file, **this file wins.**

## Meta: Housing Special Ad Category — what is removed

Declare the **Housing** category at campaign creation. Meta's 2026 classifiers scan
images (exteriors, floor plans, "For Sale" signs), copy, landing pages, and account
history, and will **auto-apply the category even if you don't select it**. Not declaring
it is logged as an **Evasion violation** — worse than declaring.

| Lever | Status under Housing |
|---|---|
| Age | ❌ Locked to 18+. No age ranges. |
| Gender | ❌ Shown to all. |
| ZIP / precise geo | ❌ No ZIP or neighborhood geofencing. |
| Detailed interest / behavior / demographic | ❌ Mostly removed (income, net worth, "luxury home buyer", likely-to-move). |
| Audience exclusions | ❌ Disabled entirely. |
| Lookalike Audiences | ❌ Replaced by Special Ad Audiences. |
| **Minimum radius** | ⚠️ **15 miles** (US). A "15km" figure circulating online is an error. |
| Custom Audiences from *your* first-party data | ✅ Allowed — CRM lists, past clients, pixel/site visitors, video engagement, IG/FB engagers. |
| City / county / DMA / radius ≥15mi | ✅ Allowed. |

**Delivery-side:** Meta's Variance Reduction System (from the 2022 DOJ/HUD Fair Housing
settlement) runs on housing ads at the algorithm level. It is not configurable. Court
oversight ended June 27, 2026; VRS still applies.

## Google: Housing personalized-advertising restriction (US/CA)

Prohibited for targeting **or exclusion**: age, gender, marital status, parental status,
**ZIP code**. Longstanding sensitive-category bans (race, religion, etc.) also apply.

✅ Still allowed: city, county, state, DMA/region, privacy-safe radius. Customer Match and
remarketing are fine **unless** they key off a prohibited signal. Non-compliant ads are
blocked from serving; you get 60 days to accept the policy before ads stop.

**Strategic consequence:** Google is your *intent* channel — keyword search intent is
untouched by the housing restriction. Meta is your *demand-creation* channel with
targeting stripped. Budget accordingly.

## The core strategic move: creative does the qualifying

Because targeting is stripped on Meta, **the ad itself must self-select the audience.**
This is the single highest-leverage idea in this file. You cannot target first-time
buyers — so name them in the creative and let the wrong people scroll past.

- Say the qualifier out loud: "Never bought before?" / "Renting in Layton?"
- Lead with a **program dollar amount** — it self-selects for people who need assistance.
- Use the geography in the hook (city names are allowed and do the filtering for you).
- Let the landing page and form qualify further, not the audience settings.

**Prohibited copy patterns:** "perfect for young families," "great starter home for
newlyweds," "ideal retirement neighborhood," anything implying who *should* live
somewhere. Describe **the property and the program**, never the person.

## Verified Utah program angles

See `references/utah-programs.md` for full detail, eligibility, and caveats.

Highest-leverage hooks, by county:

- **SB 240** — up to **$20,000, 0% interest, deferred**. New construction only, never
  occupied, price ≤ $450,000. Utah resident 12 months, no ownership in 3 years.
  ~2,934 households funded, ~$58.5M distributed as of Jan 30, 2026; ~$10M more added
  this session. **Best angle for new-build communities.**
- **Own in Ogden** (Weber) — **$10K** general / **$15K** state-certified K-12 teachers &
  Ogden City employees / **$20K** sworn police & fire. The occupation tiers are excellent
  ad angles and are *not* prohibited targeting — you name the profession in the creative,
  you don't target by it.
- **Davis County** — 1% loan up to **$50,000**, deferred, ≤80% AMI. ⚠️ 2025 funds were
  exhausted; reopening ~July 1, 2026. **Confirm funding before advertising a dollar amount.**
- **UHC FirstHome** + DPA up to **6% / $27,500 cap**. Price caps: Salt Lake $562K,
  Davis $555K, Weber $495K. ~660 FICO conventional; homebuyer education required.
  **HomeAgain is currently suspended** — route repeat buyers to FHA/VA or HFA Advantage.

**Rule: never run creative naming a dollar amount without confirming current funding with
a participating lender.** An exhausted program in a live ad is a false-advertising risk.

## Planning benchmarks — use a band, never a point

No Salt Lake metro-specific CPL benchmark exists publicly. Sources disagree by ~3×
($16.61 LocaliQ 2025 vs $51.90 Adamigo 2026). Salt Lake behaves like a **Tier 2 metro**.

- **Planning band: $20–$45 per lead.**
- Seller "what's your home worth" valuation offers: **$15–$35** — consistently the
  lowest-CPL offer available. Start here.
- Buyer lead forms: **$35–$65**.
- Expect Q4→Q1 cost pressure (Superads real-estate series ranged $16.21 Nov → $40.27 Jan).
- **Above ~$65 sustained: fix the offer and creative. Do not touch targeting** — under
  HEC there is very little targeting left to fix, so cost problems are almost always
  creative or offer problems.
- Re-benchmark against your own account after ~50 conversions. That is your real number.

Do **not** cite a specific "Special Ad Category inflation %" — no clean public figure exists.

## MCP safety when connected to live ad accounts

- Official Meta server is exactly `https://mcp.facebook.com/ads`, authenticates via Meta
  Business OAuth, and **never asks for an API key**. If something requested a key or token,
  it is a third-party broker holding spend authority — disconnect.
- Campaigns created via the official connectors land **PAUSED**. Keep it that way.
- Stay **read-only for ~2 weeks** and reconcile what the agent reports against Ads Manager.
- Require human approval before any budget change >20% or before un-pausing anything.

## Pre-launch checklist

- [ ] Housing category declared in the campaign
- [ ] No age / gender / ZIP targeting anywhere
- [ ] Radius ≥ 15 miles
- [ ] No plain Lookalikes (Special Ad Audiences or first-party Custom Audiences only)
- [ ] No exclusions configured
- [ ] Copy describes property/program, never the person
- [ ] Any dollar amount named is confirmed currently funded
- [ ] Landing page matches the ad claim
- [ ] Campaign stays paused until a human un-pauses it
