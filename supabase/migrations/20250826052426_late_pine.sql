/*
  # Create social links table

  1. New Tables
    - `social_links`
      - `id` (uuid, primary key)
      - `card_id` (uuid, foreign key to business_cards)
      - `platform` (text, social media platform name)
      - `username` (text, username on platform)
      - `url` (text, full URL to profile)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `social_links` table
    - Add policy for users to manage social links for their own cards
    - Add policy for admins to read all social links
*/

-- Create social links table
CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES business_cards(id) ON DELETE CASCADE,
  platform text NOT NULL,
  username text,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

-- Allow users to read social links for their own business cards
CREATE POLICY "Users can read own social links"
  ON social_links
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_cards
      WHERE business_cards.id = social_links.card_id
      AND business_cards.user_id = auth.uid()
    )
  );

-- Allow users to create social links for their own business cards
CREATE POLICY "Users can create own social links"
  ON social_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_cards
      WHERE business_cards.id = social_links.card_id
      AND business_cards.user_id = auth.uid()
    )
  );

-- Allow users to update social links for their own business cards
CREATE POLICY "Users can update own social links"
  ON social_links
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_cards
      WHERE business_cards.id = social_links.card_id
      AND business_cards.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_cards
      WHERE business_cards.id = social_links.card_id
      AND business_cards.user_id = auth.uid()
    )
  );

-- Allow users to delete social links for their own business cards
CREATE POLICY "Users can delete own social links"
  ON social_links
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_cards
      WHERE business_cards.id = social_links.card_id
      AND business_cards.user_id = auth.uid()
    )
  );

-- Allow admins to read all social links (using security definer function)
CREATE POLICY "Admins can read all social links"
  ON social_links
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));