# Session Handover - Koersen App

Last updated: March 26, 2026

## 1) Current product state
- React + Tailwind SPA with Node/Express API.
- Live rates are fetched from:
  - CME (`cme.sr`)
  - DSB
  - Hakrinbank
- Extra known cambio list is included from CBvS register.
- If no online rate exists, app shows `Geen Koers` (and keeps that until user/owner/admin update happens).

## 2) Major features completed
- Live dashboard with search/filter by district and exchange name.
- Compare mode (2-3 exchanges).
- Best-rate highlighting (fresh quotes only).
- Currency converter uses **Buy rate** (as requested).
- Source badges: `Official Site`, `CBvS Register`, `User Reported`, `Community Verified`, `Cambio Owner Portal`.
- `Map View` and WhatsApp reservation button per row.
- `Official vs Parallel` panel.
- Location analysis card (best nearby rates).
- Trending/most viewed section.
- 7-day mini charts.
- Crowdsourcing report module with OCR:
  - photo required
  - OCR reads rates from image
  - minimum OCR confidence threshold
  - anti-fraud checks
- Business portal is login-protected and renamed to `Cambio Owner Portal`.
- Footer branding text + link to TCB website.
- App-wide color theme aligned with provided logo palette.

## 3) Key functional decisions from this session
- Admin module is **not** exposed on home; admin management is intended for Django admin backend.
- Business portal is private (session-based login on frontend for now).
- Rate refresh interval is 1 hour.
- API cache TTL is 1 hour.
- Register-only cambios remain `Geen Koers` unless:
  - online source becomes available, or
  - updated via user report / owner portal / admin path.

## 4) Technical settings (important)
- Frontend refresh interval:
  - `REFRESH_INTERVAL_MS = 3_600_000` in [App.jsx](/C:/Koersen_App/src/App.jsx)
- Backend cache TTL:
  - `CACHE_TTL_MS = 3_600_000` in [index.js](/C:/Koersen_App/server/index.js)
- Stale threshold:
  - `STALE_THRESHOLD_MS = 90 * 60 * 1000` in [marketState.js](/C:/Koersen_App/src/utils/marketState.js)
- OCR confidence minimum:
  - `MIN_OCR_CONFIDENCE = 65` in [CrowdsourcePanel.jsx](/C:/Koersen_App/src/components/CrowdsourcePanel.jsx)
- Business portal auth env vars:
  - `VITE_PORTAL_USER`
  - `VITE_PORTAL_PASS`
  - no fallback credentials (portal login is disabled when env vars are missing)

## 5) Security/trust logic now in place
- Crowdsource checks:
  - `sell` must be higher than `buy`
  - spread too large is blocked
  - large deviation vs recent baseline is blocked
  - duplicate photo fingerprint in 1 hour is blocked
- Community verification:
  - if 3 matching reports in 1 hour => `Community Verified`.

## 6) Files with most relevant logic
- Frontend app orchestration:
  - [App.jsx](/C:/Koersen_App/src/App.jsx)
- Rates table and stale/open indicators:
  - [RatesTable.jsx](/C:/Koersen_App/src/components/RatesTable.jsx)
- OCR report workflow:
  - [CrowdsourcePanel.jsx](/C:/Koersen_App/src/components/CrowdsourcePanel.jsx)
- Owner login portal:
  - [BusinessPortal.jsx](/C:/Koersen_App/src/components/BusinessPortal.jsx)
- Target alerts card:
  - [RateAlertCard.jsx](/C:/Koersen_App/src/components/RateAlertCard.jsx)
- Formatting + `Geen Koers` display:
  - [formatters.js](/C:/Koersen_App/src/utils/formatters.js)
- Stale/open-now helpers:
  - [marketState.js](/C:/Koersen_App/src/utils/marketState.js)
- Frontend data mapping/fallback:
  - [ratesService.js](/C:/Koersen_App/src/services/ratesService.js)
- API and source aggregation:
  - [index.js](/C:/Koersen_App/server/index.js)
  - [cme.js](/C:/Koersen_App/server/sources/cme.js)
  - [dsb.js](/C:/Koersen_App/server/sources/dsb.js)
  - [hakrin.js](/C:/Koersen_App/server/sources/hakrin.js)
  - [cbvsRegister.js](/C:/Koersen_App/server/sources/cbvsRegister.js)

## 7) Run and verify locally
- Start dev:
```bash
npm run dev
```
- Frontend:
  - `http://localhost:5173`
- API health:
  - `http://127.0.0.1:8787/api/health`

Quick checks:
- Table loads and shows mixed `Official Site` + `CBvS Register`.
- Register-only rows show `Geen Koers`.
- `Open Now Only` toggle filters list.
- Stale badge appears after threshold.
- OCR report requires photo and confidence.
- Target alert can trigger browser notification when condition is met.

## 8) Deployment plan (next immediate step)
- Deploy API + frontend (Render recommended for free start).
- Confirm production CORS and API routes.
- Verify live scraping in production.
- Deployment guide prepared:
  - [DEPLOY_RENDER.md](/C:/Koersen_App/docs/DEPLOY_RENDER.md)

## 9) Planned next phase after deployment
- PWA/mobile polish:
  - installable app (manifest + service worker)
  - offline last-known rates cache
  - push notifications
