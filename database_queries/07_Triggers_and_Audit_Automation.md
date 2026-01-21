
# Phase 1.4: Triggers and Audit Automation

These SQL queries automate the maintenance and security of the platform.

```sql
-- 1. Function: Universal Timestamp Updater
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Apply Timestamp Triggers
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_jobs_modtime BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_workers_modtime BEFORE UPDATE ON public.workers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_wallets_modtime BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3. Function: Advanced Audit Logger
-- Captures who, what, and the exact data delta (OLD vs NEW)
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    actor_id, 
    action, 
    entity_type, 
    entity_id, 
    old_data, 
    new_data
  )
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN (TG_OP = 'DELETE') THEN OLD.id::text 
      ELSE NEW.id::text 
    END,
    CASE WHEN (TG_OP = 'INSERT') THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN (TG_OP = 'DELETE') THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply Audit Triggers to Sensitive Tables
CREATE TRIGGER audit_jobs_trigger AFTER INSERT OR UPDATE OR DELETE ON public.jobs FOR EACH ROW EXECUTE PROCEDURE public.log_audit_event();
CREATE TRIGGER audit_wallets_trigger AFTER UPDATE ON public.wallets FOR EACH ROW EXECUTE PROCEDURE public.log_audit_event();
CREATE TRIGGER audit_profiles_trigger AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.log_audit_event();

-- 5. Notification Queue Trigger
-- Prepares the system for Phase 7: Real-time updates
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.enqueue_job_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Notify Customer
    INSERT INTO public.notifications (user_id, title, body, metadata)
    VALUES (
      NEW.customer_id, 
      'Job Status Updated', 
      'Your job #' || substring(NEW.id::text, 1, 8) || ' is now ' || NEW.status,
      jsonb_build_object('job_id', NEW.id, 'status', NEW.status)
    );
    
    -- Notify Worker (if assigned)
    IF NEW.worker_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, metadata)
      VALUES (
        NEW.worker_id, 
        'Action Required', 
        'Job status changed to ' || NEW.status,
        jsonb_build_object('job_id', NEW.id, 'status', NEW.status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_job_status_notify
  AFTER UPDATE ON public.jobs
  FOR EACH ROW EXECUTE PROCEDURE public.enqueue_job_notification();
```
