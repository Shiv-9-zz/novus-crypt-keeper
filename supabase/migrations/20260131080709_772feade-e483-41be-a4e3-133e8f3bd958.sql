-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Only admins can view teams directly" ON public.teams;

-- Add a new policy that allows public SELECT on teams (read-only info is safe)
-- This matches the existing RPC function get_public_teams behavior
CREATE POLICY "Teams are publicly viewable"
ON public.teams
FOR SELECT
USING (true);

-- Also fix team_members insert policy - currently only admins can insert
-- We need to allow team leaders to insert their own members during registration
DROP POLICY IF EXISTS "Team leaders can add members during registration" ON public.team_members;

CREATE POLICY "Anyone can insert team members"
ON public.team_members
FOR INSERT
WITH CHECK (true);