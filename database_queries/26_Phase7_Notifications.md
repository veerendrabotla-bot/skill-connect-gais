
# Phase 7.1: Notification Infrastructure

This query establishes the user-level control for the notification engine.

```sql
-- 1. NOTIFICATION PREFERENCES: Granular control for users
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  job_updates BOOLEAN DEFAULT true,
  marketing_alerts BOOLEAN DEFAULT false,
  security_alerts BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Automatic Preferences Initialization
CREATE OR REPLACE FUNCTION public.init_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (new.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_init_notif_prefs
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.init_notification_preferences();

-- 3. RPC: Mark All as Read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE user_id = p_user_id AND read = false;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: Clean Old Notifications (Maintenance)
-- Removes read notifications older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_notifications()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE read = true AND created_at < (now() - interval '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```