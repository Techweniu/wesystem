-- Insert sample clients
INSERT INTO clients (id, name, contact_email, contact_phone, status, cnpj, address, health_status) VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Tech Innovations Inc', 'contact@techinnovations.com', '+55 11 98765-4321', 'active', '11.111.111/0001-11', 'Rua Exemplo, 123', 'green'),
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Marketing Pro Agency', 'hello@marketingpro.com', '+55 21 97654-3210', 'active', '22.222.222/0001-22', 'Avenida Principal, 456', 'yellow'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'E-commerce Solutions', 'info@ecommercesol.com', '+55 11 96543-2109', 'active', '33.333.333/0001-33', 'Alameda das Flores, 789', 'green'),
  ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'Financial Services Co', 'contact@financialservices.com', '+55 11 95432-1098', 'prospect', '44.444.444/0001-44', NULL, NULL),
  ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'Healthcare Plus', 'info@healthcareplus.com', '+55 21 94321-0987', 'inactive', '55.555.555/0001-55', 'Praça Central, 101', 'red');

-- Insert sample contracts
-- CORREÇÃO APLICADA AQUI: Adicionando 'storage_path' com um valor placeholder
INSERT INTO contracts (client_id, name, valor_mensal, start_date, end_date, status, storage_path) VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Desenvolvimento e Manutenção Web', 15000.00, '2024-01-01', '2024-12-31', 'active', 'placeholder/dev_web.pdf'),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Serviços de SEO', 5000.00, '2024-03-01', NULL, 'active', 'placeholder/seo.pdf'),
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Gerenciamento de Mídias Sociais', 8000.00, '2024-02-01', '2024-12-31', 'active', 'placeholder/social_media.pdf'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Desenvolvimento Plataforma E-commerce', 25000.00, '2024-01-15', '2025-01-15', 'active', 'placeholder/ecommerce.pdf'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Marketing Digital', 12000.00, '2024-04-01', NULL, 'active', 'placeholder/marketing_digital.pdf');

-- Insert sample one-time services
INSERT INTO one_time_services (client_id, name, value, date, status) VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Design de Logo', 3500.00, '2024-01-15', 'completed'),
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Workshop Estratégia de Marca', 8000.00, '2024-02-20', 'completed'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Auditoria UX', 5000.00, '2024-03-10', 'completed'),
  ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'Sessão de Consultoria', 2000.00, '2024-04-05', 'pending');

-- Insert sample NPS responses
INSERT INTO nps_responses (client_id, score, comment, response_date, category_scores, observations) VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 9, 'Serviço e comunicação excelentes!', '2024-03-15', '{"Atendimento_Assessor": 10, "Resultado_da_Parceria": 9}', 'Continuem assim!'),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 10, 'Melhor agência com quem trabalhamos!', '2024-06-20', '{"Atendimento_Assessor": 10, "Resultado_da_Parceria": 10}', NULL),
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 8, 'Ótimos resultados, pequenos atrasos', '2024-04-10', '{"Conteúdos_e_Roteiros": 7, "Resultado_da_Parceria": 9}', 'A comunicação sobre prazos poderia melhorar.'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 9, 'Equipe muito profissional', '2024-05-15', '{"Design": 9, "Comunicação_e_Presença": 9}', NULL),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 7, 'Bom trabalho, mas a comunicação pode melhorar', '2024-07-01', '{"Comunicação_e_Presença": 6, "Atendimento_Assessor": 8}', 'Às vezes demoram para responder.'),
  ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 6, 'Experiência mediana', '2024-02-28', '{"Resultado_da_Parceria": 5}', 'Esperava mais dos resultados.');

-- Insert sample costs
INSERT INTO costs (description, value, category, date, is_recurring) VALUES
  ('Aluguel Escritório', 8000.00, 'Infraestrutura', '2024-01-01', true),
  ('Licenças de Software', 2500.00, 'Ferramentas', '2024-01-01', true),
  ('Campanha de Marketing', 5000.00, 'Marketing', '2024-02-15', false),
  ('Compra Equipamento', 15000.00, 'Infraestrutura', '2024-03-01', false),
  ('Serviços Nuvem', 1200.00, 'Infraestrutura', '2024-01-01', true),
  ('Treinamento & Desenvolvimento', 3000.00, 'RH', '2024-04-10', false);

