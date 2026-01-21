
# Phase 5.6: Audit & Compliance Infrastructure

This query establishes the forensic views and compliance reporting layer.

```sql
-- 1. Forensic Audit View: logs + profile details
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

-- 2. Compliance Reporting View
-- Aggregates governance activity over the last 30 days
CREATE OR REPLACE VIEW public.admin_compliance_stats AS
SELECT
  (SELECT COUNT(*) FROM public.workers_applications WHERE status <> 'PENDING') as total_kyc_audited,
  (SELECT COUNT(*) FROM public.disputes WHERE status = 'RESOLVED') as total_disputes_settled,
  (SELECT COUNT(*) FROM public.withdrawals WHERE status = 'PROCESSED') as total_payouts_authorized,
  (SELECT COUNT(*) FROM public.audit_logs WHERE created_at > (now() - interval '24 hours')) as mutations_last_24h;

-- 3. RPC: Get Platform Compliance Summary
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