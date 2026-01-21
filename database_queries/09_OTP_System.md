
# Phase 2.1: Centralized OTP Engine

This query establishes a reusable, secure OTP system for identity verification and high-security actions.

```sql
-- 1. Create OTP storage with automatic expiry
CREATE TABLE IF NOT EXISTS public.auth_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL, -- e.g., 'EMAIL_VERIFICATION', 'JOB_START', 'PAYMENT_AUTH'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Index for fast cleanup and lookup
CREATE INDEX IF NOT EXISTS idx_auth_otps_user_purpose ON public.auth_otps (user_id, purpose);

-- 3. Function: Generate Secure OTP
CREATE OR REPLACE FUNCTION public.generate_auth_otp(
  p_user_id UUID,
  p_purpose TEXT
) RETURNS TEXT AS $$
DECLARE
  v_otp TEXT;
BEGIN
  -- 1. Generate a random 6-digit numeric code
  v_otp := lpad(floor(random() * 1000000)::text, 6, '0');

  -- 2. Delete any existing OTPs for this user/purpose
  DELETE FROM public.auth_otps WHERE user_id = p_user_id AND purpose = p_purpose;

  -- 3. Insert new OTP with 5-minute expiry
  INSERT INTO public.auth_otps (user_id, otp_code, purpose, expires_at)
  VALUES (p_user_id, v_otp, p_purpose, now() + interval '5 minutes');

  RETURN v_otp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: Verify OTP
CREATE OR REPLACE FUNCTION public.verify_auth_otp(
  p_user_id UUID,
  p_otp TEXT,
  p_purpose TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_valid BOOLEAN;
BEGIN
  -- Check if a matching, non-expired OTP exists
  SELECT EXISTS (
    SELECT 1 FROM public.auth_otps
    WHERE user_id = p_user_id
      AND otp_code = p_otp
      AND purpose = p_purpose
      AND expires_at > now()
  ) INTO v_valid;

  -- If valid, consume it (delete so it can't be reused)
  IF v_valid THEN
    DELETE FROM public.auth_otps WHERE user_id = p_user_id AND purpose = p_purpose;
  END IF;

  RETURN v_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
