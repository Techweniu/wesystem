-- Tabela de Metas Comerciais
CREATE TABLE IF NOT EXISTS commercial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_value DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Oportunidades de Upsell por Cliente
CREATE TABLE IF NOT EXISTS client_upsells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  estimated_value DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'negotiating', 'closed', 'lost')),
  identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_action TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_commercial_goals_period ON commercial_goals(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_client_upsells_client_id ON client_upsells(client_id);
CREATE INDEX IF NOT EXISTS idx_client_upsells_status ON client_upsells(status);

-- RLS Policies para commercial_goals
ALTER TABLE commercial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view commercial_goals"
  ON commercial_goals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert commercial_goals"
  ON commercial_goals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update commercial_goals"
  ON commercial_goals FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete commercial_goals"
  ON commercial_goals FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies para client_upsells
ALTER TABLE client_upsells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view client_upsells"
  ON client_upsells FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert client_upsells"
  ON client_upsells FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update client_upsells"
  ON client_upsells FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete client_upsells"
  ON client_upsells FOR DELETE
  TO authenticated
  USING (true);
