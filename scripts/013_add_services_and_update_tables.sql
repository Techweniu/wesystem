-- Inserir lista de serviços disponíveis
INSERT INTO services (name) VALUES
  ('Gestão de redes sociais'),
  ('Produção de publicações para Instagram e Facebook'),
  ('Gravação de audiovisual'),
  ('Produção e gestão de anúncios online'),
  ('Produção e gestão de sites ou "landing pages"'),
  ('DAZAH'),
  ('Árvore de links'),
  ('Google Meu Negócio'),
  ('NIUcast'),
  ('Gestão de dados (business intelligence)'),
  ('Instagram Stories, Facebook Stories e YouTube Shorts'),
  ('Pesquisa de público, preço e praça'),
  ('Gerenciamento de perfil pessoal'),
  ('Gestão de Marketplace'),
  ('Criação e gestão de e-commerce'),
  ('Estratégias de pontos de venda'),
  ('Gestão e criação de sistema de gerenciamento de relacionamento com o cliente (CRM)'),
  ('Cobertura audiovisual de eventos'),
  ('Gestão de divulgação dos clientes ou gestão de conteúdo gerado pelo usuário (UGC)'),
  ('Produção e gravação de lives em redes sociais'),
  ('Produção de mídia para fins estranhos a este contrato'),
  ('Aluguel de estúdio'),
  ('Consultoria Comercial'),
  ('Criação e Gestão de canal no YouTube')
ON CONFLICT (name) DO NOTHING;

-- Adicionar coluna services (JSONB array) na tabela one_time_services
ALTER TABLE one_time_services ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;

-- Adicionar coluna services (JSONB array) na tabela client_upsells
ALTER TABLE client_upsells ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;
