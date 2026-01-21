
# Phase 4.5: Worker Profile & Brand Infrastructure

This query enables workers to manage their professional identity securely.

```sql
-- 1. RPC: Secure Worker Profile Update
-- Consolidated update for Profile and Worker metadata
CREATE OR REPLACE FUNCTION public.update_worker_profile(
  p_worker_id UUID,
  p_full_name TEXT,
  p_phone TEXT,
  p_skills TEXT[],
  p_avatar_url TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Identity Guard: Ensure user is updating their own record
  IF auth.uid() <> p_worker_id THEN
    RAISE EXCEPTION 'Unauthorized: Identity mismatch detected.';
  END IF;

  -- 2. Update Core Profile
  UPDATE public.profiles
  SET 
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    updated_at = now()
  WHERE id = p_worker_id;

  -- 3. Update Worker Professional Meta
  UPDATE public.workers
  SET 
    skills = COALESCE(p_skills, skills),
    updated_at = now()
  WHERE id = p_worker_id;

  -- 4. Log the modification for audit compliance
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  VALUES (
    auth.uid(), 
    'PROFILE_MODIFICATION', 
    'WORKER_IDENTITY', 
    p_worker_id::text, 
    jsonb_build_object('skills_updated', p_skills IS NOT NULL)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
