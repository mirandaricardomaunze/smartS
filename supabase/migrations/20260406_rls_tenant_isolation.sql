-- ==============================================================================
-- MIGRAÇÃO: Isolamento por Empresa (RLS Multi-Tenant)
-- Executar no Supabase SQL Editor APÓS professional_supabase_schema.sql
-- ==============================================================================

-- 1. ADICIONAR company_id ÀS TABELAS QUE NÃO TÊM
-- (Idempotente — ignora se coluna já existir)
DO $$ BEGIN
  ALTER TABLE public.users        ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.categories   ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.suppliers    ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.customers    ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.products     ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.movements    ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.expiry_lots  ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.orders       ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.order_items  ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.financial_transactions ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.notes        ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.history      ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ==============================================================================
-- 2. TABELA DE EMPRESAS (companies)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  nif         TEXT,
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  synced      INTEGER DEFAULT 1
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. FUNÇÃO HELPER: Devolve o company_id do utilizador autenticado
-- Usa a tabela users (que tem company_id) para resolver o isolamento.
-- SECURITY DEFINER = corre com privilégios do owner, não do chamador.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1
$$;

-- ==============================================================================
-- 4. REMOVER POLÍTICAS PERMISSIVAS ANTIGAS
-- ==============================================================================
DO $$ DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','categories','suppliers','customers','products',
    'movements','expiry_lots','orders','order_items',
    'financial_transactions','notes','history','companies'
  ]) LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.%I',
      t
    );
  END LOOP;
END $$;

-- ==============================================================================
-- 5. NOVAS POLÍTICAS RLS — ISOLAMENTO POR EMPRESA
-- Cada utilizador só acede aos dados da sua empresa.
-- ==============================================================================

-- COMPANIES: utilizador vê apenas a sua empresa
CREATE POLICY "tenant_companies" ON public.companies
  FOR ALL TO authenticated
  USING (id = public.get_my_company_id())
  WITH CHECK (id = public.get_my_company_id());

-- USERS: utilizador vê apenas colegas da mesma empresa
CREATE POLICY "tenant_users" ON public.users
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- CATEGORIES
CREATE POLICY "tenant_categories" ON public.categories
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- SUPPLIERS
CREATE POLICY "tenant_suppliers" ON public.suppliers
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- CUSTOMERS
CREATE POLICY "tenant_customers" ON public.customers
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- PRODUCTS
CREATE POLICY "tenant_products" ON public.products
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- MOVEMENTS
CREATE POLICY "tenant_movements" ON public.movements
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- EXPIRY_LOTS
CREATE POLICY "tenant_expiry_lots" ON public.expiry_lots
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ORDERS
CREATE POLICY "tenant_orders" ON public.orders
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ORDER_ITEMS (herdado do order via company_id)
CREATE POLICY "tenant_order_items" ON public.order_items
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- FINANCIAL_TRANSACTIONS
CREATE POLICY "tenant_financial_transactions" ON public.financial_transactions
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- NOTES
CREATE POLICY "tenant_notes" ON public.notes
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- HISTORY (audit log — só leitura para non-admins está no RBAC da app)
CREATE POLICY "tenant_history" ON public.history
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ==============================================================================
-- 6. PROFILES — já tem RLS própria, mas garantir que company_id existe
-- ==============================================================================
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN name TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- A política de profiles já existe (user só vê o seu próprio profile)
-- Apenas garantir que a subscription check function usa company_id

-- ==============================================================================
-- 7. ACTUALIZAR check_subscription PARA USAR company_id
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_subscription(target_company_id TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prof_plan       TEXT;
  prof_trial_end  TIMESTAMPTZ;
  days_remaining  INTEGER;
  result_status   TEXT;
BEGIN
  -- Verificar se o utilizador tem acesso a esta empresa
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND company_id = target_company_id
  ) THEN
    RAISE EXCEPTION 'Acesso negado à empresa: %', target_company_id;
  END IF;

  -- Obter plano da empresa (via profiles ligado à empresa)
  SELECT p.plan, p.trial_end
  INTO prof_plan, prof_trial_end
  FROM public.profiles p
  WHERE p.company_id = target_company_id
  ORDER BY p.updated_at DESC
  LIMIT 1;

  -- Fallback para trial se não encontrar
  IF prof_plan IS NULL THEN
    prof_plan := 'TRIAL';
    prof_trial_end := now() + interval '30 days';
  END IF;

  days_remaining := GREATEST(0, EXTRACT(DAY FROM (prof_trial_end - now()))::INTEGER);

  IF prof_plan = 'TRIAL' THEN
    result_status := CASE WHEN days_remaining > 0 THEN 'ACTIVE' ELSE 'EXPIRED' END;
  ELSE
    -- Planos pagos: verificar subscriptions activas
    IF EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE company_id = target_company_id
        AND status = 'active'
        AND (current_period_end IS NULL OR current_period_end > now())
    ) THEN
      result_status := 'ACTIVE';
      days_remaining := 999;
    ELSE
      result_status := 'EXPIRED';
      days_remaining := 0;
    END IF;
  END IF;

  RETURN json_build_object(
    'status',    result_status,
    'days_left', days_remaining,
    'plan',      prof_plan
  );
END;
$$;

-- ==============================================================================
-- 8. SUBSCRIPTIONS — adicionar company_id e RLS por empresa
-- ==============================================================================
DO $$ BEGIN
  ALTER TABLE public.subscriptions ADD COLUMN company_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.subscriptions ADD COLUMN stripe_customer_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Política subscriptions (utilizador só vê subscrições da sua empresa)
DROP POLICY IF EXISTS "Users can view their own subscriptions." ON public.subscriptions;
CREATE POLICY "tenant_subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ==============================================================================
-- 9. ÍNDICES DE PERFORMANCE PARA company_id
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_company        ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company     ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company       ON public.orders(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company    ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company    ON public.suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_movements_company    ON public.movements(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_company    ON public.financial_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company     ON public.profiles(company_id);

-- ==============================================================================
-- FIM DA MIGRAÇÃO
-- Após aplicar, testar com:
--   SELECT public.get_my_company_id(); -- Deve retornar o company_id do user autenticado
-- ==============================================================================
