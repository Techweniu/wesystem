-- Renomeia a coluna valor_mensal para monthly_value na tabela contracts
-- Isso corrige a incongruência com a função create_client_with_contract e os tipos do frontend

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'contracts'
        AND column_name = 'valor_mensal'
    ) THEN
        ALTER TABLE contracts RENAME COLUMN valor_mensal TO monthly_value;
    END IF;
END $$;
