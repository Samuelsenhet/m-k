# Samlingar – final production sign-off

One-time confirmation checklist. No blocking gaps.

---

## 1. RLS + Edge Function alignment

- **Client cannot insert `type = 'system'`**  
  Policy "Members can insert text messages" has `WITH CHECK (type = 'text' AND sender_id = auth.uid() AND ...)`. So only `text` with own `sender_id` is allowed. ✅

- **Edge Function for system messages**  
  `collection-system-message` uses **service role** to insert into `collection_messages` with `type = 'system'`, `sender_id = null`. RLS is bypassed as intended. Caller must be authenticated; for `member_added` caller must be owner. Client calls it fire-and-forget after leave (with own display_name) and after add member (with new member’s display_name). ✅

---

## 2. Route hardening

- **`/chat/collection/:id` when not a member**  
  List does not include the collection → `selectedCollection` stays null → `showCollectionNotFound` true → "Samlingen hittades inte eller du är inte längre medlem" + **BottomNav hidden** (`!showCollectionNotFound && <BottomNav />`). ✅

- **Feature flag off + direct link**  
  `useEffect`: when `collectionIdFromUrl && !isCollectionsEnabled` → `navigate("/chat", { replace: true })`. ✅

---

## 3. Analytics event fire points (decided, can be disabled)

| Event                 | Location                                      | When                          |
|-----------------------|-----------------------------------------------|-------------------------------|
| `samling_created`     | After `useCollections().create()` succeeds    | Return `{ id }` to caller; caller or hook can fire. |
| `samling_message_sent`| After `useCollectionMessages().sendMessage()` succeeds | Inside hook when insert succeeds. |

No provider required yet; when you add one, call it from these two places. See [SAMLINGAR_ANALYTICS.md](SAMLINGAR_ANALYTICS.md).

---

**Verdict:** Ship Samlingar as-is. Best next: 48h dogfood, turn on the two events, implement system messages (design done).
