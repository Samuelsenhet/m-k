# Samlingar RLS Audit (Production Checklist)

## ✅ 1. Collections

| Guarantee | Policy | Status |
|-----------|--------|--------|
| Only members can `SELECT` | "Members can view collection" (collection_members with `left_at IS NULL`) | ✅ |
| Only owner can `UPDATE` | "Owner can update collection" (role = owner, left_at IS NULL) | ✅ |
| Only owner can `DELETE` | "Owner can delete collection" (created_by = auth.uid()) | ✅ |
| Non-members get no row | SELECT returns 0 rows under RLS; app shows "not found" | ✅ |

## ✅ 2. Collection members

| Guarantee | Policy | Status |
|-----------|--------|--------|
| Owner can insert | "Owner can insert members or self as owner" | ✅ |
| Members can SELECT (others in same collection) | "Members can view collection_members" | ✅ |
| Member can only UPDATE own row (e.g. `left_at`) | "Owner or self can update collection_members" | ✅ |

## ✅ 3. Collection messages

| Guarantee | Policy | Status |
|-----------|--------|--------|
| Only members can read | "Members can view collection_messages" (member + left_at IS NULL) | ✅ |
| Only members can write (text) | "Members can insert text messages" (type=text, sender_id=auth.uid(), member) | ✅ |
| `sender_id` enforced = auth.uid() | INSERT WITH CHECK sender_id = auth.uid() | ✅ |

**No metadata leak:** Messages are only visible to members; collection is only visible to members. Non-members cannot read either.

## 4. Owner leave policy (product decision)

**Current behaviour:** Owner can leave (sets `left_at`). The collection row still has `created_by` and one member row with `role = 'owner'` and `left_at` set. There is then **no active owner** (no row with role = 'owner' AND left_at IS NULL).

**Decision:** Allow owner to leave. Show a confirmation warning: "Om du lämnar har gruppen ingen ägare. Endast en ägare kan lägga till medlemmar." Future work: ownership transfer or "claim owner" for remaining members.

## 5. Realtime

- Subscriptions in `useCollectionMessages` are cleaned up on unmount (useEffect return removes channel).
- Channel name is `collection_messages:${collectionId}` so switching chats does not double-subscribe; previous effect cleanup runs before new subscription.

---

## 6. RLS re-check – attack scenarios

| Scenario | What happens |
|----------|--------------|
| **Non-member requests collection by ID** | No SELECT policy allows it; Supabase returns 0 rows. App never gets the row; list is from member-joined collections only, so non-member never has the collection in state. Deep link → list doesn’t contain it → "not found" screen. ✅ |
| **Non-member requests messages for collection_id** | SELECT on `collection_messages` requires active membership; 0 rows. ✅ |
| **Member tries INSERT message with sender_id = other user** | INSERT policy requires `sender_id = auth.uid()`. WITH CHECK fails. ✅ |
| **Member tries INSERT message type = 'system'** | INSERT policy requires `type = 'text'`. WITH CHECK fails. ✅ |
| **Non-owner tries to add a member (INSERT collection_members)** | INSERT policy: must be `user_id = auth.uid()` (self) OR existing owner. Adding another user_id requires owner; non-owner gets denied. ✅ |
| **Member tries to UPDATE another member’s row (e.g. set their left_at)** | UPDATE policy: "user_id = auth.uid() OR owner". So member can only update own row. ✅ |
| **Deleted collection** | Row gone; CASCADE removes members and messages. Any refetch returns no row; app shows not found or list no longer includes it. ✅ |
