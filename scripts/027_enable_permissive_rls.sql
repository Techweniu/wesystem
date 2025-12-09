-- Script para ativar RLS globalmente com políticas permissivas
-- Atualizado para incluir explicitamente cost_payments e varredura total

DO $$ 
DECLARE 
    t text;
    -- Lista explicita para referência, mas vamos usar varredura do schema para garantir
    tables text[] := ARRAY[
        'clients', 
        'contracts', 
        'one_time_services', 
        'nps_responses', 
        'costs', 
        'employees', 
        'time_logs', 
        'employee_payments', 
        'employee_observations', 
        'client_contacts', 
        'employee_contracts', 
        'employee_contributions', 
        'services', 
        'client_services',
        'cost_categories', 
        'cost_subcategories',
        'cost_payments',       -- Adicionado explicitamente
        'client_payments',
        'commercial_goals', 
        'client_upsells', 
        'contract_deliverables',
        'platform_access'
    ];
BEGIN
    -- Vamos iterar pela lista explícita para garantir a ordem e as principais
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            
            -- 1. Ativa o Row Level Security (RLS)
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
            
            -- 2. Remove política anterior se houver
            EXECUTE format('DROP POLICY IF EXISTS "System Permissive Policy" ON %I', t);

            -- 3. Cria a política permissiva
            EXECUTE format('
                CREATE POLICY "System Permissive Policy" ON %I
                FOR ALL
                TO public
                USING (true)
                WITH CHECK (true)
            ', t, t);
            
            RAISE NOTICE 'RLS ativado para tabela: %', t;
        END IF;
    END LOOP;
END $$;
