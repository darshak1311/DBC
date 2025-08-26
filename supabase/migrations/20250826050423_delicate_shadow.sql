/*
  # Create business cards table

  1. New Tables
    - `business_cards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text, job title)
      - `company` (text, company name)
      - `phone` (text, phone number)
      - `email` (text, email address)
      - `website` (text, website URL)
      - `theme` (jsonb, theme configuration)
      - `shape` (text, card shape - default 'rectangle')
      - `layout` (jsonb, layout configuration)
      - `is_published` (boolean, publication status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `business_cards` table
    - Add policy for users to manage their own business cards
    - Add policy for admins to read all business cards
*/

-- Create business cards table
CREATE TABLE IF NOT EXISTS business_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text,
  company text,
  phone text,
  email text,
  website text,
  theme jsonb DEFAULT '{"primary": "#3B82F6", "secondary": "#1E40AF", "background": "#FFFFFF", "text": "#1F2937"}',
  shape text DEFAULT 'rectangle' NOT NULL,
  layout jsonb DEFAULT '{"style": "modern", "alignment": "center"}',
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own business cards
CREATE POLICY "Users can read own business cards"
  ON business_cards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to create their own business cards
CREATE POLICY "Users can create own business cards"
  ON business_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own business cards
CREATE POLICY "Users can update own business cards"
  ON business_cards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own business cards
CREATE POLICY "Users can delete own business cards"
  ON business_cards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins to read all business cards
CREATE POLICY "Admins can read all business cards"
  ON business_cards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_business_cards_updated_at
  BEFORE UPDATE ON business_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();