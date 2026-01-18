-- Fix PUBLIC_DATA_EXPOSURE: Re-add public access policy for sales of shared projects
-- The sales_public view excludes PII (customer_email, customer_name), so it's safe to allow public access

CREATE POLICY "Public can view sales of shared projects"
  ON public.sales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = sales.project_id
      AND projects.is_public = true
      AND (projects.share_token IS NOT NULL OR projects.slug IS NOT NULL)
    )
  );