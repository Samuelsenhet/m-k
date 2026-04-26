# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

MÄÄK is a Swedish personality-based dating PWA. Frontend is React 18 + TypeScript + Vite (port 8080). Backend is Supabase (cloud-hosted PostgreSQL, Auth, Realtime, Edge Functions). Auth uses phone SMS OTP via Twilio.

### Node version

The project requires Node.js 20.x (`engines: ">=20.0.0 <21.0.0"` in `package.json`). The VM uses `nvm`; run `nvm use 20` if you get engine-mismatch errors.

### Quick reference (standard commands)

See `README.md` and `package.json` scripts for the canonical list. Key commands:

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 8080) |
| Build | `npm run build` |
| Lint | `npm run lint` (ESLint + cspell) |
| Type check | `npm run typecheck` |
| Tests | `npm run test` |

### Known lint state

`npm run lint` uses `--max-warnings 0`. There are 4 pre-existing `react-refresh/only-export-components` warnings in `CardV2.tsx`, `Input.tsx`, and `MascotVisual.tsx`. These cause the lint command to exit with code 1 even though there are zero errors.

### Environment variables

Copy `.env.example` to `.env` before running. The example file already contains the Supabase URL and anon key for the hosted project. No additional secrets are needed for the frontend dev server to start and render.

### Authentication caveat

The app uses phone-based SMS OTP as the only auth method. Without valid Twilio credentials configured in the Supabase Edge Functions, you cannot complete login. The landing page, routing, and UI render fully without auth.

### Vite config location

Vite config lives at `config/vite.config.ts` (not root). The `@` path alias resolves to `src/`.
