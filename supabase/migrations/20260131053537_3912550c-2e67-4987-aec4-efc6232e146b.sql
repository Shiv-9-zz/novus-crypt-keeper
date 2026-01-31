-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Public team registration with validation" ON public.teams;

-- Create a PERMISSIVE INSERT policy that allows team registration
CREATE POLICY "Public team registration"
ON public.teams
FOR INSERT
TO public
WITH CHECK (
  name IS NOT NULL 
  AND leader_name IS NOT NULL 
  AND leader_email IS NOT NULL 
  AND institution IS NOT NULL 
  AND team_id IS NOT NULL 
  AND score = 0
);