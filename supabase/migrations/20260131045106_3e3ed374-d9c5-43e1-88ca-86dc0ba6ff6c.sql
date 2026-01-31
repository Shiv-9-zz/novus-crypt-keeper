-- Fix remaining permissive INSERT policies

-- Fix submissions: Remove the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can submit flags" ON public.submissions;

-- Create a more secure submission policy with proper type handling
CREATE POLICY "Valid submissions only"
ON public.submissions
FOR INSERT
WITH CHECK (
  -- Ensure the team exists
  EXISTS (SELECT 1 FROM public.teams t WHERE t.id = submissions.team_id)
  AND
  -- Ensure the challenge exists and is visible
  EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = submissions.challenge_id AND c.is_visible = true AND c.is_locked = false)
);

-- Fix teams: The INSERT policy is needed for registration but add basic validation
DROP POLICY IF EXISTS "Anyone can create a team" ON public.teams;

-- Create a more constrained team creation policy
CREATE POLICY "Public team registration with validation"
ON public.teams
FOR INSERT
WITH CHECK (
  -- Ensure required fields are provided
  name IS NOT NULL 
  AND leader_name IS NOT NULL 
  AND leader_email IS NOT NULL 
  AND institution IS NOT NULL
  AND team_id IS NOT NULL
  -- Prevent score manipulation on creation
  AND score = 0
);