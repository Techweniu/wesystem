-- Remove colunas desnecessárias da tabela client_upsells
ALTER TABLE client_upsells
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS estimated_value,
DROP COLUMN IF EXISTS next_action;

-- Adiciona coluna services se não existir (caso o script anterior não tenha sido executado)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'client_upsells' AND column_name = 'services'
  ) THEN
    ALTER TABLE client_upsells ADD COLUMN services JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
