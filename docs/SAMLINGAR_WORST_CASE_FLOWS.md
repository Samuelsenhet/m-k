# Samlingar – worst-case user flows

Simulate these to confirm behaviour before launch.

---

## 1. Non-member opens deep link

**Steps:** User A is not in the collection. They open `/chat/collection/<uuid>` (e.g. from notification or shared link).

**Expected:**
- `useCollections()` returns only collections where A has active membership, so this collection is not in the list.
- `selectedCollection` stays `null`; `showCollectionNotFound` is true.
- Screen: "Samlingen hittades inte eller du är inte längre medlem." + "Tillbaka till chattar".
- No collection or message data is exposed (RLS returns 0 rows for direct queries).

**Verify:** Open DevTools → Network; no successful request returns collection or messages for that id.

---

## 2. Member leaves (including owner)

**Steps:** User is in group → ⋮ menu → "Lämna samlingen" → confirm.

**Expected:**
- `leave(collectionId)` runs (sets `left_at` on their `collection_members` row).
- Toast: "Du har lämnat samlingen."
- `onLeave()` runs: `refetchCollections()` then `handleBack()` → navigate to `/chat`, `selectedCollection` cleared.
- List no longer shows this collection.

**Owner:** Same flow; confirmation text includes: "Om du lämnar har gruppen ingen ägare – endast en ägare kan lägga till medlemmar."

---

## 3. User was removed by owner (or left on another device)

**Steps:** Owner (or backend) sets `left_at` for user B. User B still has `/chat/collection/:id` open or opens it later.

**Expected:**
- B’s list comes from `collection_members` where `left_at IS NULL`; this collection no longer appears.
- If B opens the deep link: collection not in list → `selectedCollection` null → "Samlingen hittades inte eller du är inte längre medlem."
- If B had the group open: when B returns to the tab, Chat refetches the list; the collection is missing → redirect to `/chat` and toast "Samlingen finns inte längre eller du är inte längre medlem."

---

## 4. Collection deleted while someone is viewing

**Steps:** Owner (or admin) deletes the collection row. User A is still on the group chat screen.

**Expected:**
- No delete button in current UI; if deletion happens via SQL or future feature: collection row is gone, CASCADE removes members and messages.
- **Implemented:** When the user returns to the tab (document visibility), Chat refetches the collection list. If the current collection is no longer in the list, the app redirects to `/chat` and shows toast: "Samlingen finns inte längre eller du är inte längre medlem."
- If they don’t refocus the tab, old messages stay in state until they navigate; then list no longer includes the collection.

---

## 5. Back / browser back

**Steps:** User is in a group → presses back (browser back or in-app back).

**Expected:**
- In-app back: `handleBack()` → `setSelectedCollection(null)`, `navigate("/chat", { replace: true })` → chat list.
- Browser back from group: history may have list before it; user returns to list. If they had landed directly on `/chat/collection/:id`, one back might leave the app; ensure replace or history is consistent so back from list doesn’t reopen the group in a loop.

**Verify:** From list → open group → back → list. From list → open group → browser back → list (or one step back only).

---

## 6. Realtime: removed member still has tab open

**Steps:** User B is in the group; owner removes B (sets B’s `left_at`). B keeps the group tab open.

**Expected:**
- B’s realtime subscription stays open but new INSERTs to `collection_messages` are only visible to current members (RLS). So B won’t receive new messages in the channel callback (Supabase won’t send rows B isn’t allowed to read).
- B’s existing state still shows old messages until they navigate. No sensitive new data leaks.

---

## 7. Collections disabled via feature flag

**Steps:** `VITE_ENABLE_COLLECTIONS=false`. User opens `/chat/collection/:id`.

**Expected:**
- `useEffect` in Chat runs: `collectionIdFromUrl && !isCollectionsEnabled` → `navigate("/chat", { replace: true })`.
- Chat list is shown; no Samlingar section, no + button; GroupChatWindow never rendered for collection.

---

## Quick test checklist

- [ ] Open `/chat/collection/<random-uuid>` while logged in → "not found" (no crash, no data).
- [ ] Join a group, leave → list updates, back on list.
- [ ] Owner leaves → same; confirmation mentions "ingen ägare".
- [ ] From group, click back → list; browser back → consistent.
- [ ] With collections disabled, open `/chat/collection/:id` → redirect to `/chat`.