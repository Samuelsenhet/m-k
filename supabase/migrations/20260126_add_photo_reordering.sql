-- Migration: Add photo reordering functionality
-- US-012: Enable drag-to-reorder for profile photos

-- Ensure display_order column exists with proper default
-- (It already exists but let's ensure proper configuration)
DO $$
BEGIN
    -- Add display_order column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profile_photos' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE profile_photos ADD COLUMN display_order integer DEFAULT 0;
    END IF;
END $$;

-- Create index on user_id and display_order for efficient reordering queries
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_order
ON profile_photos(user_id, display_order);

-- Create a function to update photo order atomically
-- This ensures all display_order values are updated in a single transaction
CREATE OR REPLACE FUNCTION update_photo_order(
    p_user_id uuid,
    p_photo_orders jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    photo_record jsonb;
BEGIN
    -- Verify the user owns all the photos being reordered
    IF EXISTS (
        SELECT 1 FROM jsonb_array_elements(p_photo_orders) AS elem
        WHERE NOT EXISTS (
            SELECT 1 FROM profile_photos
            WHERE id = (elem->>'id')::uuid
            AND user_id = p_user_id
        )
    ) THEN
        RAISE EXCEPTION 'User does not own all photos being reordered';
    END IF;

    -- Update display_order for each photo
    FOR photo_record IN SELECT * FROM jsonb_array_elements(p_photo_orders)
    LOOP
        UPDATE profile_photos
        SET display_order = (photo_record->>'display_order')::integer
        WHERE id = (photo_record->>'id')::uuid
        AND user_id = p_user_id;
    END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_photo_order(uuid, jsonb) TO authenticated;

-- Add comment documenting the function
COMMENT ON FUNCTION update_photo_order IS 'Atomically update display_order for multiple photos. Used for drag-to-reorder functionality.';
