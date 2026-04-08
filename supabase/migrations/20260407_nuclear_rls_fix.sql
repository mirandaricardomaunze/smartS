-- =========================================================================
-- SMARTS: NUCLEAR RLS FIX (V5.0)
-- Drops ALL policies on ALL tables, recreates using JWT-only helpers.
-- No table queries in any policy or helper → zero recursion possible.
-- =========================================================================

-- 1. RECREATE HELPERS (JWT-ONLY, NO TABLE READS)
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_company_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_role() CASCADE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT (
    (auth.jwt() ->> 'email' = 'mirandaricardomaunze@gmail.com')
    OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_company_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'company_id',
    auth.jwt() -> 'app_metadata' ->> 'company_id'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. NUCLEAR DROP: Remove ALL existing policies on ALL app tables
DO $$
DECLARE
    r record;
    all_tables text[] := ARRAY[
      'users', 'companies', 'subscriptions', 'categories', 'suppliers',
      'products', 'customers', 'stock_movements', 'expiry_lots', 'orders',
      'order_items', 'invoices', 'notes', 'employees', 'attendance', 'leaves',
      'payroll', 'financial_transactions', 'history', 'sync_queue'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY all_tables LOOP
        FOR r IN
            SELECT policyname
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = t
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
            RAISE NOTICE 'Dropped policy % on %', r.policyname, t;
        END LOOP;
    END LOOP;
END; $$;

-- 3. ENABLE RLS + RECREATE CLEAN POLICIES

-- Standard company-isolated tables
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
      'subscriptions', 'categories', 'suppliers', 'products', 'customers',
      'stock_movements', 'expiry_lots', 'orders', 'order_items', 'invoices',
      'notes', 'employees', 'attendance', 'leaves', 'payroll',
      'financial_transactions', 'history', 'sync_queue'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format(
          'CREATE POLICY "company_isolation" ON public.%I
           FOR ALL TO authenticated
           USING (
             company_id::text = public.get_auth_company_id()
             OR public.is_super_admin()
           )',
          t
        );
    END LOOP;
END; $$;

-- companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_isolation" ON public.companies
  FOR ALL TO authenticated
  USING (
    id::text = public.get_auth_company_id()
    OR public.is_super_admin()
  );

-- users table (allow own row always; company members; admins; super admin)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_access" ON public.users
  FOR ALL TO authenticated
  USING (
    id = auth.uid()
    OR company_id::text = public.get_auth_company_id()
    OR public.get_auth_role() IN ('admin', 'super_admin')
    OR public.is_super_admin()
  );

-- 4. SYNC TRIGGER: keep JWT metadata in sync when users table changes
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

-- 5. BOOTSTRAP: populate JWT metadata for all existing users
UPDATE auth.users au
SET raw_user_meta_data =
  COALESCE(raw_user_meta_data, '{}'::jsonb) ||
  jsonb_build_object(
    'company_id', pu.company_id,
    'role', pu.role
  )
FROM public.users pu
WHERE au.id = pu.id
  AND pu.company_id IS NOT NULL;

-- 6. ENSURE SUPER ADMIN ROLE
UPDATE public.users
SET role = 'super_admin'
WHERE email = 'mirandaricardomaunze@gmail.com';
