# Full pass before deploy

Quick smoke-test list to run locally before you deploy. PRD stories US-001–US-029 are complete; this is the final check.

---

## 1. Start the app

```bash
npm run dev
```

Open **http://localhost:8080** (or the port shown).

---

## 2. Smoke-test checklist

Tick as you go. Stop and fix any failure before deploying.

### Landing & auth

- [ ] Homepage loads, “Kom igång” (or CTA) works
- [ ] Phone auth: enter number → OTP (or demo 123456) → age verification → redirect
- [ ] After login, no redirect loop; goes to onboarding or matches as expected

### Onboarding (if testing new user)

- [ ] Basics step: name, gender, sexuality, looking for
- [ ] Personality test: answer questions → see result
- [ ] Photos: upload at least one, see progress/feedback
- [ ] Complete onboarding → lands on matches or welcome

### Core routes

- [ ] **/** – Home / landing
- [ ] **/matches** – Match cards or “waiting” / “no pool yet” (cron may not have run today)
- [ ] **/chat** – Chat list; open a conversation
- [ ] **/profile** – Own profile; edit profile (photos, reorder, delete)
- [ ] **/match/:id** or match flow – View match profile, like/pass, chat

### Chat & icebreakers

- [ ] Send a message
- [ ] Icebreakers: category picker, generate, send one
- [ ] Follow-up suggestions (after 3+ messages, when it’s your turn)

### Quality

- [ ] No red errors in browser console on load and after main actions
- [ ] Bottom nav works (Matches, Chat, Profile)
- [ ] Mobile viewport (DevTools) – tap targets and layout OK

### Build & lint

- [ ] `npm run typecheck` – passes
- [ ] `npm run lint` – passes
- [ ] `npm run build` – succeeds

---

## 3. When everything passes

- Deploy using **docs/DEPLOY.md** (migrations, env vars, build, then deploy).
- After deploy, run the “After deploy” checks in DEPLOY.md on the production URL.

---

## 4. If you want a new PRD task

The current PRD (icebreakers, photo management, completion & polish) is **complete**. To keep coding:

- Add a new section or file (e.g. `PRD_PHASE2.md` or new stories in PRD.md) for post-launch features, or
- Pick a bug/improvement from issues and implement it.

Then point Ralph at the new backlog if you use it.
