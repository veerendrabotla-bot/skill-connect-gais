
-- 1. RPC: Auto Dispatcher Logic
-- This function simulates the "thinking" of the dispatcher node
CREATE OR REPLACE FUNCTION public.auto_dispatch_job(p_job_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_job RECORD;
  v_candidates JSONB;
  v_sector_name TEXT;
BEGIN
  -- 1. Fetch Job Context
  SELECT j.*, sc.name as cat_name 
  INTO v_job 
  FROM public.jobs j
  JOIN public.service_categories sc ON j.category_id = sc.id
  WHERE j.id = p_job_id;

  -- 2. Transition to MATCHING if in REQUESTED
  IF v_job.status = 'REQUESTED' THEN
    UPDATE public.jobs SET status = 'MATCHING' WHERE id = p_job_id;
  END IF;

  -- 3. Perform Spatial Match for Metadata
  -- Finds top 3 nearby workers for UI "reassurance"
  SELECT jsonb_agg(t) INTO v_candidates
  FROM (
    SELECT 
      w.id,
      p.full_name,
      w.rating,
      ST_Distance(w.last_location, v_job.location_coords) as dist_m
    FROM public.workers w
    JOIN public.profiles p ON w.id = p.id
    WHERE w.is_online = true 
      AND w.admin_approved = true
      AND v_job.cat_name = ANY(w.skills)
      AND ST_DWithin(w.last_location, v_job.location_coords, 25000)
    ORDER BY dist_m ASC, w.rating DESC
    LIMIT 3
  ) t;

  -- 4. Update Job Metadata with Dispatcher Findings
  UPDATE public.jobs 
  SET metadata = jsonb_build_object(
    'dispatcher_run_at', now(),
    'candidate_count', COALESCE(jsonb_array_length(v_candidates), 0),
    'candidates', v_candidates,
    'sector_discovery', 'Sector ' || substring(p_job_id::text, 1, 4) || ' Analysis Complete'
  )
  WHERE id = p_job_id;

  RETURN jsonb_build_object(
    'success', true,
    'candidates_found', COALESCE(jsonb_array_length(v_candidates), 0),
    'sector', v_job.location_address
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
