-- Drop the insecure view first
DROP VIEW IF EXISTS public.challenges_public;

-- Create a separate table for challenge flags (only admins can access)
CREATE TABLE public.challenge_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL UNIQUE,
  flag text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.challenge_flags ENABLE ROW LEVEL SECURITY;

-- Only admins can access flags table
CREATE POLICY "Only admins can view flags"
ON public.challenge_flags
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can manage flags"
ON public.challenge_flags
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Migrate existing flags to the new table
INSERT INTO public.challenge_flags (challenge_id, flag)
SELECT id, flag FROM public.challenges;

-- Now we can drop the flag column from challenges table
-- But first update the RLS policy
DROP POLICY IF EXISTS "Non-admins can view visible challenges without flags" ON public.challenges;

CREATE POLICY "Visible challenges are viewable by everyone"
ON public.challenges
FOR SELECT
USING (is_visible = true OR is_admin(auth.uid()));

-- Remove the flag column from challenges table (it's now in challenge_flags)
ALTER TABLE public.challenges DROP COLUMN flag;