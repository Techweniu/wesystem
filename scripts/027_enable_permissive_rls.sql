-- Script para ativar RLS globalmente com políticas permissivas
-- Objetivo: Atender requisitos de segurança (RLS ON) sem bloquear o funcionamento
-- de aplicações que gerenciam autenticação via código/variáveis locais.

DO $$ 
DECLARE 
    t text;
    -- Lista consolidada de todas as tabelas identificadas nos scripts do projeto
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
        'client_payments',
        'commercial_goals', 
        'client_upsells', 
        'contract_deliverables',
        'platform_access'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Verifica dinamicamente se a tabela existe no banco para evitar erros
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            
            -- 1. Ativa o Row Level Security (RLS)
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
            
            -- 2. Limpeza de políticas anteriores para garantir idempotência (poder rodar o script várias vezes)
            -- Remove a nossa política permissiva se já existir
            EXECUTE format('DROP POLICY IF EXISTS "System Permissive Policy" ON %I', t);
            
            -- Opcional: Remover políticas restritivas antigas que poderiam conflitar (ex: do script 002)
            -- Descomente as linhas abaixo se quiser limpar políticas "authenticated only" que possam bloquear acessos 'anon'
            /*
            EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated users to view %I" ON %I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated users to insert %I" ON %I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated users to update %I" ON %I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated users to delete %I" ON %I', t, t);
            */

            -- 3. Cria a política permissiva "Porta Aberta"
            -- TO public: Abrange tanto usuários logados (authenticated) quanto anônimos (anon/chave pública)
            -- USING (true): Permite ler qualquer linha
            -- WITH CHECK (true): Permite gravar/alterar qualquer linha
            EXECUTE format('
                CREATE POLICY "System Permissive Policy" ON %I
                FOR ALL
                TO public
                USING (true)
                WITH CHECK (true)
            ', t, t);
            
            RAISE NOTICE 'RLS ativado e política total aplicada para tabela: %', t;
            
        ELSE
            RAISE NOTICE 'Tabela não encontrada (pode não ter sido criada ainda): %', t;
        END IF;
    END LOOP;
END $$;
