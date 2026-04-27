-- Client-side code in PhotoUploadRN upserts with
--   onConflict: "user_id,display_order"
-- but profile_photos had no matching unique constraint, so the upsert
-- fails with "there is no unique or exclusion constraint matching the
-- ON CONFLICT specification". Add the constraint to make intent explicit
-- and match client expectations.

-- Safety: drop any duplicate (user_id, display_order) rows first, keeping
-- the most recent one, so the ADD CONSTRAINT won't fail.
DELETE FROM public.profile_photos a
USING public.profile_photos b
WHERE a.user_id = b.user_id
  AND a.display_order = b.display_order
  AND a.ctid < b.ctid;

ALTER TABLE public.profile_photos
  ADD CONSTRAINT profile_photos_user_id_display_order_unique
  UNIQUE (user_id, display_order);
