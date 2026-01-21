
# Phase 4.4: Fiscal Infrastructure & Analytics

This query establishes the payout tracking and analytic aggregation logic.

```sql
-- 1. WITHDRAWALS: Tracking worker payout requests
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  bank_details JSONB NOT NULL,
  status TEXT CHECK (status IN ('PENDING', 'PROCESSED', 'REJECTED')) DEFAULT 'PENDING',
  admin_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workers view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = worker_id);

-- 2. RPC: Request Payout
-- Validates balance and creates a pending withdrawal
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_worker_id UUID,
  p_amount NUMERIC,
  p_bank_details JSONB
) RETURNS UUID AS $$
DECLARE
  v_current_balance NUMERIC;
  v_withdrawal_id UUID;
BEGIN
  -- 1. Fetch current balance with row lock
  SELECT balance INTO v_current_balance FROM public.wallets WHERE id = p_worker_id FOR UPDATE;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient vault reserves for this protocol.';
  END IF;

  -- 2. Create the withdrawal request record
  INSERT INTO public.withdrawals (worker_id, amount, bank_details)
  VALUES (p_worker_id, p_amount, p_bank_details)
  RETURNING id INTO v_withdrawal_id;

  -- 3. Atomic Debit from Wallet
  UPDATE public.wallets SET balance = balance - p_amount WHERE id = p_worker_id;

  -- 4. Log the Ledger entry
  INSERT INTO public.wallet_ledger (wallet_id, amount, type, description)
  VALUES (p_worker_id, -p_amount, 'DEBIT', 'Withdrawal Request #' || substring(v_withdrawal_id::text, 1, 8));

  RETURN v_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Get Worker Earnings Analytics
-- Returns daily aggregates for the last 7 days
CREATE OR REPLACE FUNCTION public.get_worker_earnings_analytics(
  p_worker_id UUID
) RETURNS TABLE (
  date DATE,
  amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gs.date::DATE,
    COALESCE(SUM(l.amount), 0) as amount
  FROM 
    generate_series(now() - interval '6 days', now(), interval '1 day') gs(date)
  LEFT JOIN 
    public.wallet_ledger l ON (l.created_at::DATE = gs.date::DATE AND l.wallet_id = p_worker_id AND l.type = 'CREDIT')
  GROUP BY 
    gs.date
  ORDER BY 
    gs.date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
