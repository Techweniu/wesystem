-- Adiciona coluna services ao contrato para armazenar serviços contratados
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;

-- Cria tabela para rastrear entregas de serviços não recorrentes
CREATE TABLE IF NOT EXISTS contract_deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    delivered BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contract_deliverables_contract_id ON contract_deliverables(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_deliverables_delivered ON contract_deliverables(delivered);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_contract_deliverables_updated_at ON contract_deliverables;
CREATE TRIGGER update_contract_deliverables_updated_at 
    BEFORE UPDATE ON contract_deliverables 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
