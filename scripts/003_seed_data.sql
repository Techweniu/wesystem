-- Insert sample clients
INSERT INTO clients (id, name, contact_email, contact_phone, status) VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Tech Innovations Inc', 'contact@techinnovations.com', '+55 11 98765-4321', 'active'),
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Marketing Pro Agency', 'hello@marketingpro.com', '+55 21 97654-3210', 'active'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'E-commerce Solutions', 'info@ecommercesol.com', '+55 11 96543-2109', 'active'),
  ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'Financial Services Co', 'contact@financialservices.com', '+55 11 95432-1098', 'prospect'),
  ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'Healthcare Plus', 'info@healthcareplus.com', '+55 21 94321-0987', 'inactive');

-- Insert sample contracts
INSERT INTO contracts (client_id, name, monthly_value, start_date, end_date, status) VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Website Development & Maintenance', 15000.00, '2024-01-01', '2024-12-31', 'active'),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'SEO Services', 5000.00, '2024-03-01', NULL, 'active'),
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Social Media Management', 8000.00, '2024-02-01', '2024-12-31', 'active'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'E-commerce Platform Development', 25000.00, '2024-01-15', '2025-01-15', 'active'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Digital Marketing', 12000.00, '2024-04-01', NULL, 'active');

-- Insert sample one-time services
INSERT INTO one_time_services (client_id, name, value, date, status) VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Logo Design', 3500.00, '2024-01-15', 'completed'),
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Brand Strategy Workshop', 8000.00, '2024-02-20', 'completed'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'UX Audit', 5000.00, '2024-03-10', 'completed'),
  ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'Consulting Session', 2000.00, '2024-04-05', 'pending');

-- Insert sample NPS responses
INSERT INTO nps_responses (client_id, score, comment, response_date) VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 9, 'Excellent service and communication!', '2024-03-15'),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 10, 'Best agency we have worked with!', '2024-06-20'),
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 8, 'Great results, minor delays', '2024-04-10'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 9, 'Very professional team', '2024-05-15'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 7, 'Good work but could improve communication', '2024-07-01'),
  ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 6, 'Average experience', '2024-02-28');

-- Insert sample costs
INSERT INTO costs (description, value, category, date, is_recurring) VALUES
  ('Office Rent', 8000.00, 'Infrastructure', '2024-01-01', true),
  ('Software Licenses', 2500.00, 'Tools', '2024-01-01', true),
  ('Marketing Campaign', 5000.00, 'Marketing', '2024-02-15', false),
  ('Equipment Purchase', 15000.00, 'Infrastructure', '2024-03-01', false),
  ('Cloud Services', 1200.00, 'Infrastructure', '2024-01-01', true),
  ('Training & Development', 3000.00, 'HR', '2024-04-10', false);

-- Insert sample employees
INSERT INTO employees (id, name, email, role, department, salary, hire_date, manager_id, status) VALUES
  ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Ana Silva', 'ana.silva@agency.com', 'CEO', 'Executive', 25000.00, '2020-01-01', NULL, 'active'),
  ('a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'Carlos Santos', 'carlos.santos@agency.com', 'CTO', 'Technology', 20000.00, '2020-02-01', 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'active'),
  ('b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e', 'Maria Oliveira', 'maria.oliveira@agency.com', 'Design Lead', 'Design', 15000.00, '2020-03-15', 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'active'),
  ('c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', 'João Costa', 'joao.costa@agency.com', 'Senior Developer', 'Technology', 12000.00, '2021-01-10', 'a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'active'),
  ('d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a', 'Paula Ferreira', 'paula.ferreira@agency.com', 'Marketing Manager', 'Marketing', 13000.00, '2021-06-01', 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'active'),
  ('e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', 'Ricardo Lima', 'ricardo.lima@agency.com', 'Developer', 'Technology', 8000.00, '2022-03-01', 'a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'active'),
  ('f2a3b4c5-d6e7-5f6a-9b0c-1d2e3f4a5b6c', 'Juliana Alves', 'juliana.alves@agency.com', 'Designer', 'Design', 7000.00, '2022-08-15', 'b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e', 'active');

-- Insert sample time logs
INSERT INTO time_logs (employee_id, client_id, contract_id, hours, date, description) VALUES
  ('c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', (SELECT id FROM contracts WHERE name = 'Website Development & Maintenance' LIMIT 1), 8.0, '2024-01-15', 'Frontend development'),
  ('e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', (SELECT id FROM contracts WHERE name = 'Website Development & Maintenance' LIMIT 1), 6.5, '2024-01-15', 'Backend API development'),
  ('f2a3b4c5-d6e7-5f6a-9b0c-1d2e3f4a5b6c', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', (SELECT id FROM contracts WHERE name = 'Social Media Management' LIMIT 1), 4.0, '2024-02-10', 'Social media content creation'),
  ('c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', (SELECT id FROM contracts WHERE name = 'E-commerce Platform Development' LIMIT 1), 8.0, '2024-03-05', 'E-commerce features implementation'),
  ('e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', (SELECT id FROM contracts WHERE name = 'E-commerce Platform Development' LIMIT 1), 7.5, '2024-03-05', 'Payment integration');
