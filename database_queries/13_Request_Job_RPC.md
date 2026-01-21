
# Phase 3.2: Atomic Job Request Logic

This function ensures jobs are created with all necessary metadata for the matching engine.

```sql
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
  -- 1. Insert into jobs table
  INSERT INTO public.jobs (
    customer_id,
    category_id,
    description,
    price,
    location_address,
    location_lat,
    location_lng,
    status
  )
  VALUES (
    p_customer_id,
    p_category_id,
    p_description,
    p_price,
    p_address,
    p_lat,
    p_lng,
    'REQUESTED'
  )
  RETURNING id INTO v_job_id;

  -- 2. Log initial event
  INSERT INTO public.job_events (job_id, actor_id, to_status, metadata)
  VALUES (v_job_id, p_customer_id, 'REQUESTED', jsonb_build_object('source', 'WEB_APP'));

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
