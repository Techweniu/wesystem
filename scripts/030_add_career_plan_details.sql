-- Adiciona colunas para o detalhamento do plano de carreira na tabela employees
-- career_plan_content: Texto livre
-- career_plan_goals: Array de objetos JSON para o checklist { id, text, checked }

ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS career_plan_content TEXT,
ADD COLUMN IF NOT EXISTS career_plan_goals JSONB DEFAULT '[]'::jsonb;

-- Comentários para documentação
COMMENT ON COLUMN public.employees.career_plan_content IS 'Texto livre descrevendo o plano de carreira';
COMMENT ON COLUMN public.employees.career_plan_goals IS 'Lista de metas em formato JSONB: [{id: string, text: string, checked: boolean}]';
