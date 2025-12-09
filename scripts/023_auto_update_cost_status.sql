-- Trigger para atualizar automaticamente o status do custo baseado nos pagamentos
-- Garante integridade financeira: a soma dos pagamentos dita o status do custo.

CREATE OR REPLACE FUNCTION public.update_cost_status_based_on_payments()
RETURNS TRIGGER AS $$
DECLARE
    v_cost_id UUID;
    v_total_paid DECIMAL(10, 2);
    v_cost_value DECIMAL(10, 2);
    v_last_payment_date DATE;
BEGIN
    -- Determina qual cost_id foi afetado (seja INSERT, UPDATE ou DELETE)
    IF (TG_OP = 'DELETE') THEN
        v_cost_id := OLD.cost_id;
    ELSE
        v_cost_id := NEW.cost_id;
    END IF;

    -- 1. Calcula o total pago para este custo
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_paid
    FROM public.cost_payments
    WHERE cost_id = v_cost_id;

    -- 2. Busca o valor total original do custo
    SELECT value INTO v_cost_value
    FROM public.costs
    WHERE id = v_cost_id;

    -- 3. Busca a data do último pagamento (para definir paid_date)
    SELECT MAX(payment_date) INTO v_last_payment_date
    FROM public.cost_payments
    WHERE cost_id = v_cost_id;

    -- 4. Atualiza o status e a data de pagamento na tabela costs
    -- Se o total pago for maior ou igual ao valor do custo, considera 'paid'
    -- Margem de erro pequena (0.01) para evitar problemas de arredondamento de float
    IF (v_total_paid >= (v_cost_value - 0.01)) THEN
        UPDATE public.costs
        SET 
            status = 'paid',
            paid_date = v_last_payment_date,
            updated_at = NOW()
        WHERE id = v_cost_id;
    ELSE
        UPDATE public.costs
        SET 
            status = 'pending',
            paid_date = NULL, -- Se não está pago, não tem data de quitação
            updated_at = NOW()
        WHERE id = v_cost_id;
    END IF;

    RETURN NULL; -- Resultado é ignorado para triggers AFTER
END;
$$ LANGUAGE plpgsql;

-- Remove o trigger se já existir para recriá-lo
DROP TRIGGER IF EXISTS trigger_update_cost_status ON public.cost_payments;

-- Cria o trigger que dispara APÓS qualquer alteração na tabela de pagamentos
CREATE TRIGGER trigger_update_cost_status
AFTER INSERT OR UPDATE OR DELETE ON public.cost_payments
FOR EACH ROW EXECUTE FUNCTION public.update_cost_status_based_on_payments();

-- (Opcional) Executa uma atualização em massa para corrigir dados legados que possam estar inconsistentes
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Simula um update em todos os custos que têm pagamentos para forçar o trigger (ou roda a lógica diretamente)
    -- Aqui, vamos apenas rodar a lógica de update direto para garantir consistência inicial
    UPDATE public.costs c
    SET 
        status = CASE 
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.cost_payments cp WHERE cp.cost_id = c.id) >= c.value THEN 'paid' 
            ELSE 'pending' 
        END,
        paid_date = CASE 
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.cost_payments cp WHERE cp.cost_id = c.id) >= c.value 
            THEN (SELECT MAX(payment_date) FROM public.cost_payments cp WHERE cp.cost_id = c.id)
            ELSE NULL 
        END;
END $$;
