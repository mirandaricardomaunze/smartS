-- =========================================================================
-- SMARTS: CONFIGURAÇÃO DE SEGURANÇA E SUBSCRIÇÕES PROFISSIONAIS NO SUPABASE
-- =========================================================================

-- 1. TABELA PROFILES (Gestão Central de Subscrições)
-- O client usa esta tabela para consultar o plano e gerir o período Trial remotamente
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE, -- ID igual à empresa
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  plan TEXT DEFAULT 'TRIAL',
  trial_start TIMESTAMPTZ DEFAULT now(),
  trial_end TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Segurança RLS na tabela Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de Perfis" ON public.profiles;
CREATE POLICY "Leitura de Perfis" ON public.profiles
  FOR SELECT USING (
    company_id::text IN (SELECT company_id::text FROM public.users WHERE users.id::text = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM public.users WHERE users.id::text = auth.uid()::text AND role = 'admin')
  );

DROP POLICY IF EXISTS "Actualização de Perfis" ON public.profiles;
CREATE POLICY "Actualização de Perfis" ON public.profiles
  FOR UPDATE USING (
    company_id::text IN (SELECT company_id::text FROM public.users WHERE users.id::text = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM public.users WHERE users.id::text = auth.uid()::text AND role = 'admin')
  );


-- 2. FUNÇÃO CHECK_SUBSCRIPTION (Validação Blindada no Servidor)
-- Bloqueia a possibilidade de clientes forçarem o relógio do telemóvel para evitar expirar o Trial
CREATE OR REPLACE FUNCTION public.check_subscription(target_company_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
  v_trial_end TIMESTAMPTZ;
  v_days_left INT;
BEGIN
  -- Procurar plano actual
  SELECT plan, trial_end INTO v_plan, v_trial_end
  FROM public.profiles
  WHERE company_id::text = target_company_id OR id::text = target_company_id
  LIMIT 1;

  -- Se não existir perfil, considera bloqueado
  IF NOT FOUND THEN
    RETURN '{"status":"EXPIRED", "days_left":0, "plan":"TRIAL"}'::JSONB;
  END IF;

  -- Planos pagos ignoram os dias
  IF v_plan != 'TRIAL' THEN
    RETURN jsonb_build_object('status', 'ACTIVE', 'days_left', 365, 'plan', v_plan);
  END IF;

  -- Calcular dias de Trial reais usando o relógio militar do Servidor
  v_days_left := ceil(extract(epoch from (v_trial_end - now())) / 86400);

  IF v_days_left > 0 THEN
    RETURN jsonb_build_object('status', 'ACTIVE', 'days_left', v_days_left, 'plan', 'TRIAL');
  ELSE
    RETURN jsonb_build_object('status', 'EXPIRED', 'days_left', 0, 'plan', 'TRIAL');
  END IF;
END;
$$;


-- 3. GATILHO SUPER-ADMINISTRADOR: AUTO-PERFIL
-- Quando a app sincroniza uma nova Empresa, cria automaticamente o balcão de Subscrição dela
CREATE OR REPLACE FUNCTION public.handle_new_company_sync()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, company_id, name, email, plan, trial_start, trial_end)
  VALUES (
    NEW.id, 
    NEW.id, 
    NEW.name, 
    NEW.email, 
    'TRIAL', 
    NEW.created_at, 
    NEW.created_at + interval '30 days'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_company_created ON public.companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_company_sync();


-- 4. O TEU ACESSO ADMIN
-- Garante que o teu perfil manda em tudo!
UPDATE public.users SET role = 'admin' WHERE email = 'mirandaricardomaunze@gmail.com';
