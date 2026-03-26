# Deploy to Render (Free Plan)

## 1) What this setup does
- Deploys frontend + API in **one Render Web Service**.
- API routes stay under `/api/*`.
- React SPA is served from `dist` in production by Express.

## 2) Files already prepared
- [render.yaml](/C:/Koersen_App/render.yaml)
- [server/index.js](/C:/Koersen_App/server/index.js)
- [package.json](/C:/Koersen_App/package.json)

## 3) Render deploy steps
1. Push this repo to GitHub.
2. In Render dashboard: **New +** -> **Blueprint**.
3. Select your repo (Render will detect `render.yaml`).
4. Create service.

Render will run:
- Build: `npm install && npm run build`
- Start: `npm run start`

## 4) Environment variables to set (optional but recommended)
- `VITE_PORTAL_USER` (for Cambio Owner Portal login user)
- `VITE_PORTAL_PASS` (for Cambio Owner Portal login password)

Important:
- These `VITE_*` vars must be set in Render **before a new build** to affect frontend bundle.

## 5) Health and smoke checks after deploy
- Health: `https://<your-render-url>/api/health`
- Live rates: `https://<your-render-url>/api/rates/live`
- App: `https://<your-render-url>/`

## 6) Free-plan expectation
- Service may sleep after inactivity and cold start on first hit.
- Good for MVP/testing; upgrade later for always-on.
