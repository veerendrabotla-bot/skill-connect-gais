
# Phase 5.2: Worker Review Infrastructure

This query creates a helper view for the Admin UI to fetch enriched application data.

```sql
-- Enriched View for Application Auditing
CREATE OR REPLACE VIEW public.admin_worker_applications_view AS
SELECT 
  wa.id,
  wa.worker_id,
  p.full_name,
  p.email,
  p.avatar_url,
  wa.skills,
  wa.experience_summary,
  wa.status,
  wa.created_at,
  wa.admin_reason,
  w.rating as current_rating
FROM public.workers_applications wa
JOIN public.profiles p ON wa.worker_id = p.id
LEFT JOIN public.workers w ON wa.worker_id = w.id;

-- RPC: Reject Worker Application
CREATE OR REPLACE FUNCTION public.reject_worker_application(
  p_app_id UUID,
  p_admin_id UUID,
  p_reason TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Verify admin role
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.workers_applications
  SET status = 'REJECTED', admin_reason = p_reason
  WHERE id = p_app_id;

  -- Log rejection
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  VALUES (p_admin_id, 'APPLICATION_REJECTION', 'WORKER_APPLICATION', p_app_id::text, jsonb_build_object('reason', p_reason));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
