
# Phase 5.5: Dispute Resolution Infrastructure

This query establishes the specialized judicial layer for arbitrating platform conflicts.

```sql
-- 1. DISPUTES: Formal grievance tracking
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) NOT NULL,
  category TEXT NOT NULL, -- 'QUALITY', 'PRICING', 'BEHAVIOR', 'INCOMPLETE'
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED')) DEFAULT 'OPEN',
  resolution TEXT, -- 'REFUNDED', 'RELEASED', 'PARTIAL'
  admin_id UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 2. Enriched View for Admin Oversight
CREATE OR REPLACE VIEW public.admin_disputes_view AS
SELECT 
  d.*,
  j.price as job_price,
  j.status as job_status,
  sc.name as category_name,
  cp.full_name as customer_name,
  cp.email as customer_email,
  wp.full_name as worker_name,
  wp.email as worker_email
FROM public.disputes d
JOIN public.jobs j ON d.job_id = j.id
JOIN public.service_categories sc ON j.category_id = sc.id
JOIN public.profiles cp ON d.reporter_id = cp.id
LEFT JOIN public.profiles wp ON j.worker_id = wp.id;

-- 3. RPC: Submit Formal Dispute
CREATE OR REPLACE FUNCTION public.submit_dispute(
  p_job_id UUID,
  p_reporter_id UUID,
  p_category TEXT,
  p_reason TEXT
) RETURNS UUID AS $$
DECLARE
  v_dispute_id UUID;
BEGIN
  -- 1. Create Dispute Record
  INSERT INTO public.disputes (job_id, reporter_id, category, reason)
  VALUES (p_job_id, p_reporter_id, p_category, p_reason)
  RETURNING id INTO v_dispute_id;

  -- 2. Flag Job as DISPUTED
  UPDATE public.jobs SET status = 'DISPUTED', updated_at = now() WHERE id = p_job_id;

  -- 3. Log Job Event
  INSERT INTO public.job_events (job_id, actor_id, to_status, metadata)
  VALUES (p_job_id, p_reporter_id, 'DISPUTED', jsonb_build_object('dispute_id', v_dispute_id, 'category', p_category));

  RETURN v_dispute_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: Resolve Dispute
CREATE OR REPLACE FUNCTION public.resolve_dispute(
  p_dispute_id UUID,
  p_admin_id UUID,
  p_decision TEXT, -- 'UPHOLD_REFUND', 'DISMISS_RELEASE'
  p_notes TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_job_id UUID;
  v_job_status TEXT;
  v_resolution TEXT;
BEGIN
  -- 1. Verify admin role
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT job_id INTO v_job_id FROM public.disputes WHERE id = p_dispute_id FOR UPDATE;

  -- 2. Execute Judicial Logic
  IF p_decision = 'UPHOLD_REFUND' THEN
    v_resolution := 'REFUNDED';
    -- Cancel job and stop payment release
    UPDATE public.jobs SET status = 'CANCELLED', updated_at = now() WHERE id = v_job_id;
  ELSIF p_decision = 'DISMISS_RELEASE' THEN
    v_resolution := 'RELEASED';
    -- Set job to PAID, which triggers standard settlement logic
    UPDATE public.jobs SET status = 'PAID', updated_at = now() WHERE id = v_job_id;
  ELSE
    RAISE EXCEPTION 'Invalid judicial decision code.';
  END IF;

  -- 3. Update Dispute Record
  UPDATE public.disputes
  SET 
    status = 'RESOLVED',
    resolution = v_resolution,
    admin_id = p_admin_id,
    admin_notes = p_notes,
    resolved_at = now()
  WHERE id = p_dispute_id;

  -- 4. Audit Log
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  VALUES (p_admin_id, 'DISPUTE_RESOLUTION', 'DISPUTE', p_dispute_id::text, jsonb_build_object('decision', v_resolution, 'notes', p_notes));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```