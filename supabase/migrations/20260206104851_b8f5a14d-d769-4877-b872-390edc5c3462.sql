-- Fase 1: Políticas RLS para acesso administrativo

-- Tabela projects: Admin pode ver todos os projetos
CREATE POLICY "Admins can view all projects"
ON public.projects FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Tabela sales: Admin pode ver todas as vendas
CREATE POLICY "Admins can view all sales"
ON public.sales FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Tabela ad_spend: Admin pode ver todos os gastos
CREATE POLICY "Admins can view all ad_spend"
ON public.ad_spend FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Tabela integrations: Admin pode ver todas as integrações
CREATE POLICY "Admins can view all integrations"
ON public.integrations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Tabela integrations: Admin pode atualizar integrações (para debug)
CREATE POLICY "Admins can update all integrations"
ON public.integrations FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Tabela profiles: Admin pode ver todos os perfis (para listar nomes dos clientes)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));