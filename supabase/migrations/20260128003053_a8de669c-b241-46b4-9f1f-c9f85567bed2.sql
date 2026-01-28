-- Add INSERT and UPDATE policies for metrics_cache
-- Users can insert/update metrics for their own projects

CREATE POLICY "Users can insert own metrics cache"
ON public.metrics_cache
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = metrics_cache.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update own metrics cache"
ON public.metrics_cache
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = metrics_cache.project_id 
  AND projects.user_id = auth.uid()
));