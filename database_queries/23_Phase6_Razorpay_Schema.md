
# Phase 6.1: Razorpay Integration Infrastructure

This query establishes the payment tracking system and secure confirmation RPCs.

```sql
-- 1. PAYMENTS: Tracking external transaction attempts
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  status TEXT CHECK (status IN ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED')) DEFAULT 'CREATED',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT USING (auth.uid() = customer_id);

-- 2. RPC: Initialize Payment Order
-- Generates a local order reference before opening Razorpay modal
CREATE OR REPLACE FUNCTION public.initialize_payment_order(
  p_job_id UUID,
  p_customer_id UUID,
  p_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_order_id TEXT;
  v_payment_id UUID;
BEGIN
  -- Generate a mock Razorpay Order ID (In production, this is fetched from Razorpay API via Edge Function)
  v_order_id := 'order_' || substring(gen_random_uuid()::text, 1, 14);

  INSERT INTO public.payments (job_id, customer_id, amount, razorpay_order_id, status)
  VALUES (p_job_id, p_customer_id, p_amount, v_order_id, 'CREATED')
  RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object(
    'payment_record_id', v_payment_id,
    'razorpay_order_id', v_order_id,
    'amount', p_amount,
    'currency', 'INR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Confirm Payment & Release Escrow
-- Finalizes the financial protocol after Razorpay success
CREATE OR REPLACE FUNCTION public.confirm_payment_protocol(
  p_order_id TEXT,
  p_payment_id TEXT,
  p_signature TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_job_id UUID;
  v_customer_id UUID;
  v_worker_id UUID;
  v_amount NUMERIC;
BEGIN
  -- 1. Fetch and Lock Payment Record
  SELECT job_id, customer_id, amount INTO v_job_id, v_customer_id, v_amount
  FROM public.payments WHERE razorpay_order_id = p_order_id FOR UPDATE;

  IF v_job_id IS NULL THEN
    RAISE EXCEPTION 'Invalid Order Reference.';
  END IF;

  -- 2. Fetch Job Context
  SELECT worker_id INTO v_worker_id FROM public.jobs WHERE id = v_job_id;

  -- 3. Update Payment Record
  UPDATE public.payments 
  SET 
    razorpay_payment_id = p_payment_id,
    razorpay_signature = p_signature,
    status = 'CAPTURED',
    updated_at = now()
  WHERE razorpay_order_id = p_order_id;

  -- 4. Update Job Status to PAID
  UPDATE public.jobs SET status = 'PAID', updated_at = now() WHERE id = v_job_id;

  -- 5. Ledger Entry: Customer Debit (External Payout)
  INSERT INTO public.wallet_ledger (wallet_id, amount, type, description, reference_job_id)
  VALUES (v_customer_id, -v_amount, 'DEBIT', 'External Razorpay Settlement: ' || p_payment_id, v_job_id);

  -- 6. Settlement: Credit Worker Wallet (Platform Internal)
  -- Deducting 10% platform commission as per standard governance
  IF v_worker_id IS NOT NULL THEN
    UPDATE public.wallets SET balance = balance + (v_amount * 0.9) WHERE id = v_worker_id;
    
    INSERT INTO public.wallet_ledger (wallet_id, amount, type, description, reference_job_id)
    VALUES (v_worker_id, v_amount * 0.9, 'CREDIT', 'Service Execution Settlement (Net)', v_job_id);
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```