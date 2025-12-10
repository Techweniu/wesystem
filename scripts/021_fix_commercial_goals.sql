-- Remove colunas antigas que não batem com o código atual
ALTER TABLE public.commercial_goals
DROP COLUMN IF EXISTS period_type,
DROP COLUMN IF EXISTS period_start,
DROP COLUMN IF EXISTS period_end,
DROP COLUMN IF EXISTS description;

-- Adiciona as colunas esperadas pelo sistema
ALTER TABLE public.commercial_goals
ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Nova Meta',
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'revenue', -- revenue, clients, upsell_value, churn_rate
ADD COLUMN IF NOT EXISTS current_value numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS deadline date;
