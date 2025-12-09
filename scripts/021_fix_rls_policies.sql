-- Fix RLS Policies to be granular based on system_role and assignments
-- Replaces permissive policies from 002_enable_rls.sql

-- 1. Helper Functions to get current user context securely
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.jwt() ->> 'email';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_employee_role()
RETURNS public.system_role_enum AS $$
DECLARE
  v_role public.system_role_enum;
BEGIN
  -- Busca o papel do funcionário baseado no email do usuário autenticado
  SELECT system_role INTO v_role
  FROM public.employees
  WHERE email = auth.jwt() ->> 'email';
  
  -- Se não encontrar (ex: primeiro login), assume 'limited' por segurança, ou 'admin' se for o primeiro usuário do sistema (opcional, aqui assumimos limited)
  RETURN COALESCE(v_role, 'limited');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM public.employees
  WHERE email = auth.jwt() ->> 'email';
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Clients Table Policies
DROP POLICY IF EXISTS "Allow authenticated users to view clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON clients;

-- SELECT: Admins veem tudo. Limited veem apenas se forem Gestor ou Editor do cliente.
CREATE POLICY "Clients Visibility" ON clients FOR SELECT TO authenticated
USING (
  get_current_employee_role() = 'admin' 
  OR assigned_relationship_manager_id = get_current_employee_id()
  OR assigned_editor_id = get_current_employee_id()
);

-- INSERT/DELETE: Apenas Admins.
CREATE POLICY "Clients Insert Admin Only" ON clients FOR INSERT TO authenticated
WITH CHECK (get_current_employee_role() = 'admin');

CREATE POLICY "Clients Delete Admin Only" ON clients FOR DELETE TO authenticated
USING (get_current_employee_role() = 'admin');

-- UPDATE: Admins ou o próprio Gestor/Editor (para atualizar notas, etc).
CREATE POLICY "Clients Update" ON clients FOR UPDATE TO authenticated
USING (
  get_current_employee_role() = 'admin' 
  OR assigned_relationship_manager_id = get_current_employee_id()
  OR assigned_editor_id = get_current_employee_id()
);


-- 3. Child Tables (Contracts, Services, etc) should inherit visibility logic
-- Helper policy condition: user can see the client
-- NOTE: RLS checks are row-by-row. Doing a subquery on 'clients' works because 'clients' has its own RLS.

-- Contracts
DROP POLICY IF EXISTS "Allow authenticated users to view contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated users to insert contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated users to update contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated users to delete contracts" ON contracts;

CREATE POLICY "Contracts Visibility" ON contracts FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = contracts.client_id)
);

-- Modification of Contracts: Only Admin
CREATE POLICY "Contracts Manage Admin" ON contracts FOR ALL TO authenticated
USING (get_current_employee_role() = 'admin')
WITH CHECK (get_current_employee_role() = 'admin');


-- Client Services (Tasks)
DROP POLICY IF EXISTS "Allow authenticated users to view client_services" ON client_services;
DROP POLICY IF EXISTS "Allow authenticated users to insert client_services" ON client_services;
DROP POLICY IF EXISTS "Allow authenticated users to update client_services" ON client_services;
DROP POLICY IF EXISTS "Allow authenticated users to delete client_services" ON client_services;

-- View: Se vê o cliente, vê os serviços
CREATE POLICY "Client Services Visibility" ON client_services FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = client_services.client_id)
);

-- Update: Admins ou quem vê o cliente (para marcar como feito)
CREATE POLICY "Client Services Update" ON client_services FOR UPDATE TO authenticated
USING (
  get_current_employee_role() = 'admin' OR
  EXISTS (SELECT 1 FROM clients WHERE clients.id = client_services.client_id)
);

-- Insert/Delete: Admin only (Geralmente configuração de contrato)
CREATE POLICY "Client Services Manage Admin" ON client_services FOR INSERT TO authenticated
WITH CHECK (get_current_employee_role() = 'admin');
CREATE POLICY "Client Services Delete Admin" ON client_services FOR DELETE TO authenticated
USING (get_current_employee_role() = 'admin');


-- 4. Financial & Sensitive Data (Costs, Employee Payments)
-- Costs: Only Admin should see/edit company costs
DROP POLICY IF EXISTS "Allow authenticated users to view costs" ON costs;
DROP POLICY IF EXISTS "Allow authenticated users to insert costs" ON costs;
DROP POLICY IF EXISTS "Allow authenticated users to update costs" ON costs;
DROP POLICY IF EXISTS "Allow authenticated users to delete costs" ON costs;

CREATE POLICY "Costs Admin Only" ON costs FOR ALL TO authenticated
USING (get_current_employee_role() = 'admin')
WITH CHECK (get_current_employee_role() = 'admin');

-- Employee Payments: Only Admin or the employee themselves
DROP POLICY IF EXISTS "Allow authenticated users to view employee_payments" ON employee_payments;
DROP POLICY IF EXISTS "Allow authenticated users to insert employee_payments" ON employee_payments;
DROP POLICY IF EXISTS "Allow authenticated users to update employee_payments" ON employee_payments;
DROP POLICY IF EXISTS "Allow authenticated users to delete employee_payments" ON employee_payments;

CREATE POLICY "Employee Payments Visibility" ON employee_payments FOR SELECT TO authenticated
USING (
  get_current_employee_role() = 'admin' OR
  employee_id = get_current_employee_id()
);

CREATE POLICY "Employee Payments Manage Admin" ON employee_payments FOR INSERT TO authenticated
WITH CHECK (get_current_employee_role() = 'admin');

CREATE POLICY "Employee Payments Update Admin" ON employee_payments FOR UPDATE TO authenticated
USING (get_current_employee_role() = 'admin');

CREATE POLICY "Employee Payments Delete Admin" ON employee_payments FOR DELETE TO authenticated
USING (get_current_employee_role() = 'admin');


-- 5. Employees Table
-- Needed for dropdowns, etc. Allow SELECT for all, but Manage for Admin only.
DROP POLICY IF EXISTS "Allow authenticated users to view employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to insert employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to update employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to delete employees" ON employees;

CREATE POLICY "Employees Visibility" ON employees FOR SELECT TO authenticated
USING (true); -- Allow viewing basic profile info (needed for UI assignments)

CREATE POLICY "Employees Manage Admin" ON employees FOR ALL TO authenticated
USING (get_current_employee_role() = 'admin')
WITH CHECK (get_current_employee_role() = 'admin');

-- NOTE: Ideally, salary data should be in a separate table or protected by a view, 
-- but restricting UPDATE prevents users from giving themselves raises.
