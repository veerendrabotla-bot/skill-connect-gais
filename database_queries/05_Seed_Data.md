
# Phase 1.1: Seed Service Categories

Run this in your Supabase SQL editor to populate the marketplace with initial categories.

```sql
INSERT INTO public.service_categories (name, icon, description, base_price)
VALUES 
  ('Plumbing', '🚰', 'Leak repairs, pipe installations, and bathroom fittings.', 499),
  ('Electrical', '⚡', 'Wiring, switchboard repairs, and appliance installation.', 399),
  ('Cleaning', '🧹', 'Deep home cleaning, sofa cleaning, and sanitization.', 999),
  ('Carpentry', '🪚', 'Furniture repair, assembly, and custom woodwork.', 599),
  ('Painting', '🎨', 'Full house painting or touch-up services.', 2499),
  ('AC Repair', '❄️', 'Servicing, gas refilling, and cooling issues.', 899);
```
