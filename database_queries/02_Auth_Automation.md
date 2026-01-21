
# Phase 1.1: Auth Automation Triggers

This query sets up the "Sync" between Supabase Auth and our Public Schema. Run this after the Core Schema.

```sql
-- Function to handle new user registration automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Create the base profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'CUSTOMER')
  );
  
  -- 2. Initialize role-specific tables
  IF (new.raw_user_meta_data->>'role') = 'WORKER' THEN
    INSERT INTO public.workers (id, is_online, wallet_balance) 
    VALUES (new.id, false, 0);
  ELSIF (new.raw_user_meta_data->>'role') = 'CUSTOMER' THEN
    INSERT INTO public.customers (id) 
    VALUES (new.id);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```
