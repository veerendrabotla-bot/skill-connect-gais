
# Phase 5.4: Financial Governance Infrastructure

This query establishes the specialized views and logic for the Platform's Fiscal Layer.

```sql
-- Enriched View for Admin Payout Management
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

-- RPC: Process Withdrawal Request
-- Handles approval (finality) or rejection (capital reversion)
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_withdrawal_id UUID,
  p_admin_id UUID,
  p_action TEXT, -- 'APPROVE', 'REJECT'
  p_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_worker_id UUID;
  v_amount NUMERIC;
  v_status TEXT;
BEGIN
  -- 1. Verify admin role
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 2. Fetch withdrawal context
  SELECT worker_id, amount, status INTO v_worker_id, v_amount, v_status
  FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;

  IF v_status <> 'PENDING' THEN
    RAISE EXCEPTION 'Request already finalized.';
  END IF;

  -- 3. Execution Logic
  IF p_action = 'APPROVE' THEN
    UPDATE public.withdrawals 
    SET status = 'PROCESSED', admin_reason = p_reason 
    WHERE id = p_withdrawal_id;
    
    -- Log approval
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
    VALUES (p_admin_id, 'PAYOUT_APPROVED', 'WITHDRAWAL', p_withdrawal_id::text, jsonb_build_object('amount', v_amount));

  ELSIF p_action = 'REJECT' THEN
    UPDATE public.withdrawals 
    SET status = 'REJECTED', admin_reason = p_reason 
    WHERE id = p_withdrawal_id;

    -- Capital Reversion: Return funds to worker wallet
    UPDATE public.wallets SET balance = balance + v_amount WHERE id = v_worker_id;

    -- Log Reversion in Ledger
    INSERT INTO public.wallet_ledger (wallet_id, amount, type, description)
    VALUES (v_worker_id, v_amount, 'CREDIT', 'Payout Rejection Reversion: #' || substring(p_withdrawal_id::text, 1, 8));

    -- Log audit
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
    VALUES (p_admin_id, 'PAYOUT_REJECTED', 'WITHDRAWAL', p_withdrawal_id::text, jsonb_build_object('amount', v_amount, 'reason', p_reason));
  
  ELSE
    RAISE EXCEPTION 'Invalid financial action.';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Manual Ledger Adjustment
-- Allows admins to correct balances (bonuses/penalties)
CREATE OR REPLACE FUNCTION public.adjust_worker_ledger(
  p_worker_id UUID,
  p_admin_id UUID,
  p_amount NUMERIC,
  p_description TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Verify admin role
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. Update Wallet
  UPDATE public.wallets SET balance = balance + p_amount WHERE id = p_worker_id;

  -- 2. Log Ledger Entry
  INSERT INTO public.wallet_ledger (wallet_id, amount, type, description)
  VALUES (
    p_worker_id, 
    p_amount, 
    CASE WHEN p_amount >= 0 THEN 'CREDIT' ELSE 'DEBIT' END, 
    '[ADMIN_ADJUSTMENT] ' || p_description
  );

  -- 3. Log Audit
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  VALUES (p_admin_id, 'LEDGER_ADJUSTMENT', 'WALLET', p_worker_id::text, jsonb_build_object('delta', p_amount, 'reason', p_description));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```