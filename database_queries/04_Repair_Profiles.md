
# Phase 1.2: Repair & Sync Existing Profiles

If you created users before running the triggers in 02_Auth_Automation.md, run this script to fix the "Profile not found" error.

```sql
-- 1. Sync missing profiles from auth.users
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name',
  COALESCE(raw_user_meta_data->>'role', 'CUSTOMER')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. Sync missing worker records
INSERT INTO public.workers (id, is_online, wallet_balance)
SELECT id, false, 0
FROM public.profiles
WHERE role = 'WORKER'
AND id NOT IN (SELECT id FROM public.workers);

-- 3. Sync missing customer records
INSERT INTO public.customers (id)
SELECT id
FROM public.profiles
WHERE role = 'CUSTOMER'
AND id NOT IN (SELECT id FROM public.customers);

-- 4. Verify results
SELECT p.email, p.role, w.id as worker_id, c.id as customer_id
FROM public.profiles p
LEFT JOIN public.workers w ON p.id = w.id
LEFT JOIN public.customers c ON p.id = c.id;
```
