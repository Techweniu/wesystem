-- Inserção dos novos administradores na tabela employees
-- OBSERVAÇÃO IMPORTANTE:
-- Este script cria os PERFIS e concede a permissão de ADMIN no sistema.
-- Você deve criar os usuários correspondentes no Supabase Auth (Authentication > Users)
-- usando os mesmos e-mails definidos abaixo (@weniu.com) e as senhas que você definiu.

INSERT INTO employees (name, email, role, department, hire_date, status, system_role) VALUES
  (
    'Paulo', 
    'paulo@weniu.com', 
    'Administrador', 
    'Diretoria', 
    CURRENT_DATE, 
    'active', 
    'admin'
  ),
  (
    'Atila', 
    'atila@weniu.com', 
    'Administrador', 
    'Diretoria', 
    CURRENT_DATE, 
    'active', 
    'admin'
  ),
  (
    'Vinicius', 
    'vinicius@weniu.com', 
    'Administrador', 
    'Diretoria', 
    CURRENT_DATE, 
    'active', 
    'admin'
  ),
  (
    'Isadora', 
    'isadora@weniu.com', 
    'Administrador', 
    'Diretoria', 
    CURRENT_DATE, 
    'active', 
    'admin'
  ),
  (
    'Joao', 
    'joao@weniu.com', 
    'Administrador', 
    'Diretoria', 
    CURRENT_DATE, 
    'active', 
    'admin'
  );
