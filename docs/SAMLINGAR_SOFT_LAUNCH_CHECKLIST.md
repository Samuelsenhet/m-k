# Samlingar – soft-launch checklist

Use this before enabling Samlingar in production or after a deploy.

---

## Security & permissions

- [ ] RLS verified: [docs/SAMLINGAR_RLS_AUDIT.md](SAMLINGAR_RLS_AUDIT.md) – collections, members, messages
- [ ] Non-members get “not found” (no collection or message leak)
- [ ] Owner leave warning shown (“Om du lämnar har gruppen ingen ägare”)

---

## Env & feature flags

- [ ] **Production / Preview**: Supabase URL + key set ([VERCEL_SANITY_CHECK.md](VERCEL_SANITY_CHECK.md))
- [ ] `VITE_ENABLE_COLLECTIONS` unset or `true` (set `false` only to disable)
- [ ] Supabase URL + anon key set; no Twilio secrets in client env

---

## UX

- [ ] Chat list: Samlingar section shows when collections enabled; empty state has “Skapa samling”
- [ ] Deep link `/chat/collection/:id`: opens group or “not found” if not member
- [ ] Back / browser back from group returns to chat list
- [ ] CreateCollectionModal: name + pick members; create then navigate to group
- [ ] Group: messages, send, members sheet, add member (owner), leave with confirm

---

## Accessibility & polish

- [ ] GroupAvatar has `aria-label` (Gruppavatar / Medlemsavatarer)
- [ ] Create-collection dialog has description; leave-confirm has description
- [ ] First-time hint on Chat (Samlingar) dismissible; stored in localStorage

---

## System messages (product decision)

**Decision:** System messages (user added, user left, etc.) are **stored rows** (`type = 'system'` in `collection_messages`), not client-only events. This is the source of truth and prevents timeline drift when users join later or re-open the app. Implementation: Edge Function or service role inserts these rows; client only reads them.

---

## Notifications (planned)

- [ ] Badge count on Samling in chat list (optional)
- [ ] Push: “Nytt meddelande i [samling name]” (optional)
- [x] System message when user added/left: Edge Function `collection-system-message` + client calls after leave/add member (stored row per decision above)

---

## After go-live

- [ ] Monitor Supabase logs for RLS or permission errors
- [ ] If issues: set `VITE_ENABLE_COLLECTIONS=false`, redeploy, fix, re-enable

---

## First post-launch iteration (when ready)

1. **Dogfood:** 48h with 5–10 internal users; watch for "not found", leave, and add-member flows.
2. **Metrics:** Add the two events from [SAMLINGAR_ANALYTICS.md](SAMLINGAR_ANALYTICS.md) (`samling_created`, `samling_message_sent`).
3. **Quality:** Ownership badge ("Skapare") and owner-leave toast are in place; consider soft badge (message count or "•" when recent) for engagement.
4. **System messages:** Implement stored `type = 'system'` rows (user added/left) via Edge Function when you want timeline consistency for new joiners.
5. **Defer:** Push notifications, auto ownership transfer, moderator tooling – all safe to defer.
