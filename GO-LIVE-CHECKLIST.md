# GROWV landing page — what's left to go live

Prepared 17 Aug 2026. Site changes are finished and committed locally; nothing is
published yet.

---

## 1. Blockers — nothing goes live until these are done

### 1a. Log in to Netlify (only you can do this)

The site is hosted on Netlify (site `aesthetic-concha-636df7`, DNS at GoDaddy).
The CLI isn't installed on this Mac and the project folder has no `.netlify`
link, so `npx` will fetch the CLI on first run.

```bash
npx netlify-cli login
```

This opens a browser for you to authorize. I can't do this step — it's
authentication.

### 1b. Decide what gets published

**This one matters, because it's public and hard to walk back.**

The project folder is 64 MB, and most of it is not the website. Deploying the
whole folder would publish everything in it, reachable by anyone who guesses the
URL:

- `lp/` and `marketing/` — I have not opened these; the names suggest working
  material you may not want public
- ~40 MB of unused originals: `Neighborhood1-3.JPG`, `G52.png`, `G53.png`,
  `Stefanie1.jpg`, `Wilian.png`

Two options:

1. **Publish only what the site uses** (recommended) — `index.html`,
   `assets/css`, `assets/js`, and just the referenced images. Nothing else.
2. **Publish the whole folder** — simplest, but `lp/` and `marketing/` go public.

### 1c. Check whether Netlify auto-deploys from GitHub

If that Netlify site is already wired to the `renanmbs/grovw` repo, a CLI deploy
gets overwritten the next time anyone pushes. `netlify status` answers this once
you're logged in.

**If it is git-linked**, the CLI is the wrong route and we need the GitHub push
working instead — see item 2.

---

## 2. Optional but recommended — unblock the GitHub push

Two commits sit on the local branch `hero-grand-opening` and cannot be pushed:
no stored GitHub credential, no SSH key, and `gh` isn't installed. Nothing is
backed up off this Mac right now.

```bash
brew install gh && gh auth login
```

This fixes both the push and the missing CLI in one step. Pick HTTPS when asked.

---

## 3. Content still needed from you

These don't block launch, but the page ships incomplete without them.

| Item | Why |
|---|---|
| **Bios for Stefanie Godinez and Wilian Guevara** | Their cards render without one, but look sparse next to Jonathan's. I deliberately did not invent biographical facts about real people. |
| **Personal site URLs for Stefanie and Wilian** | Both cards currently point at the contact form, labelled "Get in touch". Give me real URLs and they switch to "View profile" automatically. |
| **Confirm the "Search Listings" button** | The gold "View Properties" button now goes to jonathanperez.site. The quieter "Search Listings" link next to it still points at the on-page Properties section. Should it also go to jonathanperez.site? |
| **"Meet the team" link in the About section** | Now points *backwards* up the page, since The Team moved above About. Still works; may want repointing or removing. |

---

## 4. Decisions already made that you may want to reverse

- **Mobile headline size.** Fitting "Office Grand Opening Aug. 19, 2026" on one
  line means it renders at ~23px on a phone, down from 42px. Shortening the text
  (e.g. "Grand Opening · Aug. 19, 2026") would buy back roughly 15%.
- **Section order** is now: Hero → The Team → Join GROWV → Mission → About →
  Properties → Contact. About sits above Properties rather than at the very
  bottom, so two cream sections don't collide.
- **Nav order** in both the desktop and mobile menus was reordered to match.
- **Photos were re-encoded for web.** `wilian-guevara.jpg` is 257 KB, down from a
  1.4 MB PNG. Your originals are untouched.
- **`.claude/launch.json` and `.claude/serve.js`** are local preview tooling I
  added, currently untracked. Delete them if you don't want them in the repo.

---

## What's already done

- Grand opening announcement in a ruled frame, centred in the hero, both lines
  in Cormorant (roman over italic)
- Headline holds one line at every screen width
- "Lunch is on us. 🥪 Come say hello. 👋" with "Everyone Is Welcome" beneath
- Hero background swapped to the aerial neighbourhood photo
- Stefanie Godinez and Wilian Guevara added to the team, three cards across
- "View Properties" and Jonathan's team card both link to jonathanperez.site
  (his card already did)

All verified in a local browser at 320, 375, 1280 and 1920px. Local commits:
`83d265c`, `91a3f8f`.
