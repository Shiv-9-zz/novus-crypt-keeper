-- Drop the existing public SELECT policy on teams
DROP POLICY IF EXISTS "Teams are publicly viewable" ON public.teams;

-- Create new SELECT policy that only allows admins to directly query the table
-- Public users must use the get_public_teams() function which doesn't expose emails
CREATE POLICY "Only admins can view teams directly"
ON public.teams
FOR SELECT
USING (is_admin(auth.uid()));

-- Note: The get_public_teams() function uses SECURITY DEFINER so it bypasses RLS
-- and returns only non-sensitive fields (no leader_email) for the leaderboard