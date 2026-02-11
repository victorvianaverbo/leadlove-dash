
-- Create user_tags table for CRM tagging
CREATE TABLE public.user_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  UNIQUE(user_id, tag)
);

-- Enable RLS
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;

-- Only admins can SELECT
CREATE POLICY "Admins can view all tags"
ON public.user_tags FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can INSERT
CREATE POLICY "Admins can insert tags"
ON public.user_tags FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can DELETE
CREATE POLICY "Admins can delete tags"
ON public.user_tags FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
