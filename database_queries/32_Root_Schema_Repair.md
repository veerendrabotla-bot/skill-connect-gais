
# 🚀 Root Schema Repair (Admin OS v4.2)
Run this single script in your Supabase SQL Editor to resolve all "Missing Table/View" errors.

```sql
-- 1. FORENSIC AUDIT VIEW
CREATE OR REPLACE VIEW public.admin_forensic_audit_view AS
SELECT 
  l.id,
  l.action,
  l.entity_type,
  l.entity_id,
  l.old_data,
  l.new_data,
  l.created_at,
  p.full_name as actor_name,
  p.email as actor_email,
  p.role as actor_role
FROM public.audit_logs l
LEFT JOIN public.profiles p ON l.actor_id = p.id;

-- 2. WORKER APPLICATIONS VIEW
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

-- 3. LIVE JOBS VIEW
CREATE OR REPLACE VIEW public.admin_live_jobs_view AS
SELECT 
  j.id,
  j.status,
  j.price,
  j.description,
  j.location_address,
  j.created_at,
  j.updated_at,
  cp.full_name as customer_name,
  cp.email as customer_email,
  wp.full_name as worker_name,
  wp.email as worker_email,
  w.rating as worker_rating,
  sc.name as category_name,
  sc.icon as category_icon
FROM public.jobs j
JOIN public.profiles cp ON j.customer_id = cp.id
LEFT JOIN public.profiles wp ON j.worker_id = wp.id
LEFT JOIN public.workers w ON j.worker_id = w.id
JOIN public.service_categories sc ON j.category_id = sc.id;

-- 4. WITHDRAWALS VIEW
CREATE OR REPLACE VIEW public.admin_withdrawals_view AS
SELECT 
  w.id,
  w.worker_id,
  p.full_name as worker_name,
  p.email as worker_email,
  w.amount,
  w.bank_details,
  w.status,
  w.admin_reason,
  w.created_at,
  wa.balance as current_vault_balance
FROM public.withdrawals w
JOIN public.profiles p ON w.worker_id = p.id
JOIN public.wallets wa ON w.worker_id = wa.id;

-- 5. DISPUTES VIEW
CREATE OR REPLACE VIEW public.admin_disputes_view AS
SELECT 
  d.*,
  j.price as job_price,
  j.status as job_status,
  sc.name as category_name,
  cp.full_name as customer_name,
  cp.email as customer_email,
  wp.full_name as worker_name,
  wp.email as worker_email
FROM public.disputes d
JOIN public.jobs j ON d.job_id = j.id
JOIN public.service_categories sc ON j.category_id = sc.id
JOIN public.profiles cp ON d.reporter_id = cp.id
LEFT JOIN public.profiles wp ON j.worker_id = wp.id;

-- 6. COMPLIANCE SUMMARY RPC
CREATE OR REPLACE VIEW public.admin_compliance_stats AS
SELECT
  (SELECT COUNT(*) FROM public.workers_applications WHERE status <> 'PENDING') as total_kyc_audited,
  (SELECT COUNT(*) FROM public.disputes WHERE status = 'RESOLVED') as total_disputes_settled,
  (SELECT COUNT(*) FROM public.withdrawals WHERE status = 'PROCESSED') as total_payouts_authorized,
  (SELECT COUNT(*) FROM public.audit_logs WHERE created_at > (now() - interval '24 hours')) as mutations_last_24h;

CREATE OR REPLACE FUNCTION public.get_compliance_summary()
RETURNS JSONB AS $$
DECLARE
  v_stats RECORD;
BEGIN
  SELECT * INTO v_stats FROM public.admin_compliance_stats;
  RETURN jsonb_build_object(
    'kyc_audited', v_stats.total_kyc_audited,
    'disputes_settled', v_stats.total_disputes_settled,
    'payouts_authorized', v_stats.total_payouts_authorized,
    'recent_mutations', v_stats.mutations_last_24h,
    'report_timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
