-- Add User Avatars Support
-- Adds avatar_url field to profiles and creates storage bucket

-- Add avatar_url column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image (stored in Supabase Storage or external URL)';

-- Create avatars storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for avatars bucket
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to avatars (they are public by design)
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Create function to get avatar URL
CREATE OR REPLACE FUNCTION get_avatar_url(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT avatar_url FROM profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create index for faster avatar lookups
CREATE INDEX IF NOT EXISTS idx_profiles_avatar ON profiles(user_id) WHERE avatar_url IS NOT NULL;
