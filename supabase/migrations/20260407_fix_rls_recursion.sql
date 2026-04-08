-- ==============================================================================
-- FIX: Infinite Recursion & Schema Mismatch
-- Instructions: Run this in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Standardize Table Name: movements -> stock_movements
-- (SQLite uses stock_movements, Supabase earlier script used movements)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'movements') THEN
    ALTER TABLE public.movements RENAME TO stock_movements;
  END IF;
END $$;

-- 2. Add Missing updated_at Columns
DO $$ BEGIN
  ALTER TABLE public.stock_movements ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.notes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 3. Trigger for updated_at (ensure it exists and is applied to all tables)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables that should have updated_at
DO $$ DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','categories','suppliers','customers','products',
    'stock_movements','expiry_lots','orders','financial_transactions',
    'notes','history','companies','employees','attendance','leaves','payroll'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS tr_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER tr_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t);
  END LOOP;
END $$;

-- 4. Fix RLS Recursion (Use auth.jwt() for company_id)
-- This avoids calling get_my_company_id() which queries the users table.
-- Note: Requires company_id to be in user_metadata or app_metadata.
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  -- First try to get from JWT metadata (fastest, no recursion)
  -- Second fallback to query user table only if not in JWT
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'company_id'),
    (SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1)
  )
$$;

-- 5. Harden RLS policies for common tables
-- We drop and recreate to ensure they use the fixed get_my_company_id()
DO $$ DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','categories','suppliers','customers','products',
    'stock_movements','expiry_lots','orders','order_items',
    'financial_transactions','notes','history','companies',
    'employees','attendance','leaves','payroll'
  ]) LOOP
    -- Drop old policies
    EXECUTE format('DROP POLICY IF EXISTS "tenant_%I" ON public.%I', t, t);
    
    -- Special case for companies table (using id instead of company_id)
    IF t = 'companies' THEN
      EXECUTE format('CREATE POLICY "tenant_%I" ON public.%I FOR ALL TO authenticated USING (id = public.get_my_company_id()) WITH CHECK (id = public.get_my_company_id())', t, t);
    ELSE
      EXECUTE format('CREATE POLICY "tenant_%I" ON public.%I FOR ALL TO authenticated USING (company_id = public.get_my_company_id()) WITH CHECK (company_id = public.get_my_company_id())', t, t);
    END IF;
  END LOOP;
END $$;

-- 6. Helper to sync company_id to Auth Metadata (RUN ONCE)
-- This ensures the recursion fix works immediately.
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || 
  jsonb_build_object('company_id', (SELECT company_id FROM public.users WHERE public.users.id = auth.users.id LIMIT 1))
WHERE id IN (SELECT id FROM public.users WHERE company_id IS NOT NULL);
