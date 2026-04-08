-- 1. Profiles Table (Linked to Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  plan text DEFAULT 'TRIAL', -- TRIAL, BASIC, PRO, ELITE
  trial_start timestamp with time zone DEFAULT now(),
  trial_end timestamp with time zone DEFAULT (now() + interval '30 days'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Subscriptions Table (Payments Tracking & Stripe Prep)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan text NOT NULL,
  status text NOT NULL, -- active, trailing, canceled, incomplete
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  stripe_subscription_id text,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can only view their own profile." 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can only update their own profile." 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can view their own subscriptions." 
  ON public.subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- 5. Trigger for New User Profile & Trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan, trial_start, trial_end)
  VALUES (new.id, new.email, 'TRIAL', now(), now() + interval '30 days');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RPC Function for Subscription Check
-- Returns: {"status": "ACTIVE" | "EXPIRED", "days_left": number, "plan": text}
CREATE OR REPLACE FUNCTION public.check_subscription(target_user_id uuid)
RETURNS json AS $$
DECLARE
  prof_plan text;
  prof_trial_end timestamp with time zone;
  days_remaining integer;
  result_status text;
BEGIN
  SELECT plan, trial_end INTO prof_plan, prof_trial_end
  FROM public.profiles
  WHERE id = target_user_id;

  days_remaining := EXTRACT(DAY FROM (prof_trial_end - now()))::integer;

  IF prof_plan = 'TRIAL' THEN
    IF days_remaining > 0 THEN
      result_status := 'ACTIVE';
    ELSE
      result_status := 'EXPIRED';
      days_remaining := 0;
    END IF;
  ELSE
    -- For BASIC and PRO, check active subscriptions
    -- Logic can be expanded for Stripe validation here
    result_status := 'ACTIVE'; 
    days_remaining := 999; -- Placeholder for paid plans
  END IF;

  RETURN json_build_object(
    'status', result_status,
    'days_left', days_remaining,
    'plan', prof_plan
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
