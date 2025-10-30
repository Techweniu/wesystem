-- Create cost_payments table to track when costs are paid
CREATE TABLE IF NOT EXISTS cost_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cost_id UUID NOT NULL REFERENCES costs(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_cost_payments_cost_id ON cost_payments(cost_id);
CREATE INDEX IF NOT EXISTS idx_cost_payments_payment_date ON cost_payments(payment_date);
