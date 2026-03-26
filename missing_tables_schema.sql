-- ==============================================================================
-- 3 TABELAS EM FALTA ENCONTRADAS NA ANÁLISE DO CÓDIGO
-- Execute este script no Supabase SQL Editor para completar a sua BD
-- ==============================================================================

-- 1. COMPANIES (Para gestão de Múltiplas Empresas / Inquilinos - Tenancy)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  nif TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced INTEGER DEFAULT 1
);

-- 2. INVOICES (Faturação)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  number TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'invoice',
  status TEXT NOT NULL DEFAULT 'issued',
  total_amount NUMERIC NOT NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  synced INTEGER DEFAULT 1
);

-- 3. NOTIFICATIONS (Sistema de Alertas: Stock baixo, Lotes a vencer)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'info' | 'warning' | 'error' | 'success'
  is_read BOOLEAN DEFAULT false,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  synced INTEGER DEFAULT 1
);

-- ==============================================================================
-- ÍNDICES DE PERFORMANCE PARA AS NOVAS TABELAS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(is_read) WHERE is_read = false;

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ==============================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable ALL for authenticated users only" ON public.companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.notifications FOR ALL TO authenticated USING (true);
