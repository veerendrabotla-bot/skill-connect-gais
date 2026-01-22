
-- 1. SAFETY: Emergency SOS Alerts
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  location_lat NUMERIC,
  location_lng NUMERIC,
  status TEXT CHECK (status IN ('ACTIVE', 'RESPONDED', 'RESOLVED')) DEFAULT 'ACTIVE',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. GROWTH: Dynamic Promotions & CRM
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ETHICS: Worker Appeals System
CREATE TABLE IF NOT EXISTS public.worker_appeals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES public.profiles(id) NOT NULL,
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT CHECK (status IN ('PENDING', 'IN_REVIEW', 'UPHELD', 'REJECTED')) DEFAULT 'PENDING',
  admin_id UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. COMPLIANCE: Welfare Cess & Social Security Ledger
CREATE TABLE IF NOT EXISTS public.welfare_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES public.profiles(id) NOT NULL,
  job_id UUID REFERENCES public.jobs(id),
  cess_amount NUMERIC NOT NULL, -- 1-2% of job price
  status TEXT DEFAULT 'ACCUMULATED', -- 'ACCUMULATED', 'REMITTED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. AGILITY: Add dynamic service category fields
ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 6. RPC: Trigger SOS
CREATE OR REPLACE FUNCTION public.trigger_sos(p_job_id UUID, p_lat NUMERIC, p_lng NUMERIC)
RETURNS UUID AS $$
DECLARE
  v_sos_id UUID;
BEGIN
  INSERT INTO public.sos_alerts (job_id, actor_id, location_lat, location_lng)
  VALUES (p_job_id, auth.uid(), p_lat, p_lng)
  RETURNING id INTO v_sos_id;

  -- Logic to immediately notify all Admins could go here via a trigger
  RETURN v_sos_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Calculate Compliance Remittance
CREATE OR REPLACE FUNCTION public.get_compliance_remittance_report()
RETURNS TABLE (
  worker_id UUID,
  worker_name TEXT,
  total_hours FLOAT,
  accumulated_cess NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    8.5 as total_hours, -- Placeholder for complex duration logic
    COALESCE(SUM(wl.cess_amount), 0)
  FROM public.profiles p
  JOIN public.welfare_ledger wl ON p.id = wl.worker_id
  GROUP BY p.id, p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
