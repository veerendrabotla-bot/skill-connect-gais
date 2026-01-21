
# Phase 10: State Machine & Automated Matching

This query implements the "Dispatcher" logic for the platform.

```sql
-- 1. RPC: Automated Worker Matching Engine
-- Finds the top 3 best matching workers for a specific job
CREATE OR REPLACE FUNCTION public.get_best_matches_for_job(p_job_id UUID)
RETURNS TABLE (
  worker_id UUID,
  distance_meters FLOAT,
  rating NUMERIC
) AS $$
DECLARE
  v_job_lat NUMERIC;
  v_job_lng NUMERIC;
  v_cat_id UUID;
  v_cat_name TEXT;
BEGIN
  -- Get job location and category
  SELECT j.location_lat, j.location_lng, j.category_id, sc.name 
  INTO v_job_lat, v_job_lng, v_cat_id, v_cat_name
  FROM public.jobs j
  JOIN public.service_categories sc ON j.category_id = sc.id
  WHERE j.id = p_job_id;

  RETURN QUERY
  SELECT 
    w.id as worker_id,
    ST_Distance(w.last_location, ST_SetSRID(ST_MakePoint(v_job_lng, v_job_lat), 4326)::geography) as distance_meters,
    w.rating
  FROM public.workers w
  WHERE w.is_online = true 
    AND w.admin_approved = true
    AND v_cat_name = ANY(w.skills) -- Match by skill
    AND ST_DWithin(w.last_location, ST_SetSRID(ST_MakePoint(v_job_lng, v_job_lat), 4326)::geography, 25000)
  ORDER BY distance_meters ASC, rating DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. State Guard: Prevent illegal transitions in update_job_state
CREATE OR REPLACE FUNCTION public.update_job_state(
  p_job_id UUID,
  p_next_status TEXT,
  p_actor_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_status TEXT;
  v_is_valid BOOLEAN := FALSE;
BEGIN
  SELECT status INTO v_current_status FROM public.jobs WHERE id = p_job_id FOR UPDATE;

  -- Terminal Node Guard
  IF v_current_status IN ('PAID', 'CANCELLED') THEN
    RAISE EXCEPTION 'Node Finalized: Transitions from terminal states are restricted.';
  END IF;

  -- Unified State Machine Map
  IF v_current_status = 'REQUESTED' AND p_next_status IN ('MATCHING', 'CANCELLED') THEN v_is_valid := TRUE;
  ELSIF v_current_status = 'MATCHING' AND p_next_status IN ('ASSIGNED', 'REQUESTED', 'CANCELLED') THEN v_is_valid := TRUE;
  ELSIF v_current_status = 'ASSIGNED' AND p_next_status IN ('IN_TRANSIT', 'CANCELLED') THEN v_is_valid := TRUE;
  ELSIF v_current_status = 'IN_TRANSIT' AND p_next_status IN ('STARTED', 'CANCELLED') THEN v_is_valid := TRUE;
  ELSIF v_current_status = 'STARTED' AND p_next_status IN ('COMPLETED_PENDING_PAYMENT', 'DISPUTED') THEN v_is_valid := TRUE;
  ELSIF v_current_status = 'COMPLETED_PENDING_PAYMENT' AND p_next_status IN ('PAID', 'DISPUTED') THEN v_is_valid := TRUE;
  ELSIF v_current_status = 'DISPUTED' AND p_next_status IN ('PAID', 'CANCELLED') THEN v_is_valid := TRUE;
  END IF;

  IF NOT v_is_valid THEN
    RETURN FALSE;
  END IF;

  UPDATE public.jobs SET status = p_next_status, updated_at = now() WHERE id = p_job_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```