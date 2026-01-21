
# Phase 1.3: Database Functions and RPCs

```sql
-- 1. RPC: Atomic Job Request (Implemented previously)
-- 2. RPC: Secure Job Claim (Implemented previously)
-- 3. RPC: OTP Verification & Job Start (Implemented previously)

-- 4. RPC: Unified State Transition Validator
-- Ensures that the state machine is followed strictly on the server.
CREATE OR REPLACE FUNCTION public.update_job_state(
  p_job_id UUID,
  p_next_status TEXT,
  p_actor_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_status TEXT;
  v_is_valid BOOLEAN := FALSE;
BEGIN
  SELECT status INTO v_current_status FROM public.jobs WHERE id = p_job_id FOR UPDATE;

  -- State Machine Logic
  IF v_current_status = 'REQUESTED' AND p_next_status IN ('MATCHING', 'CANCELLED') THEN v_is_valid := TRUE;
  ELSIF v_current_status = 'MATCHING' AND p_next_status IN ('ASSIGNED', 'REQUESTED', 'CANCELLED') THEN v_is_valid := TRUE;
  ELSIF v_current_status = 'ASSIGNED' AND p_next_status IN ('IN_TRANSIT', 'CANCELLED') THEN v_is_valid := TRUE;
  ELSIF v_current_status = 'IN_TRANSIT' AND p_next_status IN ('STARTED', 'CANCELLED') THEN v_is_valid := TRUE;
  ELSIF v_current_status = 'STARTED' AND p_next_status IN ('COMPLETED_PENDING_PAYMENT', 'DISPUTED') THEN v_is_valid := TRUE;
  ELSIF v_current_status = 'COMPLETED_PENDING_PAYMENT' AND p_next_status IN ('PAID', 'DISPUTED') THEN v_is_valid := TRUE;
  ELSIF v_current_status = 'DISPUTED' AND p_next_status IN ('PAID', 'CANCELLED') THEN v_is_valid := TRUE;
  END IF;

  IF NOT v_is_valid THEN
    RETURN FALSE;
  END IF;

  UPDATE public.jobs
  SET 
    status = p_next_status,
    updated_at = now()
  WHERE id = p_job_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: Submit Worker Application
CREATE OR REPLACE FUNCTION public.submit_worker_application(
  p_worker_id UUID,
  p_skills TEXT[],
  p_summary TEXT
) RETURNS UUID AS $$
DECLARE
  v_app_id UUID;
BEGIN
  INSERT INTO public.workers_applications (worker_id, skills, experience_summary, status)
  VALUES (p_worker_id, p_skills, p_summary, 'PENDING')
  RETURNING id INTO v_app_id;
  
  RETURN v_app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Approve Worker Application
CREATE OR REPLACE FUNCTION public.approve_worker_application(
  p_app_id UUID,
  p_admin_id UUID,
  p_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_worker_id UUID;
  v_skills TEXT[];
BEGIN
  -- Verify admin role
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT worker_id, skills INTO v_worker_id, v_skills 
  FROM public.workers_applications 
  WHERE id = p_app_id AND status = 'PENDING'
  FOR UPDATE;

  IF v_worker_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Update Application Status
  UPDATE public.workers_applications
  SET status = 'APPROVED', admin_reason = p_reason
  WHERE id = p_app_id;

  -- 2. Update Worker Table
  UPDATE public.workers
  SET admin_approved = TRUE, skills = v_skills
  WHERE id = v_worker_id;

  -- 3. Update Profile Verification
  UPDATE public.profiles
  SET verified = TRUE
  WHERE id = v_worker_id;

  -- 4. Initialize Wallet
  INSERT INTO public.wallets (id, balance)
  VALUES (v_worker_id, 0)
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
