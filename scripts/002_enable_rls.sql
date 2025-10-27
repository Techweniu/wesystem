-- Enable Row Level Security on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_contributions ENABLE ROW LEVEL SECURITY;
-- Novas tabelas
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_services ENABLE ROW LEVEL SECURITY;


-- Policies (Permitir acesso total para usuários autenticados)

-- Clients policies
DROP POLICY IF EXISTS "Allow authenticated users to view clients" ON clients;
CREATE POLICY "Allow authenticated users to view clients" ON clients FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON clients;
CREATE POLICY "Allow authenticated users to insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON clients;
CREATE POLICY "Allow authenticated users to update clients" ON clients FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON clients;
CREATE POLICY "Allow authenticated users to delete clients" ON clients FOR DELETE TO authenticated USING (true);

-- Contracts policies
DROP POLICY IF EXISTS "Allow authenticated users to view contracts" ON contracts;
CREATE POLICY "Allow authenticated users to view contracts" ON contracts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert contracts" ON contracts;
CREATE POLICY "Allow authenticated users to insert contracts" ON contracts FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users to update contracts" ON contracts;
CREATE POLICY "Allow authenticated users to update contracts" ON contracts FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to delete contracts" ON contracts;
CREATE POLICY "Allow authenticated users to delete contracts" ON contracts FOR DELETE TO authenticated USING (true);

-- One-time services policies
DROP POLICY IF EXISTS "Allow authenticated users to view one_time_services" ON one_time_services;
CREATE POLICY "Allow authenticated users to view one_time_services" ON one_time_services FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert one_time_services" ON one_time_services;
CREATE POLICY "Allow authenticated users to insert one_time_services" ON one_time_services FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users to update one_time_services" ON one_time_services;
CREATE POLICY "Allow authenticated users to update one_time_services" ON one_time_services FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to delete one_time_services" ON one_time_services;
CREATE POLICY "Allow authenticated users to delete one_time_services" ON one_time_services FOR DELETE TO authenticated USING (true);

-- NPS responses policies
DROP POLICY IF EXISTS "Allow authenticated users to view nps_responses" ON nps_responses;
CREATE POLICY "Allow authenticated users to view nps_responses" ON nps_responses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert nps_responses" ON nps_responses;
CREATE POLICY "Allow authenticated users to insert nps_responses" ON nps_responses FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users to update nps_responses" ON nps_responses;
CREATE POLICY "Allow authenticated users to update nps_responses" ON nps_responses FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to delete nps_responses" ON nps_responses;
CREATE POLICY "Allow authenticated users to delete nps_responses" ON nps_responses FOR DELETE TO authenticated USING (true);

-- Costs policies
DROP POLICY IF EXISTS "Allow authenticated users to view costs" ON costs;
CREATE POLICY "Allow authenticated users to view costs" ON costs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert costs" ON costs;
CREATE POLICY "Allow authenticated users to insert costs" ON costs FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users to update costs" ON costs;
CREATE POLICY "Allow authenticated users to update costs" ON costs FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to delete costs" ON costs;
CREATE POLICY "Allow authenticated users to delete costs" ON costs FOR DELETE TO authenticated USING (true);

-- Employees policies
DROP POLICY IF EXISTS "Allow authenticated users to view employees" ON employees;
CREATE POLICY "Allow authenticated users to view employees" ON employees FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert employees" ON employees;
CREATE POLICY "Allow authenticated users to insert employees" ON employees FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users to update employees" ON employees;
CREATE POLICY "Allow authenticated users to update employees" ON employees FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to delete employees" ON employees;
CREATE POLICY "Allow authenticated users to delete employees" ON employees FOR DELETE TO authenticated USING (true);

-- Time logs policies
DROP POLICY IF EXISTS "Allow authenticated users to view time_logs" ON time_logs;
CREATE POLICY "Allow authenticated users to view time_logs" ON time_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert time_logs" ON time_logs;
CREATE POLICY "Allow authenticated users to insert time_logs" ON time_logs FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users to update time_logs" ON time_logs;
CREATE POLICY "Allow authenticated users to update time_logs" ON time_logs FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to delete time_logs" ON time_logs;
CREATE POLICY "Allow authenticated users to delete time_logs" ON time_logs FOR DELETE TO authenticated USING (true);

-- Employee Payments policies
DROP POLICY IF EXISTS "Allow authenticated users to view employee_payments" ON employee_payments;
CREATE POLICY "Allow authenticated users to view employee_payments" ON employee_payments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert employee_payments" ON employee_payments;
CREATE POLICY "Allow authenticated users to insert employee_payments" ON employee_payments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users to update employee_payments" ON employee_payments;
CREATE POLICY "Allow authenticated users to update employee_payments" ON employee_payments FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to delete employee_payments" ON employee_payments;
CREATE POLICY "Allow authenticated users to delete employee_payments" ON employee_payments FOR DELETE TO authenticated USING (true);

-- Employee Observations policies
DROP POLICY IF EXISTS "Allow authenticated users to view employee_observations" ON employee_observations;
CREATE POLICY "Allow authenticated users to view employee_observations" ON employee_observations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert employee_observations" ON employee_observations;
CREATE POLICY "Allow authenticated users to insert employee_observations" ON employee_observations FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users to update employee_observations" ON employee_observations;
CREATE POLICY "Allow authenticated users to update employee_observations" ON employee_observations FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to delete employee_observations" ON employee_observations;
CREATE POLICY "Allow authenticated users to delete employee_observations" ON employee_observations FOR DELETE TO authenticated USING (true);

