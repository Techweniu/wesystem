-- Enable Row Level Security on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- For this BI dashboard, we'll use a simple policy that allows authenticated users to access all data
-- In a production environment, you would want more granular policies based on user roles

-- Clients policies
CREATE POLICY "Allow authenticated users to view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

-- Contracts policies
CREATE POLICY "Allow authenticated users to view contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete contracts"
  ON contracts FOR DELETE
  TO authenticated
  USING (true);

-- One-time services policies
CREATE POLICY "Allow authenticated users to view one_time_services"
  ON one_time_services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert one_time_services"
  ON one_time_services FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update one_time_services"
  ON one_time_services FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete one_time_services"
  ON one_time_services FOR DELETE
  TO authenticated
  USING (true);

-- NPS responses policies
CREATE POLICY "Allow authenticated users to view nps_responses"
  ON nps_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert nps_responses"
  ON nps_responses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update nps_responses"
  ON nps_responses FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete nps_responses"
  ON nps_responses FOR DELETE
  TO authenticated
  USING (true);

-- Costs policies
CREATE POLICY "Allow authenticated users to view costs"
  ON costs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert costs"
  ON costs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update costs"
  ON costs FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete costs"
  ON costs FOR DELETE
  TO authenticated
  USING (true);

-- Employees policies
CREATE POLICY "Allow authenticated users to view employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (true);

-- Time logs policies
CREATE POLICY "Allow authenticated users to view time_logs"
  ON time_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert time_logs"
  ON time_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update time_logs"
  ON time_logs FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete time_logs"
  ON time_logs FOR DELETE
  TO authenticated
  USING (true);
