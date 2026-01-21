
# Phase 1.1: Core Database Schema (Expanded)

```sql
-- Existing tables: profiles, workers, customers, service_categories, jobs...

-- 7. WORKER APPLICATIONS: Tracking professional onboarding
CREATE TABLE IF NOT EXISTS public.workers_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skills TEXT[],
  experience_summary TEXT,
  documents_url TEXT,
  status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
  admin_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. WALLETS: Real-time balance
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  balance NUMERIC DEFAULT 0 NOT NULL,
  pending_amount NUMERIC DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. WALLET LEDGER: Immutable transaction history
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES public.wallets(id) NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('CREDIT', 'DEBIT')) NOT NULL,
  description TEXT,
  reference_job_id UUID REFERENCES public.jobs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Enable RLS on new tables
ALTER TABLE public.workers_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

-- Policies for Wallets
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users view own ledger" ON public.wallet_ledger FOR SELECT USING (auth.uid() = wallet_id);
```
