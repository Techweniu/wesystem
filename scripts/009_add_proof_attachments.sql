-- Add proof_url columns to track payment/receipt proofs

-- Add proof_url to costs table (for when adding a cost)
ALTER TABLE costs ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Add proof_url to employee_payments table
ALTER TABLE employee_payments ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Create client_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS client_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_client_payments_client_id ON client_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_payment_date ON client_payments(payment_date);
