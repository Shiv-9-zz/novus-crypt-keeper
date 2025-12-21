-- Create challenges table for CTF challenges
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'insane')),
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 100,
  flag TEXT NOT NULL,
  hint TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  solve_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge_files table for file attachments
CREATE TABLE public.challenge_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  leader_email TEXT NOT NULL,
  team_size INTEGER NOT NULL DEFAULT 2,
  institution TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create submissions table for flag submissions
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  submitted_flag TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges (visible challenges are public, admin can manage)
CREATE POLICY "Visible challenges are viewable by everyone" 
ON public.challenges FOR SELECT 
USING (is_visible = true);

CREATE POLICY "Admins can do everything with challenges"
ON public.challenges FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for challenge_files
CREATE POLICY "Challenge files for visible challenges are public"
ON public.challenge_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.challenges 
    WHERE id = challenge_id AND is_visible = true
  )
);

CREATE POLICY "Admins can manage challenge files"
ON public.challenge_files FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for teams
CREATE POLICY "Teams are viewable by everyone"
ON public.teams FOR SELECT
USING (true);

CREATE POLICY "Anyone can create a team"
ON public.teams FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage teams"
ON public.teams FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for team_members
CREATE POLICY "Team members are viewable by everyone"
ON public.team_members FOR SELECT
USING (true);

CREATE POLICY "Anyone can add team members"
ON public.team_members FOR INSERT
WITH CHECK (true);

-- RLS Policies for submissions
CREATE POLICY "Teams can view their own submissions"
ON public.submissions FOR SELECT
USING (true);

CREATE POLICY "Anyone can submit flags"
ON public.submissions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all submissions"
ON public.submissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for admin_users
CREATE POLICY "Admins can view admin list"
ON public.admin_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Create storage bucket for challenge files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('challenge-files', 'challenge-files', true);

-- Storage policies for challenge files
CREATE POLICY "Challenge files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'challenge-files');

CREATE POLICY "Admins can upload challenge files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'challenge-files' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete challenge files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'challenge-files' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();