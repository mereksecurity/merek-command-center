# Merek Command Center

State of Play dashboard for Merek Security Solutions.

**Live:** https://merek-command-center.netlify.app/

## Architecture

- **Hosting:** Netlify (auto-deploy on push to `main`)
- **Static site:** `public/` directory
- **Runtime registry:** `public/registry.json` — index of threads, SOWs, manuscripts, grants, partnerships
- **Auth:** Netlify edge function (`netlify/edge-functions/auth.ts`) gates all paths except `/registry.json`, which is intentionally public

## Registry sync

The registry is synced from a canonical Google Doc (`18CAfHblqOGrQwTroKbNfJitBzT67zoK9qELSTbLzDRU`) by the `command-center-refresh` scheduled task. The task reads the doc, compares it to `public/registry.json`, and pushes any changes via the GitHub Contents API. Netlify auto-deploys the new commit.

To edit the registry: update the Google Doc. The next scheduled task run picks up the change.

## Legacy / inactive configs

- `render.yaml` — old Render.com config, not in use
- `server.js` + `package.json` express setup — for local dev only; production is purely static on Netlify
