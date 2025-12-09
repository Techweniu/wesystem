-- Ajusta o RLS para funcionar com Autenticação via Variáveis de Ambiente (.env)
-- Permite acesso 'public' (anon/authenticated) pois a segurança é feita pelo Middleware da aplicação.

-- 1. Helper Macro para recriar políticas permissivas rapidamente
DO $$
DECLARE
    tables_list text[] := ARRAY[
        'clients', 'contracts', 'one_time_services', 'nps_responses', 
        'costs', 'employees', 'time_logs', 'employee_payments', 
        'employee_observations', 'client_contacts', 'employee_contracts', 
        'employee_contributions', 'services', 'client_services', 
        'client_upsells', 'commercial_goals', 'cost_payments'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY tables_list
    LOOP
        -- Remove políticas restritivas anteriores
        EXECUTE format('DROP POLICY IF EXISTS "Clients Visibility" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Clients Insert Admin Only" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Clients Delete Admin Only" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Clients Update" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated users to view %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated users to insert %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated users to update %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated users to delete %I" ON %I', t, t);
        
        -- Políticas específicas criadas no script 021 (limpeza)
        EXECUTE format('DROP POLICY IF EXISTS "Contracts Visibility" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Contracts Manage Admin" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Costs Admin Only" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Employee Payments Visibility" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Employees Manage Admin" ON %I', t);

        -- Cria políticas permissivas (CRUD total para a aplicação)
        -- TO public inclui 'anon' (seu caso) e 'authenticated'
        EXECUTE format('CREATE POLICY "App Policy Select %I" ON %I FOR SELECT TO public USING (true)', t, t);
        EXECUTE format('CREATE POLICY "App Policy Insert %I" ON %I FOR INSERT TO public WITH CHECK (true)', t, t);
        EXECUTE format('CREATE POLICY "App Policy Update %I" ON %I FOR UPDATE TO public USING (true)', t, t);
        EXECUTE format('CREATE POLICY "App Policy Delete %I" ON %I FOR DELETE TO public USING (true)', t, t);
    END LOOP;
END $$;
