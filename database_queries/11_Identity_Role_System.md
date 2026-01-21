
# Phase 2.3: Identity Context & Role System

This query hardens the role architecture to prevent unauthorized role elevation and ensure strict role separation.

```sql
-- 1. Function: Prevent Role Mutation by Users
-- Ensures that once a role is set in the profiles table, the user cannot change it via client-side SDK.
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) AND (auth.role() <> 'service_role') THEN
    -- Only the system (service_role) or an ADMIN can change roles
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') THEN
      RAISE EXCEPTION 'Unauthorized: Role modification is restricted to administrative oversight.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_protect_user_role
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.protect_user_role();

-- 2. RPC: Secure Verification/Role Elevation
-- This handles the transition of a WORKER from 'unverified' to 'verified' via an Admin.
CREATE OR REPLACE FUNCTION public.admin_verify_user(
  p_target_user_id UUID,
  p_verified_status BOOLEAN,
  p_reason TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Check if actor is Admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Unauthorized: Administrative privileges required.';
  END IF;

  -- 2. Update Profile
  UPDATE public.profiles
  SET 
    verified = p_verified_status,
    updated_at = now()
  WHERE id = p_target_user_id;

  -- 3. Log the change for compliance
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'ROLE_VERIFICATION', 'USER_PROFILE', p_target_user_id::text, jsonb_build_object('verified', p_verified_status, 'reason', p_reason));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Unified Permissions Check (Internal Utility)
-- This will be used by all future Job and Payment RPCs
CREATE OR REPLACE FUNCTION public.check_permission(p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  
  CASE p_permission
    WHEN 'CREATE_JOB' THEN RETURN v_role IN ('CUSTOMER', 'ADMIN');
    WHEN 'CLAIM_JOB' THEN RETURN v_role IN ('WORKER', 'ADMIN');
    WHEN 'MANAGE_SYSTEM' THEN RETURN v_role = 'ADMIN';
    ELSE RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
