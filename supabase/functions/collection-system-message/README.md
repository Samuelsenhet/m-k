# collection-system-message

Inserts a **system message** into a collection (`type = 'system'`, `sender_id = null`).  
Source of truth: stored rows; client cannot insert system messages (RLS allows only `type = 'text'` with own `sender_id`).

## Auth

- **Caller:** Must send `Authorization: Bearer <user JWT>`. Only authenticated users.
- **member_left:** Caller is the user who left; no extra permission.
- **member_added:** Caller must be an **owner** of the collection (checked via anon client + RLS).

## Body

```json
{
  "collection_id": "uuid",
  "event": "member_added" | "member_left",
  "display_name": "Anna"
}
```

- `display_name`: Shown in the message (e.g. "Anna lämnade gruppen."). Sanitized (length 100, no control chars).

## Service role

Uses `SUPABASE_SERVICE_ROLE_KEY` to insert into `collection_messages`, bypassing RLS. Required env in Supabase Dashboard (set by default for Edge Functions).

## Invoke (from client)

After a successful leave or add-member action, call:

```ts
await supabase.functions.invoke('collection-system-message', {
  body: { collection_id, event: 'member_left' | 'member_added', display_name },
  headers: { Authorization: `Bearer ${session.access_token}` },
});
```

Fire-and-forget; do not block UI on success/failure.
