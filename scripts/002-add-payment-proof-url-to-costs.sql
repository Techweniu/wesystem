-- Migration: Add payment_proof_url column to costs table
-- This separates the cost proof (proof_url) from the payment proof (payment_proof_url)

ALTER TABLE costs 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Comment for documentation
COMMENT ON COLUMN costs.payment_proof_url IS 'URL do comprovante de pagamento (separado do comprovante de custo)';
COMMENT ON COLUMN costs.proof_url IS 'URL do comprovante do custo (nota fiscal, orçamento, etc.)';
