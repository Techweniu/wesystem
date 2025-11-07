-- Adiciona colunas de recebimento à tabela one_time_services
ALTER TABLE one_time_services
ADD COLUMN IF NOT EXISTS received_date DATE,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Adiciona índices para performance
CREATE INDEX IF NOT EXISTS idx_one_time_services_received_date ON one_time_services(received_date);

-- NOTA: O status 'completed' agora será definido pela action,
-- quando o pagamento for registrado.
