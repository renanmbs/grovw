# HANDOFF — Utah FTHB Ads Setup

**Last updated:** 2026-08-11 · **Owner:** Jonathan (jperez.ut@gmail.com)
**Business:** Real estate — Davis, Weber, Salt Lake counties, UT. First-time home buyers & sellers.

Read this file first in a new session. It is the complete state of this work.

---

## 1. What this project is

Connecting Facebook/Instagram, Microsoft 365, and ad-platform tooling to Claude, then
building a paid-acquisition growth plan for a Utah first-time-buyer real estate practice.

Note: `growv-landing` is otherwise a website repo. This `marketing/` folder is the ads work
and is unrelated to the site code. Nothing here touches `index.html` or `apps-script/`.

---

## 2. Assets in this folder

| File | What it is |
|---|---|
| `HANDOFF.md` | This file |
| `growth-plan.html` | The full strategy deliverable (also published as an artifact, see §6) |
| `research-2026-08-12-utah-fthb-ads.md` | Source research: compliance, Utah programs, CPL benchmarks |
| `utah-fthb-ads-skill/` | Backup copy of the custom skill (live copy is in `~/.agents/skills/`) |

---

## 3. Environment — DONE

- **Node v24.19.0** installed 2026-08-11 via official universal `.pkg`, verified by SHA256.
  `npx` at `/usr/local/bin/npx`. Visible to Claude Code without restart.
  ⚠️ Gotcha for future installs: there is **no `-darwin-arm64` variant of the .pkg** — only
  of the tarballs. The correct file is `node-v24.19.0.pkg`. Using the arch suffix 404s and
  silently downloads a 14-byte error page unless you pass `curl -f`.
- No Homebrew on this machine.

## 4. Skills installed — DONE

Live at `~/.agents/skills/`, symlinked into `~/.claude/skills/`. 12 total.

**Custom (built here, exists nowhere else):**
- `utah-fthb-ads` — Housing Special Ad Category + Google Housing compliance, verified Utah
  DPA program angles, CPL bands, MCP safety. **Declares that it overrides the generic ads
  skills**, which are written for B2B SaaS and will recommend prohibited targeting.

**From `coreyhaines31/marketingskills`** (43,963 stars — verified):
`ads`, `ad-creative`, `offers`, `lead-magnets`, `cro`, `referrals`, `co-marketing`,
`free-tools`, `copywriting`

**From `adkit/ads-skills`** (18 stars — audited line by line, clean but low-credibility):
`meta-ads-strategy`, `google-ads-strategy`

### Security audit results (do not re-do this work)

- All installed skills are **pure markdown**. One inert HTML template in `ad-creative`
  (inline script, zero external URLs). No executables, no exfil, no credential access.
- The `skills` npm CLI: maintainers `rauchg` + `quuu`, 2 deps, **no postinstall script**. Clean.
- ❌ **DO NOT install `adkit/ads-skills` with `--all`.** It contains a third skill,
  `skills/adkit`, that is a commercial funnel: auto-installs `@adkit/cli`, reads
  `ADKIT_API_KEY` from env, routes Meta/Google ad-account OAuth through a third-party SaaS,
  and has a `--publish` flag that spends real money with no draft review. Verified absent
  from disk. Always use `@skill` syntax on that repo.
- ⚠️ `AgriciDaniel/claude-ads` (7,979 stars, MIT, well-engineered) is a **plugin, not
  standalone skills**. Installing `@ads-meta` via the skills CLI yields a 38-line stub
  referencing an `ads/` core (39 files) the CLI does not fetch. Was installed, found
  non-functional, removed. To use it, add it as a plugin marketplace instead — worth doing.

### Corrections to the research file

The research doc in this folder has two errors worth knowing:
- It says `adkit/ads-skills` has 5 stars. Verified: **18**. (Still fails the 100-star bar.)
- It says no ads package clears 100 stars. **It missed `AgriciDaniel/claude-ads` at 7,979.**
  Its practical conclusion still holds — that repo has no housing coverage either.
- It claims `AgriciDaniel/claude-ads` covers Special Ad Categories. Verified false: the
  phrase appears **only in its CHANGELOG**, not in any shipped agent or reference file.

**Standing finding: no skill in any registry covers Fair Housing / Special Ad Category.**
That is why `utah-fthb-ads` had to be written from scratch.

---

## 5. Connectors — NOT DONE (user action required)

These are added in the **Claude desktop app / claude.ai → Settings → Connectors**, not in
Claude Code. Claude cannot do this step.

| Connector | Status | Notes |
|---|---|---|
| **Meta Ads** (FB + IG) | ⬜ Not connected | Custom connector, URL exactly `https://mcp.facebook.com/ads` |
| **Microsoft 365** | ⬜ Blocked | Built-in connector, but **requires a business Entra tenant** |
| Google Ads | ⬜ Not started | Optional; `google/skills@google-ads-api-mcp-setup` exists (official Google org) |

**Meta Ads steps:** Settings → Connectors → Add custom connector → name it `Meta Ads` →
paste `https://mcp.facebook.com/ads` → Add → Facebook Login → select business portfolios.
Then in a new chat: `+` → Connectors → toggle on.

⚠️ **Verification that matters:** the official Meta server uses Meta Business OAuth and
**never asks for an API key or token**. If anything requests a key, it's a third-party
broker holding spend authority — disconnect. Most "Meta Ads MCP" search results (Pipeboard,
GoMarble, AdKit, Composio) are unofficial.

