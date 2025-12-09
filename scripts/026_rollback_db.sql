-- ROLLBACK DB: Reverte alterações para restaurar funcionamento original

-- 1. Reverte o nome da coluna na tabela contracts (monthly_value -> valor_mensal)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'contracts'
        AND column_name = 'monthly_value'
    ) THEN
        ALTER TABLE contracts RENAME COLUMN monthly_value TO valor_mensal;
    END IF;
END $$;

-- 2. Desativa Row Level Security (RLS) em TODAS as tabelas
-- Isso permite que a aplicação acesse os dados usando apenas as credenciais de serviço,
-- sem depender de usuários logados no Supabase Auth.

ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_observations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_contributions DISABLE ROW LEVEL SECURITY;

-- Tabelas novas (caso existam)
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_upsells DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_payments DISABLE ROW LEVEL SECURITY;

-- 3. Limpeza de políticas (Opcional, mas recomendado para evitar sujeira)
DROP POLICY IF EXISTS "Clients Visibility" ON public.clients;
DROP POLICY IF EXISTS "Clients Insert Admin Only" ON public.clients;
DROP POLICY IF EXISTS "Clients Update" ON public.clients;
DROP POLICY IF EXISTS "Clients Delete Admin Only" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to view clients" ON public.clients;
