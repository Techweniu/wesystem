-- Função para criar cliente com contrato inicial
CREATE OR REPLACE FUNCTION create_client_with_contract(
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_status TEXT,
  contract_value DECIMAL,
  contract_start_date DATE,
  contract_end_date DATE
) RETURNS UUID AS $$
DECLARE
  new_client_id UUID;
BEGIN
  -- Insere o cliente
  INSERT INTO clients (name, contact_email, contact_phone, status)
  VALUES (client_name, client_email, client_phone, client_status)
  RETURNING id INTO new_client_id;

  -- Se foi fornecido um valor de contrato, cria o contrato inicial
  IF contract_value IS NOT NULL AND contract_start_date IS NOT NULL THEN
    INSERT INTO contracts (
      client_id,
      name,
      monthly_value,
      start_date,
      end_date,
      status
    ) VALUES (
      new_client_id,
      'Contrato Inicial',
      contract_value,
      contract_start_date,
      contract_end_date,
      'active'
    );
  END IF;

  RETURN new_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
