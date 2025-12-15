-- Adiciona colunas de fluxo de aprovação para CUSTOS
ALTER TABLE public.costs
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by TEXT, -- Nome de quem aprovou (ex: 'Paulo', 'Admin')
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Adiciona colunas de fluxo de aprovação para CONTRATOS (Receita Recorrente)
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Adiciona colunas de fluxo de aprovação para SERVIÇOS PONTUAIS (Receita Única)
ALTER TABLE public.one_time_services
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Adiciona colunas de fluxo de aprovação para PAGAMENTOS EXTRAS DE FUNCIONÁRIOS
ALTER TABLE public.employee_payments
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Adiciona colunas de fluxo de aprovação para CONTRIBUIÇÕES/COMISSÕES
ALTER TABLE public.employee_contributions
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Cria índices para garantir performance ao filtrar "o que está pendente"
CREATE INDEX IF NOT EXISTS idx_costs_approval_status ON public.costs(approval_status);
CREATE INDEX IF NOT EXISTS idx_contracts_approval_status ON public.contracts(approval_status);
CREATE INDEX IF NOT EXISTS idx_one_time_services_approval_status ON public.one_time_services(approval_status);
CREATE INDEX IF NOT EXISTS idx_employee_payments_approval_status ON public.employee_payments(approval_status);
CREATE INDEX IF NOT EXISTS idx_employee_contributions_approval_status ON public.employee_contributions(approval_status);
