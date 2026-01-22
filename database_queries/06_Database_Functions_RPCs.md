
# Phase 1.3: Database Functions and RPCs (Atomic Operations)

```sql
-- 1. RPC: Atomic Job Request
CREATE OR REPLACE FUNCTION public.request_job(
  p_customer_id UUID,
  p_category_id UUID,
  p_description TEXT,
  p_price NUMERIC,
  p_address TEXT,
  p_lat NUMERIC,
  p_lng NUMERIC
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO public.jobs (customer_id, category_id, description, price, location_address, location_lat, location_lng, status)
  VALUES (p_customer_id, p_category_id, p_description, p_price, p_address, p_lat, p_lng, 'REQUESTED')
  RETURNING id INTO v_job_id;

  INSERT INTO public.job_events (job_id, actor_id, to_status, metadata)
  VALUES (v_job_id, p_customer_id, 'REQUESTED', jsonb_build_object('source', 'WEB_APP'));

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RPC: Atomic Secure Job Claim
-- Prevents race conditions where two workers try to claim the same lead.
CREATE OR REPLACE FUNCTION public.claim_job(
  p_job_id UUID,
  p_worker_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  -- 1. Attempt to lock the specific job row for update
  -- If it's already being updated or locked, this will wait or fail
  SELECT status INTO v_current_status 
  FROM public.jobs 
  WHERE id = p_job_id 
  FOR UPDATE;

  -- 2. Validate that the job is still available
  IF v_current_status != 'REQUESTED' AND v_current_status != 'MATCHING' THEN
    RETURN FALSE;
  END IF;

  -- 3. Atomically assign and update status
  UPDATE public.jobs
  SET 
    worker_id = p_worker_id,
    status = 'ASSIGNED',
    updated_at = now()
  WHERE id = p_job_id;

  -- 4. Log the assignment event
  INSERT INTO public.job_events (job_id, actor_id, from_status, to_status)
  VALUES (p_job_id, p_worker_id, v_current_status, 'ASSIGNED');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