-- Client Contacts policies
DROP POLICY IF EXISTS "Allow authenticated users to view client_contacts" ON client_contacts;
CREATE POLICY "Allow authenticated users to view client_contacts" ON client_contacts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert client_contacts" ON client_contacts;
CREATE POLICY "Allow authenticated users to insert client_contacts" ON client_contacts FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users to update client_contacts" ON client_contacts;
CREATE POLICY "Allow authenticated users to update client_contacts" ON client_contacts FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to delete client_contacts" ON client_contacts;
CREATE POLICY "Allow authenticated users to delete client_contacts" ON client_contacts FOR DELETE TO authenticated USING (true);

-- Employee Contracts policies
DROP POLICY IF EXISTS "Allow authenticated users to view employee_contracts" ON employee_contracts;
CREATE POLICY "Allow authenticated users to view employee_contracts" ON employee_contracts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert employee_contracts" ON employee_contracts;
CREATE POLICY "Allow authenticated users to insert employee_contracts" ON employee_contracts FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users to update employee_contracts" ON employee_contracts;
CREATE POLICY "Allow authenticated users to update employee_contracts" ON employee_contracts FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to delete employee_contracts" ON employee_contracts;
CREATE POLICY "Allow authenticated users to delete employee_contracts" ON employee_contracts FOR DELETE TO authenticated USING (true);

-- Employee Contributions policies
DROP POLICY IF EXISTS "Allow authenticated users to view employee_contributions" ON employee_contributions;
CREATE POLICY "Allow authenticated users to view employee_contributions" ON employee_contributions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert employee_contributions" ON employee_contributions;
CREATE POLICY "Allow authenticated users to insert employee_contributions" ON employee_contributions FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users to update employee_contributions" ON employee_contributions;
CREATE POLICY "Allow authenticated users to update employee_contributions" ON employee_contributions FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to delete employee_contributions" ON employee_contributions;
CREATE POLICY "Allow authenticated users to delete employee_contributions" ON employee_contributions FOR DELETE TO authenticated USING (true);

-- Services policies (Nova tabela)
DROP POLICY IF EXISTS "Allow authenticated users to view services" ON services;
CREATE POLICY "Allow authenticated users to view services" ON services FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin users to insert services" ON services;
CREATE POLICY "Allow admin users to insert services" ON services FOR INSERT TO authenticated WITH CHECK (true); -- Somente admin poderia inserir, mas vamos simplificar por agora
DROP POLICY IF EXISTS "Allow admin users to update services" ON services;
CREATE POLICY "Allow admin users to update services" ON services FOR UPDATE TO authenticated USING (true); -- Somente admin poderia atualizar
DROP POLICY IF EXISTS "Allow admin users to delete services" ON services;
CREATE POLICY "Allow admin users to delete services" ON services FOR DELETE TO authenticated USING (true); -- Somente admin poderia deletar

-- Client Services policies (Nova tabela)
DROP POLICY IF EXISTS "Allow authenticated users to view client_services" ON client_services;
CREATE POLICY "Allow authenticated users to view client_services" ON client_services FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert client_services" ON client_services;
CREATE POLICY "Allow authenticated users to insert client_services" ON client_services FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users to update client_services" ON client_services;
CREATE POLICY "Allow authenticated users to update client_services" ON client_services FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to delete client_services" ON client_services;
CREATE POLICY "Allow authenticated users to delete client_services" ON client_services FOR DELETE TO authenticated USING (true);


-- Storage Policies (Assume buckets 'contracts' e 'employee_contracts' existem)
-- Policies for 'contracts' bucket (Client contracts)
DROP POLICY IF EXISTS "Allow authenticated read access to contracts" ON storage.objects;
CREATE POLICY "Allow authenticated read access to contracts" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'contracts');
DROP POLICY IF EXISTS "Allow authenticated insert access to contracts" ON storage.objects;
CREATE POLICY "Allow authenticated insert access to contracts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contracts');
DROP POLICY IF EXISTS "Allow authenticated update access to contracts" ON storage.objects;
CREATE POLICY "Allow authenticated update access to contracts" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'contracts');
DROP POLICY IF EXISTS "Allow authenticated delete access to contracts" ON storage.objects;
CREATE POLICY "Allow authenticated delete access to contracts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'contracts');

-- Policies for 'employee_contracts' bucket
DROP POLICY IF EXISTS "Allow authenticated read access to employee contracts" ON storage.objects;
CREATE POLICY "Allow authenticated read access to employee contracts" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'employee_contracts');
DROP POLICY IF EXISTS "Allow authenticated insert access to employee contracts" ON storage.objects;
CREATE POLICY "Allow authenticated insert access to employee contracts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'employee_contracts');
DROP POLICY IF EXISTS "Allow authenticated update access to employee contracts" ON storage.objects;
CREATE POLICY "Allow authenticated update access to employee contracts" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'employee_contracts');
DROP POLICY IF EXISTS "Allow authenticated delete access to employee contracts" ON storage.objects;
CREATE POLICY "Allow authenticated delete access to employee contracts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'employee_contracts');
