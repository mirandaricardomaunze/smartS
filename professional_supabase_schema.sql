-- ==============================================================================
-- SUPABASE PROFESSIONAL SCHEMA PARA SMARTS INVENTORY
-- Execute este script inteiro no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. EXTENSIONS (Para UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, -- Referência direta a auth.users.id do Supabase
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'operator',
  company TEXT,
  logo_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced INTEGER DEFAULT 1
);

-- 3. CATEGORIES (Categorias de produtos)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced INTEGER DEFAULT 1
);

-- 4. SUPPLIERS (Fornecedores)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  nif TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced INTEGER DEFAULT 1
);

-- 5. CUSTOMERS (Clientes)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  nif TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced INTEGER DEFAULT 1
);

-- 6. PRODUCTS (Produtos consolidados)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  barcode TEXT,
  sku TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  category TEXT, -- Legado para compatibilidade SQLite
  brand TEXT,
  unit TEXT NOT NULL DEFAULT 'un',
  units_per_box INTEGER,
  boxes_per_pallet INTEGER,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  purchase_price NUMERIC,
  sale_price NUMERIC,
  tax_rate NUMERIC,
  description TEXT,
  image_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced INTEGER DEFAULT 1
);

-- 7. MOVEMENTS (Movimentações de Stock)
CREATE TABLE IF NOT EXISTS public.movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'entry' | 'exit' | 'transfer' | 'adjustment'
  quantity INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  synced INTEGER DEFAULT 1
);

-- 8. EXPIRY LOTS (Lotes de Validade)
CREATE TABLE IF NOT EXISTS public.expiry_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced INTEGER DEFAULT 1
);

-- 9. ORDERS / PEDIDOS (Vendas ou Encomendas)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced INTEGER DEFAULT 1
);

-- 10. ORDER ITEMS (Itens do Pedido)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  tax_rate NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  synced INTEGER DEFAULT 1
);

-- 11. FINANCIAL TRANSACTIONS (Fluxo de Caixa)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'income' | 'expense'
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'cancelled'
  related_type TEXT, -- ex 'order', 'purchase'
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  synced INTEGER DEFAULT 1
);

-- 12. NOTES (Guias Rascunho / Picking Notes)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number TEXT NOT NULL,
  type TEXT NOT NULL, -- 'entry' | 'exit' | 'transfer'
  user_id UUID NOT NULL REFERENCES public.users(id),
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  synced INTEGER DEFAULT 1
);

-- 13. HISTORY (Logs de Auditoria)
CREATE TABLE IF NOT EXISTS public.history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_movements_product ON public.movements(product_id);
CREATE INDEX IF NOT EXISTS idx_expiry_lots_product ON public.expiry_lots(product_id);
CREATE INDEX IF NOT EXISTS idx_expiry_lots_date ON public.expiry_lots(expiry_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_financial_date ON public.financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_history_table ON public.history(table_name);

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expiry_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

-- Permitir leitura e gravação universal a utilizadores autenticados
CREATE POLICY "Enable ALL for authenticated users only" ON public.users FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.products FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.expiry_lots FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.order_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.financial_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.notes FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.history FOR ALL TO authenticated USING (true);
