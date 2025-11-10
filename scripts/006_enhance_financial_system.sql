-- Add new columns to costs table for better categorization
ALTER TABLE costs ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE costs ADD COLUMN IF NOT EXISTS cost_type TEXT CHECK (cost_type IN ('fixed', 'variable', 'salary', 'operational', 'marketing', 'other'));
ALTER TABLE costs ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE costs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE costs ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- CORREÇÃO AQUI: O status padrão agora é 'pending'
ALTER TABLE costs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'cancelled'));

-- Create cost_categories table for better organization
CREATE TABLE IF NOT EXISTS cost_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cost_subcategories table
CREATE TABLE IF NOT EXISTS cost_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES cost_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- Insert default categories
INSERT INTO cost_categories (name, description, color) VALUES
  ('Pessoal', 'Custos relacionados a funcionários', '#3b82f6'),
  ('Operacional', 'Custos operacionais do dia a dia', '#10b981'),
  ('Marketing', 'Investimentos em marketing e publicidade', '#f59e0b'),
  ('Infraestrutura', 'Servidores, software e ferramentas', '#8b5cf6'),
  ('Administrativo', 'Custos administrativos gerais', '#6b7280'),
  ('Outros', 'Outros custos diversos', '#64748b')
ON CONFLICT (name) DO NOTHING;

-- Insert default subcategories
INSERT INTO cost_subcategories (category_id, name, description)
SELECT 
  c.id,
  sub.name,
  sub.description
FROM cost_categories c
CROSS JOIN (
  VALUES 
    ('Pessoal', 'Salários', 'Pagamentos de salários'),
    ('Pessoal', 'Benefícios', 'Vale transporte, alimentação, etc'),
    ('Pessoal', 'Encargos', 'INSS, FGTS e outros encargos'),
    ('Pessoal', 'Treinamento', 'Cursos e capacitações'),
    ('Operacional', 'Aluguel', 'Aluguel de escritório'),
    ('Operacional', 'Energia', 'Conta de luz'),
    ('Operacional', 'Internet', 'Serviços de internet'),
    ('Operacional', 'Telefonia', 'Telefone e celular'),
    ('Operacional', 'Material', 'Material de escritório'),
    ('Marketing', 'Anúncios', 'Google Ads, Facebook Ads, etc'),
    ('Marketing', 'Conteúdo', 'Produção de conteúdo'),
    ('Marketing', 'Eventos', 'Participação em eventos'),
    ('Infraestrutura', 'Servidores', 'AWS, Vercel, etc'),
    ('Infraestrutura', 'Software', 'Licenças de software'),
    ('Infraestrutura', 'Ferramentas', 'Ferramentas de trabalho'),
    ('Administrativo', 'Contabilidade', 'Serviços contábeis'),
    ('Administrativo', 'Jurídico', 'Serviços jurídicos'),
    ('Administrativo', 'Bancário', 'Taxas bancárias')
) AS sub(cat_name, name, description)
WHERE c.name = sub.cat_name
ON CONFLICT (category_id, name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_costs_cost_type ON costs(cost_type);
CREATE INDEX IF NOT EXISTS idx_costs_employee_id ON costs(employee_id);
CREATE INDEX IF NOT EXISTS idx_costs_status ON costs(status);
CREATE INDEX IF NOT EXISTS idx_costs_date ON costs(date);
CREATE INDEX IF NOT EXISTS idx_cost_subcategories_category_id ON cost_subcategories(category_id);
