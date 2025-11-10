-- Adiciona a coluna para o editor designado na tabela de clientes
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS assigned_editor_id UUID;

-- Adiciona a restrição de chave estrangeira referenciando a tabela employees
ALTER TABLE public.clients
ADD CONSTRAINT clients_assigned_editor_id_fkey FOREIGN KEY (assigned_editor_id) 
REFERENCES public.employees(id) ON DELETE SET NULL;

-- Adiciona um índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_clients_assigned_editor_id ON public.clients(assigned_editor_id);
