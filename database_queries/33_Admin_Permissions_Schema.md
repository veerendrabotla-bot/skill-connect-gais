
-- 1. Extend Profiles with Admin Tiering and Simulation
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='admin_level') THEN
    ALTER TABLE public.profiles ADD COLUMN admin_level TEXT DEFAULT 'SUPER_ADMIN';
  END IF;
  
  -- Add temporary simulation column (resets on session)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='simulated_tier') THEN
    ALTER TABLE public.profiles ADD COLUMN simulated_tier TEXT;
  END IF;
END $$;

-- 2. Update Identity Context RPC to surface the effective tier
CREATE OR REPLACE FUNCTION public.get_identity_context()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  SELECT 
    jsonb_build_object(
      'user', to_jsonb(p.*),
      'is_verified', p.verified,
      'role', p.role,
      -- Effective Tier: Uses simulated tier if available, otherwise actual admin_level
      'effective_tier', COALESCE(p.simulated_tier, p.admin_level, 'SUPER_ADMIN'),
      'actual_tier', COALESCE(p.admin_level, 'SUPER_ADMIN'),
      'worker_stats', (
        SELECT to_jsonb(w.*) 
        FROM public.workers w 
        WHERE w.id = v_user_id
      ),
      'session_verified_at', now()
    ) INTO v_result
  FROM public.profiles p
  WHERE p.id = v_user_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Sovereign Tier Simulator
-- Allows a Super Admin to toggle their effective view
CREATE OR REPLACE FUNCTION public.simulate_admin_tier(p_tier TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Security Guard: Only actual SUPER_ADMINs can trigger simulation
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND admin_level = 'SUPER_ADMIN') THEN
    RAISE EXCEPTION 'Access Denied: Sovereign Simulation restricted to Architects.';
  END IF;

  UPDATE public.profiles 
  SET simulated_tier = p_tier 
  WHERE id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
