
# Phase 6.3: Revenue Analytics Infrastructure

This query provides the time-series aggregation logic for platform financial growth monitoring.

```sql
-- 1. RPC: Get Platform Revenue Stats (30-Day Velocity)
CREATE OR REPLACE FUNCTION public.get_platform_revenue_stats()
RETURNS TABLE (
  day DATE,
  gross_volume NUMERIC,
  net_yield NUMERIC,
  tax_collected NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gs.day::DATE,
    COALESCE(SUM(l.gross_amount), 0) as gross_volume,
    COALESCE(SUM(l.net_platform_yield), 0) as net_yield,
    COALESCE(SUM(l.tax_amount), 0) as tax_collected
  FROM 
    generate_series(now() - interval '29 days', now(), interval '1 day') gs(day)
  LEFT JOIN 
    public.platform_revenue_ledger l ON l.created_at::DATE = gs.day::DATE
  GROUP BY 
    gs.day
  ORDER BY 
    gs.day ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add GST Metadata to Revenue Ledger for official reporting
ALTER TABLE public.platform_revenue_ledger 
ADD COLUMN IF NOT EXISTS tax_reg_id TEXT DEFAULT 'GSTIN-PLATFORM-2025-SC';
```