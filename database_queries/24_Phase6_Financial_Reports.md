
# Phase 6.3: Platform Financial & Tax Infrastructure

This query establishes the logic for platform-side revenue tracking and tax liability auditing.

```sql
-- 1. REVENUE LOGS: Tracking platform's cut and taxes
CREATE TABLE IF NOT EXISTS public.platform_revenue_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) NOT NULL,
  payment_id TEXT NOT NULL,
  gross_amount NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  tax_amount NUMERIC NOT NULL, -- GST component
  net_platform_yield NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enhanced Confirmation RPC with GST and Commission Logic
CREATE OR REPLACE FUNCTION public.confirm_payment_protocol(
  p_order_id TEXT,
  p_payment_id TEXT,
  p_signature TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_job_id UUID;
  v_customer_id UUID;
  v_worker_id UUID;
  v_gross_amount NUMERIC;
  v_base_service_amount NUMERIC;
  v_commission NUMERIC;
  v_tax NUMERIC;
  v_worker_net NUMERIC;
BEGIN
  -- 1. Fetch and Lock Payment Record
  SELECT job_id, customer_id, amount INTO v_job_id, v_customer_id, v_gross_amount
  FROM public.payments WHERE razorpay_order_id = p_order_id FOR UPDATE;

  IF v_job_id IS NULL THEN
    RAISE EXCEPTION 'Invalid Order Reference.';
  END IF;

  -- 2. Calculate Splitting (Business Logic Layer)
  -- Gross = Base + Tax (18%) + Convenience (49)
  -- v_gross_amount includes everything. Let's work backwards.
  v_tax := (v_gross_amount - 49) * 0.18; -- 18% GST on service
  v_base_service_amount := v_gross_amount - 49 - v_tax;
  v_commission := v_base_service_amount * 0.10; -- 10% Platform Cut
  v_worker_net := v_base_service_amount - v_commission;

  -- 3. Fetch Job Context
  SELECT worker_id INTO v_worker_id FROM public.jobs WHERE id = v_job_id;

  -- 4. Update Statuses
  UPDATE public.payments SET razorpay_payment_id = p_payment_id, razorpay_signature = p_signature, status = 'CAPTURED' WHERE razorpay_order_id = p_order_id;
  UPDATE public.jobs SET status = 'PAID' WHERE id = v_job_id;

  -- 5. Execute Split Settlements
  -- Worker Credit
  IF v_worker_id IS NOT NULL THEN
    UPDATE public.wallets SET balance = balance + v_worker_net WHERE id = v_worker_id;
    INSERT INTO public.wallet_ledger (wallet_id, amount, type, description, reference_job_id)
    VALUES (v_worker_id, v_worker_net, 'CREDIT', 'Service Execution Net Payout', v_job_id);
  END IF;

  -- Platform Revenue Entry
  INSERT INTO public.platform_revenue_ledger (job_id, payment_id, gross_amount, commission_amount, tax_amount, net_platform_yield)
  VALUES (v_job_id, p_payment_id, v_gross_amount, v_commission, v_tax, v_commission + 49);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Get Platform Fiscal Health
CREATE OR REPLACE FUNCTION public.get_fiscal_health()
RETURNS JSONB AS $$
DECLARE
  v_total_gross NUMERIC;
  v_total_yield NUMERIC;
  v_total_tax NUMERIC;
  v_pending_payouts NUMERIC;
BEGIN
  SELECT COALESCE(SUM(gross_amount), 0), COALESCE(SUM(net_platform_yield), 0), COALESCE(SUM(tax_amount), 0)
  INTO v_total_gross, v_total_yield, v_total_tax
  FROM public.platform_revenue_ledger;

  SELECT COALESCE(SUM(amount), 0) INTO v_pending_payouts FROM public.withdrawals WHERE status = 'PENDING';

  RETURN jsonb_build_object(
    'gross_volume', v_total_gross,
    'net_yield', v_total_yield,
    'tax_liability', v_total_tax,
    'capital_in_transit', v_pending_payouts,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```