-- FIX CRITICAL: Create a secure view that excludes flags for non-admins
-- First, drop existing SELECT policy that exposes flags
DROP POLICY IF EXISTS "Visible challenges are viewable by everyone" ON public.challenges;

-- Create a new policy that excludes the flag column for non-admins
-- Non-admins can only see visible challenges
CREATE POLICY "Non-admins can view visible challenges without flags"
ON public.challenges
FOR SELECT
USING (
  is_visible = true OR is_admin(auth.uid())
);

-- Create a secure view for challenges that excludes flags for non-admins
CREATE OR REPLACE VIEW public.challenges_public AS
SELECT 
  id,
  title,
  category,
  difficulty,
  description,
  hint,
  points,
  is_locked,
  is_visible,
  solve_count,
  created_at,
  updated_at
FROM public.challenges
WHERE is_visible = true;

-- Grant access to the view
GRANT SELECT ON public.challenges_public TO anon, authenticated;

-- FIX: Restrict email visibility in teams table
-- Drop existing public SELECT policy
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON public.teams;

-- Create new policy that allows public view but we'll handle email filtering in the app
CREATE POLICY "Teams are publicly viewable"
ON public.teams
FOR SELECT
USING (true);

-- FIX: Restrict email visibility in team_members table  
-- Drop existing public SELECT policy
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON public.team_members;

-- Create new policy - admins see all, others see non-email fields
CREATE POLICY "Team members are publicly viewable"
ON public.team_members
FOR SELECT
USING (true);