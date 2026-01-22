
# Phase 11.4: Enhanced Platform Bootstrap Utility (V2)
Run this to populate your marketplace with a realistic "Live" state for all roles.

```sql
CREATE OR REPLACE FUNCTION public.bootstrap_platform_data()
RETURNS BOOLEAN AS $$
DECLARE
  v_cust_id UUID;
  v_work_id UUID;
  v_cat_id UUID;
  v_job_id UUID;
  v_job_id_2 UUID;
  v_job_id_3 UUID;
BEGIN
  -- 1. Identity Selection
  SELECT id INTO v_cust_id FROM public.profiles WHERE role = 'CUSTOMER' LIMIT 1;
  SELECT id INTO v_work_id FROM public.profiles WHERE role = 'WORKER' LIMIT 1;
  SELECT id INTO v_cat_id FROM public.service_categories WHERE name = 'Plumbing' LIMIT 1;

  IF v_cust_id IS NULL OR v_work_id IS NULL OR v_cat_id IS NULL THEN
    RAISE EXCEPTION 'Bootstrap Error: Ensure you have at least one Customer, one Worker, and Service Categories created via Auth first.';
  END IF;

  -- 2. Clean/Reset for fresh state
  DELETE FROM public.jobs WHERE customer_id = v_cust_id;
  DELETE FROM public.disputes WHERE reporter_id = v_cust_id;

  -- 3. Prepare Worker Profile
  UPDATE public.profiles SET verified = true, full_name = 'Mike "The Fixer" Rossi' WHERE id = v_work_id;
  UPDATE public.workers SET 
    is_online = true, 
    admin_approved = true, 
    skills = ARRAY['Plumbing', 'Electrical'],
    rating = 4.9,
    total_jobs = 142,
    last_location = ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography
  WHERE id = v_work_id;

  -- 4. SCENARIO A: The Active Mission (IN_TRANSIT)
  INSERT INTO public.jobs (customer_id, worker_id, category_id, description, price, location_address, location_lat, location_lng, status)
  VALUES (v_cust_id, v_work_id, v_cat_id, 'Kitchen pipe burst. Emergency containment required.', 850, '12th Cross, Indiranagar', 12.9784, 77.6408, 'IN_TRANSIT')
  RETURNING id INTO v_job_id;

  -- 5. SCENARIO B: The Pending Settlement (COMPLETED_PENDING_PAYMENT)
  INSERT INTO public.jobs (customer_id, worker_id, category_id, description, price, location_address, location_lat, location_lng, status)
  VALUES (v_cust_id, v_work_id, v_cat_id, 'Bathroom tap replacement.', 499, 'Koramangala 4th Block', 12.9339, 77.6301, 'COMPLETED_PENDING_PAYMENT')
  RETURNING id INTO v_job_id_2;

  -- 6. SCENARIO C: The Judicial Conflict (DISPUTED)
  INSERT INTO public.jobs (customer_id, worker_id, category_id, description, price, location_address, location_lat, location_lng, status)
  VALUES (v_cust_id, v_work_id, v_cat_id, 'Full house plumbing audit.', 2500, 'Whitefield Sector 2', 12.9698, 77.7500, 'DISPUTED')
  RETURNING id INTO v_job_id_3;

  INSERT INTO public.disputes (job_id, reporter_id, category, reason, status)
  VALUES (v_job_id_3, v_cust_id, 'QUALITY', 'Worker claimed task was finished but leak persists in the main valve.', 'OPEN');

  -- 7. Seed Fiscal History
  INSERT INTO public.wallet_ledger (wallet_id, amount, type, description)
  VALUES (v_work_id, 12000, 'CREDIT', 'Opening Balance - Migration');
  
  UPDATE public.wallets SET balance = 12000 WHERE id = v_work_id;

  -- 8. Final Audit Log
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  VALUES (v_cust_id, 'PLATFORM_BOOTSTRAP', 'SYSTEM', 'BOOTSTRAP_V2', jsonb_build_object('jobs_seeded', 3, 'conflicts_seeded', 1));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
