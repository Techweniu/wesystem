-- Add paid_date column to costs table to track when costs are paid
ALTER TABLE costs ADD COLUMN IF NOT EXISTS paid_date DATE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_costs_paid_date ON costs(paid_date);
