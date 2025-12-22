-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;

-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
  )
$$;

-- Create a simple policy that allows authenticated users to check their own admin status
CREATE POLICY "Users can check their own admin status"
ON public.admin_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Update other policies that reference admin_users to use the function
DROP POLICY IF EXISTS "Admins can do everything with challenges" ON public.challenges;
CREATE POLICY "Admins can do everything with challenges"
ON public.challenges
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage challenge files" ON public.challenge_files;
CREATE POLICY "Admins can manage challenge files"
ON public.challenge_files
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all submissions" ON public.submissions;
CREATE POLICY "Admins can view all submissions"
ON public.submissions
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage teams" ON public.teams;
CREATE POLICY "Admins can manage teams"
ON public.teams
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));