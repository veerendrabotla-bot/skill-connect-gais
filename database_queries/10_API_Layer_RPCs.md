
# Phase 2.2: Backend API Layer (Edge Function Proxies)

These SQL functions act as the secure "Edge Functions" for the platform, enforcing role-based logic at the database kernel.

```sql
-- 1. Identity Middleware: Get full security context (Fixed version)
CREATE OR REPLACE FUNCTION public.get_identity_context()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  -- Use a single query with sub-selects to avoid "record not assigned" errors
  SELECT 
    jsonb_build_object(
      'user', to_jsonb(p.*),
      'is_verified', p.verified,
      'role', p.role,
      'worker_stats', (
        SELECT to_jsonb(w.*) 
        FROM public.workers w 
        WHERE w.id = v_user_id
      ),
      'session_verified_at', now()
    ) INTO v_result
  FROM public.profiles p
  WHERE p.id = v_user_id;

  -- Return null if no profile exists yet (race condition handler)
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Security Middleware: Require Specific Role
CREATE OR REPLACE FUNCTION public.require_role(p_required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = p_required_role
  ) THEN
    RAISE EXCEPTION 'Unauthorized: % role required', p_required_role;
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Audit Engine: Manual Audit Entry
CREATE OR REPLACE FUNCTION public.create_audit_entry(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. State API: Get Full Job Timeline
CREATE OR REPLACE FUNCTION public.get_job_full_state(p_job_id UUID)
RETURNS TABLE (
  job_data JSONB,
  events JSONB,
  customer_info JSONB,
  worker_info JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(j.*) as job_data,
    (SELECT jsonb_agg(to_jsonb(ev.*) ORDER BY ev.created_at DESC) FROM public.job_events ev WHERE ev.job_id = j.id) as events,
    (SELECT to_jsonb(p.*) FROM public.profiles p WHERE p.id = j.customer_id) as customer_info,
    (SELECT to_jsonb(p.*) FROM public.profiles p WHERE p.id = j.worker_id) as worker_info
  FROM public.jobs j
  WHERE j.id = p_job_id
    AND (j.customer_id = auth.uid() OR j.worker_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
