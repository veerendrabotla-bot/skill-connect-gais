
# Phase 5.1: Admin Operations Infrastructure

This query establishes the high-level reporting views for the Platform Overseers.

```sql
-- 1. Table: System Heartbeats
CREATE TABLE IF NOT EXISTS public.system_health_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  component TEXT NOT NULL, -- 'DATABASE', 'AUTH', 'NOTIFICATIONS', 'GEMINI_AI'
  status TEXT CHECK (status IN ('OPTIMAL', 'DEGRADED', 'CRITICAL')),
  latency_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RPC: Aggregate Platform KPIs
-- One-stop shop for the Admin Overview dashboard
CREATE OR REPLACE FUNCTION public.get_platform_kpis()
RETURNS JSONB AS $$
DECLARE
  v_active_jobs INTEGER;
  v_pending_kyc INTEGER;
  v_total_escrow NUMERIC;
  v_system_standing TEXT;
  v_result JSONB;
BEGIN
  -- 1. Count non-finalized jobs
  SELECT COUNT(*) INTO v_active_jobs FROM public.jobs WHERE status NOT IN ('PAID', 'CANCELLED');

  -- 2. Count pending applications
  SELECT COUNT(*) INTO v_pending_kyc FROM public.workers_applications WHERE status = 'PENDING';

  -- 3. Calculate total settled volume (last 30 days)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_escrow 
  FROM public.wallet_ledger 
  WHERE type = 'CREDIT' AND created_at > (now() - interval '30 days');

  -- 4. Determine overall system health
  SELECT status INTO v_system_standing FROM public.system_health_logs ORDER BY created_at DESC LIMIT 1;

  v_result := jsonb_build_object(
    'active_deployments', v_active_jobs,
    'pending_kyc', v_pending_kyc,
    'monthly_volume', v_total_escrow,
    'system_status', COALESCE(v_system_standing, 'OPTIMAL'),
    'generated_at', now()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Seed: Initial Heartbeat
INSERT INTO public.system_health_logs (component, status, latency_ms)
VALUES ('DATABASE', 'OPTIMAL', 12);
```