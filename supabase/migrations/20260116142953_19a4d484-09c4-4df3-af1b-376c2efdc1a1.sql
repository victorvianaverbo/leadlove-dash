-- Remove a constraint problemática que impede integrações em múltiplos projetos
ALTER TABLE public.integrations 
  DROP CONSTRAINT IF EXISTS integrations_user_id_type_key;