-- Fix the policy to allow NULL score (defaults to 0)
DROP POLICY IF EXISTS "Public team registration" ON public.teams;

CREATE POLICY "Public team registration" 
ON public.teams 
FOR INSERT 
TO authenticated
WITH CHECK (
  name IS NOT NULL AND 
  leader_name IS NOT NULL AND 
  leader_email IS NOT NULL AND 
  institution IS NOT NULL AND 
  team_id IS NOT NULL AND 
  (score = 0 OR score IS NULL)
);