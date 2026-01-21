
# Phase 9.1: Real-time Spatial Telemetry

This query enables the database to store and serve live worker coordinates for tracking.

```sql
-- 1. Extend Workers table with spatial column
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS last_location GEOGRAPHY(Point, 4326);

-- 2. Index for spatial performance
CREATE INDEX IF NOT EXISTS idx_workers_last_location ON public.workers USING GIST (last_location);

-- 3. RPC: Update Worker Telemetry
-- Throttled update to keep the database performance stable
CREATE OR REPLACE FUNCTION public.update_worker_location(
  p_worker_id UUID,
  p_lat NUMERIC,
  p_lng NUMERIC
) RETURNS BOOLEAN AS $$
BEGIN
  -- We assume the app handles the 15s throttle, 
  -- but we add a check to ensure we only update if the worker is actually online
  UPDATE public.workers
  SET 
    last_location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    updated_at = now()
  WHERE id = p_worker_id AND is_online = true;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: Get Worker Live Stream (For Customers)
-- Returns lat/lng for a worker assigned to an active job
CREATE OR REPLACE FUNCTION public.get_worker_location(p_worker_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_lat NUMERIC;
  v_lng NUMERIC;
BEGIN
  SELECT 
    ST_Y(last_location::geometry), 
    ST_X(last_location::geometry)
  INTO v_lat, v_lng
  FROM public.workers
  WHERE id = p_worker_id;

  RETURN jsonb_build_object(
    'lat', v_lat,
    'lng', v_lng,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```