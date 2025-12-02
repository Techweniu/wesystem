-- Adiciona a coluna client_id na tabela platform_access
ALTER TABLE platform_access 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Cria um índice para melhorar a performance nas buscas por cliente
CREATE INDEX IF NOT EXISTS idx_platform_access_client_id ON platform_access(client_id);

-- (Opcional) Tenta vincular acessos existentes baseados no nome (String matching)
-- UPDATE platform_access pa
-- SET client_id = c.id
-- FROM clients c
-- WHERE pa.department = 'Cliente' AND pa.client_name IS NOT NULL AND c.name ILIKE pa.client_name;
