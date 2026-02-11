# Samlingar – minimal analytics schema

Proposed events for a 48h dogfood or soft-launch. No PII; aggregate only unless you need per-user funnels.

---

## Recommended events (2)

| Event | When | Suggested properties |
|-------|------|----------------------|
| `samling_created` | User taps "Skapa samling" and creation succeeds | `member_count` (number of members added, incl. self) |
| `samling_message_sent` | User sends a text message in a collection | `collection_id` (hashed or internal id for dedup), optional: `is_first_message` (boolean) |

**Why these:** "Samling created" tells you adoption; "Message sent in samling" tells you engagement. No need for open/leave in v1 unless you want retention curves.

---

## Where to send

- **Option A:** Supabase Edge Function that writes to a `analytics_events` table (or existing events table) with `event_name`, `user_id`, `properties` (jsonb), `created_at`. Query later with SQL.
- **Option B:** Your existing analytics (Vercel Analytics, PostHog, Mixpanel, etc.) – use the same event names so you can filter dashboards by `event_name = 'samling_created'` and `event_name = 'samling_message_sent'`.

---

## Example payloads (for reference)

```json
{ "event": "samling_created", "properties": { "member_count": 3 } }
{ "event": "samling_message_sent", "properties": { "collection_id": "uuid-or-hash", "is_first_message": false } }
```

Keep `user_id` server-side or in your existing auth context; don’t put it in client logs if they’re public.

---

## Post-launch (defer)

- `samling_opened` (when user enters a group chat)
- `samling_member_added` (owner adds someone)
- `samling_left` (for retention)
- Unread/badge metrics when you add them
