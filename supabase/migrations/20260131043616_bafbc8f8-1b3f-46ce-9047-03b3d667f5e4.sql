-- Drop existing storage policies for challenge-files bucket
DROP POLICY IF EXISTS "Challenge files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload challenge files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete challenge files" ON storage.objects;

-- Create new storage policies using the is_admin function for consistency
CREATE POLICY "Challenge files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'challenge-files');

CREATE POLICY "Admins can upload challenge files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'challenge-files' 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update challenge files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'challenge-files' 
  AND public.is_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'challenge-files' 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can delete challenge files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'challenge-files' 
  AND public.is_admin(auth.uid())
);