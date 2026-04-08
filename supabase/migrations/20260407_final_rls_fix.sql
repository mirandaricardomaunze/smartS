-- =========================================================================
-- SMARTS: THE SUPREME MASTER SETUP (V4.5 - FINAL RECURSION BYPASS)
-- DATA: 2024-04-07 | CORREÇÃO: STRICT JWT METADATA
-- =========================================================================

-- 0. LIMPEZA TOTAL (PARA GARANTIR NOVOS TIPOS E PRIVILÉGIOS)
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_company_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_role() CASCADE;

-- 1. SECURITY HELPERS (METADATA-ONLY PARA ELIMINAR RECURSÃO)
-- Estes ajudantes NÃO consultam tabelas, evitando ciclos infinitos no RLS.
CREATE OR REPLACE FUNCTION public.is_super_admin() 
RETURNS BOOLEAN AS $$
  -- O SECURITY DEFINER e search_path são cruciais para segurança.
  SELECT (
    (auth.jwt() ->> 'email' = 'mirandaricardomaunze@gmail.com')
    OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_company_id()
RETURNS TEXT AS $$
  -- Retorna o company_id diretamente do token JWT.
  SELECT (auth.jwt() -> 'user_metadata' ->> 'company_id')::text;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
  -- Retorna a role diretamente do token JWT.
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role')::text;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. INFRAESTRUTURA (TABELAS EXISTENTES CONTINUAM IGUAIS)
-- (Omitindo criação de tabelas já existentes para brevidade, mas garantindo que campos chave existem)

-- 3. MECANISMO DE SINCRONIZAÇÃO DE METADADOS (CRUCIAL PARA O V4.5 FUNCIONAR)
-- Mantém auth.users em sincronia com public.users (company_id e role).
CREATE OR REPLACE FUNCTION public.handle_user_metadata_sync()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'company_id', NEW.company_id,
      'role', NEW.role
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_sync_user_metadata ON public.users;
CREATE TRIGGER tr_sync_user_metadata
  AFTER INSERT OR UPDATE OF company_id, role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_metadata_sync();

-- 4. BOOTSTRAP: POPULAR METADADOS EM UTILIZADORES EXISTENTES (EXECUTAR UMA VEZ)
-- Isto é o que permite que get_auth_company_id() retorne algo imediato.
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'company_id', (SELECT company_id FROM public.users WHERE public.users.id = auth.users.id LIMIT 1),
    'role', (SELECT role FROM public.users WHERE public.users.id = auth.users.id LIMIT 1)
  )
WHERE id IN (SELECT id FROM public.users);

-- 5. SEGURANÇA TOTAL (RLS REAPLICADO COM AJUDANTES NÃO-RECURSIVOS)
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
      'subscriptions', 'categories', 'suppliers', 'products', 'customers', 
      'stock_movements', 'expiry_lots', 'orders', 'order_items', 'invoices', 'notes', 
      'employees', 'attendance', 'leaves', 'payroll', 'financial_transactions', 'history', 'sync_queue'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP 
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Empresa_Isolation" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Empresa_Isolation" ON public.%I FOR ALL USING (company_id::text = public.get_auth_company_id() OR public.is_super_admin())', t);
    END LOOP;
END; $$;

-- 6. RLS ESPECIAL PARA COMPANIES E USERS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Empresa_Isolation" ON public.companies;
CREATE POLICY "Empresa_Isolation" ON public.companies FOR ALL TO authenticated USING (id::text = public.get_auth_company_id() OR public.is_super_admin());

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users_Access" ON public.users;
-- Adicionamos (id = auth.uid()) em primeiro lugar para permitir que o utilizador veja o seu próprio registo
-- mesmo que o JWT ainda não tenha o company_id (necessário para o primeiro login).
CREATE POLICY "Users_Access" ON public.users 
FOR ALL TO authenticated 
USING (
  id = auth.uid() 
  OR company_id::text = public.get_auth_company_id() 
  OR public.is_super_admin() 
  OR public.get_auth_role() = 'admin'
);

-- 7. GARANTIR SUPER ADMIN
UPDATE public.users SET role = 'super_admin' WHERE email = 'mirandaricardomaunze@gmail.com';
