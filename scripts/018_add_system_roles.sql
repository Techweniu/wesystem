-- Cria um tipo ENUM para os papéis do sistema
CREATE TYPE public.system_role_enum AS ENUM ('admin', 'limited');

-- Adiciona a coluna 'system_role' na tabela 'employees'
-- Por padrão, todos os usuários existentes e novos serão 'admin'
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS system_role public.system_role_enum NOT NULL DEFAULT 'admin';

-- Adiciona um índice para otimizar a busca por papel
CREATE INDEX IF NOT EXISTS idx_employees_system_role ON public.employees(system_role);
