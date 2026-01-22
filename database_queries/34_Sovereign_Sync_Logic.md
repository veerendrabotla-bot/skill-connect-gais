
-- 1. Marketing: Promotion Application Engine
CREATE OR REPLACE FUNCTION public.apply_promotion_code(
  p_code TEXT,
  p_customer_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_promo RECORD;
BEGIN
  -- 1. Fetch Active Promotion
  SELECT * INTO v_promo 
  FROM public.promotions 
  WHERE code = UPPER(p_code) 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (usage_limit IS NULL OR used_count < usage_limit)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired promotion protocol.';
  END IF;

  -- 2. Check if customer has already used it (optional logic)
  
  RETURN jsonb_build_object(
    'id', v_promo.id,
    'code', v_promo.code,
    'discount_percent', v_promo.discount_percent,
    'max_discount', v_promo.max_discount_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Safety: Enhanced SOS Broadcasting
-- Automatically notifies all active administrators via the notification queue
CREATE OR REPLACE FUNCTION public.trigger_sos(
  p_job_id UUID, 
  p_lat NUMERIC, 
  p_lng NUMERIC
) RETURNS UUID AS $$
DECLARE
  v_sos_id UUID;
  v_worker_name TEXT;
  v_admin_id UUID;
BEGIN
  -- 1. Record the SOS Event
  INSERT INTO public.sos_alerts (job_id, actor_id, location_lat, location_lng, status)
  VALUES (p_job_id, auth.uid(), p_lat, p_lng, 'ACTIVE')
  RETURNING id INTO v_sos_id;

  -- 2. Fetch Worker Name
  SELECT full_name INTO v_worker_name FROM public.profiles WHERE id = auth.uid();

  -- 3. Broadcast to all Admins
  FOR v_admin_id IN (SELECT id FROM public.profiles WHERE role = 'ADMIN') LOOP
    INSERT INTO public.notifications (user_id, title, body, metadata)
    VALUES (
      v_admin_id,
      'CRITICAL: SOS SIGNAL',
      'Worker ' || v_worker_name || ' triggered emergency protocol on job #' || substring(p_job_id::text, 1, 8),
      jsonb_build_object('sos_id', v_sos_id, 'job_id', p_job_id, 'type', 'SAFETY_CRITICAL')
    );
  END LOOP;

  RETURN v_sos_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
