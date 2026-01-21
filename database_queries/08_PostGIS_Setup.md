
# Phase 1.5: PostGIS Setup & Spatial Intelligence

These queries enable advanced geographic capabilities for the platform.

```sql
-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add Spatial Column to Jobs
-- Using GEOGRAPHY(Point, 4326) for accurate real-world distance calculations in meters
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS location_coords GEOGRAPHY(Point, 4326);

-- 3. Function: Sync standard lat/lng to PostGIS Point
CREATE OR REPLACE FUNCTION public.sync_job_coords()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.location_lat IS NOT NULL AND NEW.location_lng IS NOT NULL) THEN
    NEW.location_coords = ST_SetSRID(ST_MakePoint(NEW.location_lng, NEW.location_lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger: Maintain Spatial Integrity
DROP TRIGGER IF EXISTS tr_sync_job_coords ON public.jobs;
CREATE TRIGGER tr_sync_job_coords
BEFORE INSERT OR UPDATE OF location_lat, location_lng ON public.jobs
FOR EACH ROW EXECUTE PROCEDURE public.sync_job_coords();

-- 5. Index: Spatial GIST Index
-- Critical for performance in production environments
CREATE INDEX IF NOT EXISTS idx_jobs_location_coords ON public.jobs USING GIST (location_coords);

-- 6. RPC: Proximity-based Lead Discovery
-- Returns jobs within a radius, including the exact distance in meters
CREATE OR REPLACE FUNCTION public.get_nearby_jobs(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_radius_meters NUMERIC DEFAULT 10000
) 
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  worker_id UUID,
  category_id UUID,
  status TEXT,
  location_address TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  description TEXT,
  price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  distance_meters FLOAT
) AS $$
DECLARE
  v_point GEOGRAPHY;
BEGIN
  v_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  
  RETURN QUERY
  SELECT 
    j.id,
    j.customer_id,
    j.worker_id,
    j.category_id,
    j.status,
    j.location_address,
    j.location_lat,
    j.location_lng,
    j.description,
    j.price,
    j.created_at,
    ST_Distance(j.location_coords, v_point) as distance_meters
  FROM public.jobs j
  WHERE j.status = 'REQUESTED'
    AND ST_DWithin(j.location_coords, v_point, p_radius_meters)
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
