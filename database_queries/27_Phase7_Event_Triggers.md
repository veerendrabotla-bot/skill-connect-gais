
# Phase 7.2: Event-Driven Notification Triggers

This query upgrades the notification engine with granular, human-readable logic for all platform participants.

```sql
-- 1. UPGRADE: Enhanced Job Lifecycle Notifications
CREATE OR REPLACE FUNCTION public.enqueue_job_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_title_cust TEXT;
  v_body_cust TEXT;
  v_title_work TEXT;
  v_body_work TEXT;
BEGIN
  -- We only fire if the status has actually changed
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- CUSTOMER LOGIC
    CASE NEW.status
      WHEN 'ASSIGNED' THEN
        v_title_cust := 'Partner Assigned';
        v_body_cust := 'A specialist has been assigned to your deployment #' || substring(NEW.id::text, 1, 8);
      WHEN 'IN_TRANSIT' THEN
        v_title_cust := 'Technician En-route';
        v_body_cust := 'Your service partner is currently heading to your location.';
      WHEN 'STARTED' THEN
        v_title_cust := 'Execution Active';
        v_body_cust := 'Deployment #' || substring(NEW.id::text, 1, 8) || ' is now officially in progress.';
      WHEN 'COMPLETED_PENDING_PAYMENT' THEN
        v_title_cust := 'Action Required: Finalize';
        v_body_cust := 'Service complete. Please authorize the final settlement of ₹' || NEW.price;
      WHEN 'PAID' THEN
        v_title_cust := 'Settlement Confirmed';
        v_body_cust := 'Payment processed successfully. Deployment closed.';
      WHEN 'CANCELLED' THEN
        v_title_cust := 'Mission Terminated';
        v_body_cust := 'Your service request has been cancelled.';
      ELSE
        v_title_cust := 'Job Update';
        v_body_cust := 'Status for node #' || substring(NEW.id::text, 1, 8) || ' updated to ' || NEW.status;
    END CASE;

    INSERT INTO public.notifications (user_id, title, body, metadata)
    VALUES (NEW.customer_id, v_title_cust, v_body_cust, jsonb_build_object('job_id', NEW.id, 'status', NEW.status));

    -- WORKER LOGIC (If assigned)
    IF NEW.worker_id IS NOT NULL THEN
      CASE NEW.status
        WHEN 'ASSIGNED' THEN
          v_title_work := 'New Mission Assigned';
          v_body_work := 'You have been matched with deployment #' || substring(NEW.id::text, 1, 8);
        WHEN 'PAID' THEN
          v_title_work := 'Vault Credit Received';
          v_body_work := '₹' || (NEW.price * 0.9) || ' (Net) has been settled to your vault.';
        WHEN 'CANCELLED' THEN
          v_title_work := 'Mission Aborted';
          v_body_work := 'The customer has terminated deployment #' || substring(NEW.id::text, 1, 8);
        ELSE
          v_title_work := 'Protocol Update';
          v_body_work := 'Node #' || substring(NEW.id::text, 1, 8) || ' status shifted to ' || NEW.status;
      END CASE;

      INSERT INTO public.notifications (user_id, title, body, metadata)
      VALUES (NEW.worker_id, v_title_work, v_body_work, jsonb_build_object('job_id', NEW.id, 'status', NEW.status));
    END IF;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. NEW: Dispute Resolution Notifications
CREATE OR REPLACE FUNCTION public.enqueue_dispute_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'RESOLVED') THEN
    -- Notify Complainant
    INSERT INTO public.notifications (user_id, title, body, metadata)
    VALUES (
      NEW.reporter_id,
      'Arbitration Concluded',
      'Judicial review for case #' || substring(NEW.id::text, 1, 8) || ' is complete. Result: ' || NEW.resolution,
      jsonb_build_object('dispute_id', NEW.id, 'resolution', NEW.resolution)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_dispute_notify ON public.disputes;
CREATE TRIGGER tr_on_dispute_notify
AFTER UPDATE ON public.disputes
FOR EACH ROW EXECUTE PROCEDURE public.enqueue_dispute_notification();
```