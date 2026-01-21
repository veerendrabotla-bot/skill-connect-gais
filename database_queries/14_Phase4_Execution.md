
# Phase 4.3: Job Execution Infrastructure

This query establishes the specialized logic for the worker's execution lifecycle.

```sql
-- 1. RPC: Initialize Transit
-- Sets status to IN_TRANSIT and records start location
CREATE OR REPLACE FUNCTION public.initialize_transit(
  p_job_id UUID,
  p_worker_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.jobs
  SET 
    status = 'IN_TRANSIT',
    updated_at = now()
  WHERE id = p_job_id AND worker_id = p_worker_id AND status = 'ASSIGNED';

  INSERT INTO public.job_events (job_id, actor_id, from_status, to_status, metadata)
  VALUES (p_job_id, p_worker_id, 'ASSIGNED', 'IN_TRANSIT', jsonb_build_object('timestamp', now()));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RPC: Finalize Job & Invoice
-- Transitions job to pending payment and stores the bill
CREATE OR REPLACE FUNCTION public.finalize_job_invoice(
  p_job_id UUID,
  p_worker_id UUID,
  p_invoice_data JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  v_total_amount NUMERIC;
BEGIN
  -- Extract total from JSONB for validation
  v_total_amount := (p_invoice_data->>'total')::NUMERIC;

  UPDATE public.jobs
  SET 
    status = 'COMPLETED_PENDING_PAYMENT',
    price = v_total_amount,
    invoice_details = p_invoice_data,
    updated_at = now()
  WHERE id = p_job_id AND worker_id = p_worker_id AND status = 'STARTED';

  INSERT INTO public.job_events (job_id, actor_id, from_status, to_status, metadata)
  VALUES (p_job_id, p_worker_id, 'STARTED', 'COMPLETED_PENDING_PAYMENT', p_invoice_data);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
