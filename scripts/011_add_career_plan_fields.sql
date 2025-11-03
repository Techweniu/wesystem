-- Adiciona colunas para plano de carreira na tabela employees
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS career_plan_url TEXT,
ADD COLUMN IF NOT EXISTS career_plan_expiration_date DATE;

-- Adiciona índice para melhorar performance de queries por data de expiração
CREATE INDEX IF NOT EXISTS idx_employees_career_plan_expiration ON employees(career_plan_expiration_date);
