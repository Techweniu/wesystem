-- Adiciona coluna para atribuir Gestor de Relacionamento aos clientes
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS assigned_relationship_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- Cria índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_clients_relationship_manager ON clients(assigned_relationship_manager_id);
