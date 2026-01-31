-- Create a security definer function to get teams without sensitive data for non-admins
CREATE OR REPLACE FUNCTION public.get_public_teams()
RETURNS TABLE (
  id uuid,
  team_id text,
  name text,
  institution text,
  score integer,
  leader_name text,
  team_size integer,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.team_id,
    t.name,
    t.institution,
    t.score,
    t.leader_name,
    t.team_size,
    t.created_at
  FROM public.teams t
  ORDER BY t.score DESC
$$;

-- Create a security definer function to get team members without emails for non-admins  
CREATE OR REPLACE FUNCTION public.get_public_team_members(p_team_id uuid)
RETURNS TABLE (
  id uuid,
  team_id uuid,
  name text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tm.id,
    tm.team_id,
    tm.name,
    tm.created_at
  FROM public.team_members tm
  WHERE tm.team_id = p_team_id
$$;

-- Update submissions INSERT policy to require team validation through edge function
-- Drop existing permissive insert policy
DROP POLICY IF EXISTS "Valid submissions only" ON public.submissions;

-- Create stricter policy - only edge function with service role can insert
-- This prevents direct client-side submissions
CREATE POLICY "Submissions only via edge function"
ON public.submissions
FOR INSERT
WITH CHECK (
  -- Only admins can insert directly (for testing purposes)
  -- All other submissions must go through the verify-flag edge function which uses service role
  is_admin(auth.uid())
);