-- Insert sample employees
INSERT INTO employees (id, name, email, role, department, salary, hire_date, manager_id, status, payment_day) VALUES
  ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Ana Silva', 'ana.silva@agency.com', 'CEO', 'Executivo', 25000.00, '2020-01-01', NULL, 'active', 5),
  ('a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'Carlos Santos', 'carlos.santos@agency.com', 'CTO', 'Tecnologia', 20000.00, '2020-02-01', 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'active', 5),
  ('b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e', 'Maria Oliveira', 'maria.oliveira@agency.com', 'Líder de Design', 'Design', 15000.00, '2020-03-15', 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'active', 5),
  ('c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', 'João Costa', 'joao.costa@agency.com', 'Desenvolvedor Sênior', 'Tecnologia', 12000.00, '2021-01-10', 'a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'active', 15),
  ('d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a', 'Paula Ferreira', 'paula.ferreira@agency.com', 'Gerente de Marketing', 'Marketing', 13000.00, '2021-06-01', 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'active', 15),
  ('e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', 'Ricardo Lima', 'ricardo.lima@agency.com', 'Desenvolvedor', 'Tecnologia', 8000.00, '2022-03-01', 'a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'active', 15),
  ('f2a3b4c5-d6e7-5f6a-9b0c-1d2e3f4a5b6c', 'Juliana Alves', 'juliana.alves@agency.com', 'Designer', 'Design', 7000.00, '2022-08-15', 'b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e', 'active', 15);

-- Insert sample time logs
INSERT INTO time_logs (employee_id, client_id, contract_id, hours, date, description) VALUES
  ('c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', (SELECT id FROM contracts WHERE name = 'Desenvolvimento e Manutenção Web' LIMIT 1), 8.0, '2024-01-15', 'Desenvolvimento frontend'),
  ('e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', (SELECT id FROM contracts WHERE name = 'Desenvolvimento e Manutenção Web' LIMIT 1), 6.5, '2024-01-15', 'Desenvolvimento API backend'),
  ('f2a3b4c5-d6e7-5f6a-9b0c-1d2e3f4a5b6c', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', (SELECT id FROM contracts WHERE name = 'Gerenciamento de Mídias Sociais' LIMIT 1), 4.0, '2024-02-10', 'Criação conteúdo mídias sociais'),
  ('c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', (SELECT id FROM contracts WHERE name = 'Desenvolvimento Plataforma E-commerce' LIMIT 1), 8.0, '2024-03-05', 'Implementação features e-commerce'),
  ('e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', (SELECT id FROM contracts WHERE name = 'Desenvolvimento Plataforma E-commerce' LIMIT 1), 7.5, '2024-03-05', 'Integração pagamento');

-- *******************************************
-- ** SEED PARA NOVAS TABELAS               **
-- *******************************************

-- Insert sample services
INSERT INTO services (name, description) VALUES
  ('Gestão de Tráfego Pago', 'Criação e otimização de campanhas em Google Ads, Meta Ads, etc.'),
  ('SEO (Otimização para Buscadores)', 'Melhoria do posicionamento orgânico em buscadores.'),
  ('Gestão de Redes Sociais', 'Criação de conteúdo, postagem e interação nas redes sociais.'),
  ('Produção Audiovisual', 'Gravação e edição de vídeos institucionais, comerciais, etc.'),
  ('Design Gráfico', 'Criação de identidade visual, peças gráficas, etc.'),
  ('Desenvolvimento Web', 'Criação de sites, landing pages, e-commerces.'),
  ('Inbound Marketing', 'Estratégias de atração e nutrição de leads.'),
  ('Consultoria de Marketing', 'Análise e planejamento estratégico de marketing.');

-- *******************************************
-- ** FIM DO SEED                          **
-- *******************************************