⚠️ **M365 blocker:** requires a Microsoft Entra tenant on a Business plan. Personal accounts
(@outlook.com, @hotmail.com) are rejected. Jonathan's account on file is Gmail — **confirm a
work/school M365 login exists before attempting**. If there's no business tenant, this
connector cannot be used at all and that part of the request is not deliverable as asked.

**Safety posture once connected:** stay read-only ~2 weeks and reconcile against Ads
Manager. Campaigns created via the official connector land PAUSED — keep it that way.
Require human approval before any budget change >20% or before un-pausing.

---

## 6. Strategy deliverable — DONE

**Artifact:** https://claude.ai/code/artifact/55683c8c-5695-4ad6-b396-36ca9a4f6580
(private; local copy at `marketing/growth-plan.html`)

To update it in a future session, pass that URL as the `url` parameter — publishing without
it creates a duplicate.

Covers: the constraint map (what HEC removes vs. what survives), Meta-as-demand-creation
vs Google-as-intent-capture, offer architecture ranked by CPL with compliant ad copy
specimens, county-by-county DPA plays, the network engine, campaign build for both
platforms, measurement thresholds, a 90-day rollout, and a pre-launch checklist.

**Core thesis:** you cannot target first-time buyers under the Housing category, so the
creative must do the qualifying. Utah's DPA dollar figures do that filtering legally and
better than any audience setting would.

**Strongest single idea in it:** UHC FirstHome *requires* homebuyer education. Become the
provider of that class — you meet every qualified FTHB before they choose an agent, and
every attendee legally enters the CRM Custom Audience, which is one of the only precise
targeting levers HEC leaves standing.

---

## 7. What's left

**Blocking on Jonathan:**
1. Connect the Meta Ads connector (§5)
2. Confirm whether a business M365 tenant exists; connect or formally drop that scope
3. Confirm current funding on all DPA programs with a participating lender — **required
   before any creative names a dollar amount**

**Open work Claude can pick up:**
4. Install `AgriciDaniel/claude-ads` properly as a plugin marketplace (best-engineered ads
   package available; the skills-CLI path does not work for it)
5. ~~Write the landing pages~~ — **DONE, see §9**
6. Draft the homebuyer-education class curriculum and its lead-capture flow
7. Build out the actual campaign structures once the Meta connector is live
8. Consider a `utah-fthb-ads` eval set to verify the skill actually blocks prohibited
   targeting suggestions when a generic skill proposes them
9. Add Meta Pixel + Google tag to the landing pages (none installed yet)

**Unverified / needs reconfirmation before client-facing use:**
- HB 541 (existing-home expansion of SB 240) — introduced, **not confirmed passed**
- SB 240's added ~$10M appropriation — confirm against final 2026 session record
- Davis County $50K program — 2025 funds exhausted, reopening ~July 1 2026, **confirm**
- Most county/city dollar figures come from aggregators, not primary county pages
- UHC HomeAgain is **suspended** — route repeat buyers to FHA/VA or HFA Advantage
- No Salt Lake–specific CPL benchmark exists publicly; the $20–45 band is inferred from
  Tier 2 metro national data. Replace with real account data after ~50 conversions.

---

## 9. Landing pages — DONE (2026-08-12)

Built in `lp/` — see `lp/README.md` for full detail. Four standalone pages, one offer each:

| Page | Offer | `source` value |
|---|---|---|
| `lp/home-value.html` | Seller valuation | `lp-home-value` |
| `lp/sb240.html` | SB 240 $20K program | `lp-sb240` |
| `lp/own-in-ogden.html` | Own in Ogden tiers | `lp-own-in-ogden` |
| `lp/rent-vs-own.html` | Rent-vs-own estimator | `lp-rent-vs-own` |

They reuse the GROWV brand tokens but load their own small CSS/JS — no site nav, no exit
paths. All four POST to the **existing Apps Script endpoint**, tagging the sheet's existing
**Source** column for per-campaign attribution with no new plumbing. Extra fields (address,
employer, city, calculator inputs) ride in the Message column.

Verified in-browser at 1280px and 375px: no horizontal overflow, 16px inputs (stops iOS
zoom-on-focus), 3 fields per form, Equal Housing mark on every page. Estimator math checked
against an independent calculation.

⚠️ **Blocking before traffic:** no Meta Pixel or Google tag is installed on these pages yet,
and every dollar figure in `sb240.html` / `own-in-ogden.html` must be reconfirmed with a
lender before launch.

### ❗ Correction to the growth plan (found 2026-08-12)

The plan's original renter-conversion ad copy claimed Clearfield rent exceeds the payment on
a $340K home. **That is false at current rates.** Verified: $340K at 3.5% down / 6.5% is
~$2,485/mo all-in (P&I + ~0.55% UT property tax + insurance + FHA MIP) vs ~$1,500–1,700
rent. Breakeven against $1,600 rent needs a ~$214K purchase price — no such move-in
inventory exists on the Wasatch Front.

**Do not run "your rent already covers a mortgage" in this market.** It is the standard
industry hook and it is not true here. The plan and `rent-vs-own.html` were both corrected
to lead with the **down payment as the obstacle** instead — true, and it sets up the DPA
programs as the answer.

---

## 8. Memory

Durable facts are saved at
`~/.claude/projects/-Users-jonathan-Desktop-growv-landing/memory/`:
- `user-utah-realtor.md` — market and vertical, and the Fair Housing constraint
- `ads-skills-audit-2026-08.md` — what's installed, what was rejected, why

Indexed in `MEMORY.md` at that path.
