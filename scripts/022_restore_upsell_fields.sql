-- Restaura campos comerciais importantes na tabela client_upsells
-- Reverte a simplificação excessiva da migração 014 para permitir um CRM mais detalhado

-- Adiciona a coluna de descrição (detalhes da oportunidade)
ALTER TABLE public.client_upsells
ADD COLUMN IF NOT EXISTS description TEXT;

-- Adiciona a coluna de valor estimado (potencial de receita)
ALTER TABLE public.client_upsells
ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(10, 2);

-- Adiciona a coluna de próxima ação (follow-up)
ALTER TABLE public.client_upsells
ADD COLUMN IF NOT EXISTS next_action TEXT;

-- (Opcional) Adiciona um índice para melhor performance se formos filtrar por valor estimado futuramente
CREATE INDEX IF NOT EXISTS idx_client_upsells_estimated_value ON public.client_upsells(estimated_value);
