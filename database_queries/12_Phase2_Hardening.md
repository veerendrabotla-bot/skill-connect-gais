
# Phase 2 Hardening: Security & OTP Integration

This query fills the gaps in the Job OTP handshake and User Metadata management.

```sql
-- 1. RPC: Verify OTP and Start Job
-- This is the critical handshake between Customer and Worker
CREATE OR REPLACE FUNCTION public.verify_and_start_job(
  p_job_id UUID,
  p_worker_id UUID,
  p_otp TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_customer_id UUID;
  v_is_valid_otp BOOLEAN;
BEGIN
  -- 1. Identify the customer for this job to check their OTP
  SELECT customer_id INTO v_customer_id 
  FROM public.jobs 
  WHERE id = p_job_id AND worker_id = p_worker_id;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Worker not assigned to this job.';
  END IF;

  -- 2. Verify the OTP against the auth_otps table
  -- We assume the purpose is 'JOB_START' and it was generated for the CUSTOMER
  v_is_valid_otp := public.verify_auth_otp(v_customer_id, p_otp, 'JOB_START');

  IF NOT v_is_valid_otp THEN
    RAISE EXCEPTION 'Invalid or expired security code.';
  END IF;

  -- 3. Atomic State Transition
  UPDATE public.jobs
  SET 
    status = 'STARTED',
    updated_at = now()
  WHERE id = p_job_id;

  -- 4. Log the event
  INSERT INTO public.job_events (job_id, actor_id, from_status, to_status, metadata)
  VALUES (p_job_id, p_worker_id, 'IN_TRANSIT', 'STARTED', jsonb_build_object('method', 'OTP_VERIFIED'));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RPC: Secure Profile Update
-- Allows users to update names/phones without bypassing Role Security
CREATE OR REPLACE FUNCTION public.update_profile(
  p_full_name TEXT,
  p_phone TEXT,
  p_avatar_url TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles
  SET 
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    updated_at = now()
  WHERE id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
