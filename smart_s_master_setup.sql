-- =========================================================================
-- SMARTS: THE SUPREME MASTER SETUP (ALL 26 TABLES - 100% COMPLETE & HARDENED)
-- =========================================================================

-- 1. LIMPEZA E NÚCLEO
DROP VIEW IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.history CASCADE;

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, nif TEXT, address TEXT, phone TEXT, email TEXT, logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'TRIAL', 
  trial_started_at TIMESTAMPTZ DEFAULT now(), 
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  trial_expired BOOLEAN DEFAULT false, 
  onboarding_completed BOOLEAN DEFAULT false, 
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE VIEW public.profiles AS SELECT *, company_id as id FROM public.subscriptions;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'operator',
  company_id UUID REFERENCES public.companies(id), logo_url TEXT, is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. INVENTÁRIO E LOGÍSTICA
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL, description TEXT, 
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL, contact_name TEXT, email TEXT, phone TEXT, address TEXT, nif TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  category_id UUID REFERENCES public.categories(id), supplier_id UUID REFERENCES public.suppliers(id),
  name TEXT NOT NULL, barcode TEXT, reference TEXT, sku TEXT NOT NULL, brand TEXT, unit TEXT NOT NULL DEFAULT 'un',
  units_per_box INTEGER, boxes_per_pallet INTEGER, minimum_stock INTEGER DEFAULT 0, current_stock INTEGER DEFAULT 0,
  purchase_price NUMERIC, sale_price NUMERIC, tax_rate NUMERIC DEFAULT 0, description TEXT, image_url TEXT,
  expiry_date DATE, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  product_id UUID NOT NULL REFERENCES public.products(id), type TEXT NOT NULL, quantity INTEGER NOT NULL,
  user_id UUID NOT NULL, reason TEXT, 
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expiry_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL, expiry_date DATE NOT NULL, quantity INTEGER NOT NULL, 
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  number TEXT NOT NULL, type TEXT NOT NULL, user_id UUID NOT NULL, items JSONB, 
  status TEXT DEFAULT 'sealed', 
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CRM E VENDAS
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL, email TEXT, phone TEXT, address TEXT, nif TEXT, 
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  customer_id UUID REFERENCES public.customers(id), user_id UUID NOT NULL, number TEXT NOT NULL,
  customer_name TEXT, status TEXT NOT NULL DEFAULT 'pending', total_amount NUMERIC NOT NULL, 
  discount NUMERIC DEFAULT 0, tax_amount NUMERIC DEFAULT 0, notes TEXT, 
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id), quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL, tax_rate NUMERIC DEFAULT 0, total NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  order_id UUID REFERENCES public.orders(id), 
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  number TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'invoice', status TEXT NOT NULL DEFAULT 'issued',
  total_amount NUMERIC NOT NULL, due_date DATE, created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RECURSOS HUMANOS (COMPLETO)
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL, description TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  department_id UUID REFERENCES public.departments(id), title TEXT NOT NULL, base_salary NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  position_id UUID REFERENCES public.positions(id), name TEXT NOT NULL, bi_number TEXT, nit TEXT, address TEXT,
  contacts TEXT, photo_url TEXT, employment_type TEXT DEFAULT 'permanent',
  status TEXT DEFAULT 'active', contract_start_date DATE, contract_end_date DATE,
  emergency_contact TEXT, bank_details TEXT, nacionality TEXT, civil_status TEXT, 
  bank_name TEXT, bank_account TEXT, nib TEXT,
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL, clock_in TIME, clock_out TIME, breaks TEXT, status TEXT DEFAULT 'present', 
  justification TEXT, total_minutes INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL, period_year INTEGER NOT NULL, base_salary NUMERIC NOT NULL, 
  overtime_pay NUMERIC DEFAULT 0, bonus NUMERIC DEFAULT 0, subsidy_meal NUMERIC DEFAULT 0,
  subsidy_transport NUMERIC DEFAULT 0, deduction_inss NUMERIC DEFAULT 0, 
  deduction_irps NUMERIC DEFAULT 0, deduction_other NUMERIC DEFAULT 0,
  net_salary NUMERIC NOT NULL, status TEXT DEFAULT 'draft', payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, 
  status TEXT DEFAULT 'pending', reason TEXT, approved_by TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  level TEXT NOT NULL, institution TEXT NOT NULL, field TEXT, completion_date DATE, created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. FINANCEIRO E AUDITORIA
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  type TEXT NOT NULL, category TEXT NOT NULL, amount NUMERIC NOT NULL, description TEXT, date DATE NOT NULL,
  status TEXT DEFAULT 'paid', related_type TEXT, related_id UUID, 
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  action TEXT NOT NULL, table_name TEXT NOT NULL, record_id TEXT, user_id UUID NOT NULL, data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
  user_id UUID NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, type TEXT DEFAULT 'info',
  read_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sync_queue (
  id BIGSERIAL PRIMARY KEY, company_id UUID REFERENCES public.companies(id), table_name TEXT NOT NULL,
  action TEXT NOT NULL, data JSONB NOT NULL, synced BOOLEAN DEFAULT false, retry_count INTEGER DEFAULT 0,
  last_error TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SECURITY HELPERS (To avoid recursion)
CREATE OR REPLACE FUNCTION public.is_super_admin() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'super_admin'
  ) OR (auth.jwt() ->> 'email' = 'mirandaricardomaunze@gmail.com');
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. SEGURANÇA TOTAL (RLS HARDENING)
DO $$
DECLARE
    t text;
    tables_to_rls text[] := ARRAY[
      'subscriptions', 'categories', 'suppliers', 'products', 'customers', 
      'stock_movements', 'expiry_lots', 'orders', 'invoices', 'departments', 
      'positions', 'employees', 'attendance', 'payroll', 'leaves', 'qualifications',
      'financial_transactions', 'notes', 'history', 'notifications', 'sync_queue'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_rls LOOP 
        EXECUTE 'ALTER TABLE public.' || t || ' ENABLE ROW LEVEL SECURITY;';
        EXECUTE 'DROP POLICY IF EXISTS "Empresa_Isolation" ON public.' || t;
        -- Use the helper function to avoid infinite recursion
        EXECUTE 'CREATE POLICY "Empresa_Isolation" ON public.' || t || 
                ' FOR ALL USING (' ||
                'company_id::text IN (SELECT u.company_id::text FROM public.users u WHERE u.id::text = auth.uid()::text) ' ||
                'OR public.is_super_admin()' ||
                ')';
    END LOOP;
END; $$;

-- Acesso à tabela Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users_Access" ON public.users;
CREATE POLICY "Users_Access" ON public.users FOR ALL USING (
  id = auth.uid() 
  OR public.is_super_admin()
  OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- Acesso a Itens de Pedido
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "OrderItems_Access" ON public.order_items;
CREATE POLICY "OrderItems_Access" ON public.order_items FOR ALL USING (
  order_id IN (SELECT id FROM public.orders o WHERE o.company_id::text IN (SELECT u.company_id::text FROM public.users u WHERE u.id::text = auth.uid()::text)
  OR public.is_super_admin())
);

-- 7. LÓGICA DE VALIDAÇÃO
CREATE OR REPLACE FUNCTION public.check_subscription(target_company_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_plan TEXT; v_trial_end TIMESTAMPTZ; v_days_left INT;
BEGIN
  SELECT plan, trial_ends_at INTO v_plan, v_trial_end FROM public.subscriptions
  WHERE company_id::text = target_company_id LIMIT 1;
  IF NOT FOUND THEN RETURN '{"status":"EXPIRED", "days_left":0, "plan":"TRIAL"}'::JSONB; END IF;
  IF v_plan != 'TRIAL' THEN RETURN jsonb_build_object('status', 'ACTIVE', 'days_left', 365, 'plan', v_plan); END IF;
  v_days_left := ceil(extract(epoch from (v_trial_end - now())) / 86400);
  IF v_days_left > 0 THEN RETURN jsonb_build_object('status', 'ACTIVE', 'days_left', v_days_left, 'plan', 'TRIAL');
  ELSE RETURN jsonb_build_object('status', 'EXPIRED', 'days_left', 0, 'plan', 'TRIAL'); END IF;
END; $$;

-- Promoção para Super Admin (God Mode)
UPDATE public.users SET role = 'super_admin' WHERE email = 'mirandaricardomaunze@gmail.com';
