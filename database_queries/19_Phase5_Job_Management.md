
# Phase 5.3: Job Management & Intervention Infrastructure

This query establishes the enriched views for monitoring the live service mesh.

```sql
-- Enriched View for Admin Job Monitoring
CREATE OR REPLACE VIEW public.admin_live_jobs_view AS
SELECT 
  j.id,
  j.status,
  j.price,
  j.description,
  j.location_address,
  j.created_at,
  j.updated_at,
  -- Customer Details
  cp.full_name as customer_name,
  cp.email as customer_email,
  -- Worker Details (if assigned)
  wp.full_name as worker_name,
  wp.email as worker_email,
  w.rating as worker_rating,
  -- Category Details
  sc.name as category_name,
  sc.icon as category_icon
FROM public.jobs j
JOIN public.profiles cp ON j.customer_id = cp.id
LEFT JOIN public.profiles wp ON j.worker_id = wp.id
LEFT JOIN public.workers w ON j.worker_id = w.id
JOIN public.service_categories sc ON j.category_id = sc.id;

-- RPC: Admin Intervention Override
-- Allows admins to bypass the standard state machine for emergency management
CREATE OR REPLACE FUNCTION public.admin_job_intervention(
  p_job_id UUID,
  p_admin_id UUID,
  p_action TEXT, -- 'TERMINATE', 'FORCE_COMPLETE'
  p_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_next_status TEXT;
BEGIN
  -- 1. Verify admin role
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 2. Map Action to Status
  IF p_action = 'TERMINATE' THEN
    v_next_status := 'CANCELLED';
  ELSIF p_action = 'FORCE_COMPLETE' THEN
    v_next_status := 'PAID';
  ELSE
    RAISE EXCEPTION 'Invalid intervention protocol.';
  END IF;

  -- 3. Update Job
  UPDATE public.jobs
  SET 
    status = v_next_status,
    updated_at = now()
  WHERE id = p_job_id;

  -- 4. Log Intervention in Audit Ledger
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  VALUES (p_admin_id, 'ADMIN_INTERVENTION_' || p_action, 'JOB_OVERRIDE', p_job_id::text, jsonb_build_object('reason', p_reason, 'prev_status', 'N/A'));

  -- 5. Log Job Event
  INSERT INTO public.job_events (job_id, actor_id, to_status, metadata)
  VALUES (p_job_id, p_admin_id, v_next_status, jsonb_build_object('intervention', true, 'reason', p_reason));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```