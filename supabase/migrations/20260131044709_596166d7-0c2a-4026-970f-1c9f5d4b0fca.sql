-- Fix submissions table policies
-- Remove overly permissive SELECT policy
DROP POLICY IF EXISTS "Teams can view their own submissions" ON public.submissions;

-- Create a more restrictive SELECT policy - admins only can view all submissions
-- (Teams don't have auth accounts, so we can't restrict by team)
CREATE POLICY "Only admins can view submissions"
ON public.submissions
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Fix team_members table policies
-- Remove overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can add team members" ON public.team_members;

-- Add admin management policy for team_members
CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Keep public SELECT for team display but add admin UPDATE/DELETE
CREATE POLICY "Admins can update team members"
ON public.team_members
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete team members"
ON public.team_members
FOR DELETE
USING (public.is_admin(auth.uid()));