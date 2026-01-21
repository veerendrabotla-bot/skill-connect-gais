
# Phase 1.2: Hardened RLS & Audit Architecture

This query sets up the security firewall and immutable event tracking.

```sql
-- 1. AUDIT LOGS: Append-only table for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. JOB EVENTS: Immutable history of job state transitions
CREATE TABLE IF NOT EXISTS public.job_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. HARDENED RLS POLICIES

-- Enable RLS on new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- SERVICE CATEGORIES: Publicly readable
CREATE POLICY "Categories are readable by everyone" ON public.service_categories
  FOR SELECT USING (true);

-- WORKERS: Profiles are public, but balance is protected
CREATE POLICY "Workers can view their own details" ON public.workers
  FOR SELECT USING (auth.uid() = id);

-- JOBS: Advanced Lead Discovery Logic
-- 1. Users see their own jobs
-- 2. Workers see jobs in REQUESTED state (Leads)
DROP POLICY IF EXISTS "Users can see their own jobs" ON public.jobs;
CREATE POLICY "Job visibility policy" ON public.jobs
  FOR SELECT USING (
    auth.uid() = customer_id 
    OR auth.uid() = worker_id 
    OR (
      status = 'REQUESTED' 
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'WORKER')
    )
  );

-- Only customers can insert jobs
CREATE POLICY "Customers can create jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id 
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'CUSTOMER')
  );

-- Only assigned worker or customer or admin can update jobs
CREATE POLICY "Job update policy" ON public.jobs
  FOR UPDATE USING (
    auth.uid() = customer_id 
    OR auth.uid() = worker_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- AUDIT LOGS & JOB EVENTS: Only Admins can see all, Users see their own job events
CREATE POLICY "Job events visibility" ON public.job_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND (customer_id = auth.uid() OR worker_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- 4. TRIGGER: Automatically log job status changes to job_events
CREATE OR REPLACE FUNCTION public.log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.job_events (job_id, actor_id, from_status, to_status)
    VALUES (NEW.id, auth.uid(), OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_job_status_change
  AFTER UPDATE ON public.jobs
  FOR EACH ROW EXECUTE PROCEDURE public.log_job_status_change();
```
