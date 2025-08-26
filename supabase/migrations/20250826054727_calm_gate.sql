/*
  # Add avatar_url column to business_cards table

  1. Changes
    - Add `avatar_url` column to `business_cards` table for storing profile images
    - Column is nullable to maintain backward compatibility

  2. Notes
    - This allows users to upload and display profile images on their business cards
    - Images will be stored in Supabase Storage and referenced by URL
*/

-- Add avatar_url column to business_cards table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_cards' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN avatar_url text;
  END IF;
END $$;