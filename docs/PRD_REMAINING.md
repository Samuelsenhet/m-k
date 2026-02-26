# PRD – What’s done and what’s left

Short overview of PRDs in `PRD.md` and current status.

---

## PRD: Enhanced AI Icebreakers

**Status: Done.** All US-001–US-011 are marked complete (analytics table, categories, generate-icebreakers, generate-followups, UI, translations).

---

## PRD: Profile Photo Management

**Status: Done.** US-012–US-016 are marked complete (reorder, delete, upload progress, photo limits, translations).

---

## PRD: App Completion & Polish

**Status: Partially done.** Many stories are done; some verification stories are still unchecked:

- **US-017:** Verify photo upload progress in browser – acceptance criteria not all checked.
- **US-018:** Verify photo count limits – acceptance criteria not all checked.
- Further US in this section: review `PRD.md` for any remaining unchecked items.

**Manuell verifiering:** Använd **[docs/VERIFICATION_CHECKLIST.md](docs/VERIFICATION_CHECKLIST.md)** för att köra igenom US-017–US-029 steg för steg. Bocka av i checklistan och, när nöjd, i `PRD.md`.

---

## Reporting & safety (from RAPPORTERINGS PDF)

**Status: Implemented.**

- Report submission (form + entry points: profile, chat, settings).
- Rapporthistorik (report history) in settings.
- Moderator view: `/admin/reports` (users in `moderator_roles` only).
- Reporter notification when report status changes (DB trigger → `notifications`).
- Appeal flow: `/appeal` + settings link; data in `public.appeals`.

**Remaining (optional):** Moderator UI for appeals (list/update appeals); for now appeals can be handled in Supabase Table Editor.

---

## Suggested next focus

1. Run through verification stories (US-017, US-018, etc.) and update `PRD.md`.
2. Add a moderator to `moderator_roles` and test `/admin/reports` and report status → notification.
3. Keep production env vars and migrations in sync using `docs/DEPLOY.md`.
