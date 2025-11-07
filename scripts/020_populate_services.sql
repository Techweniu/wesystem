-- Popula a tabela de serviços com opções comuns de agência digital

INSERT INTO services (id, name, description) VALUES
  (gen_random_uuid(), 'Gestão de Tráfego Pago', 'Gerenciamento de campanhas de anúncios pagos (Google Ads, Meta Ads, etc.)'),
  (gen_random_uuid(), 'Social Media', 'Criação de conteúdo e gestão de redes sociais'),
  (gen_random_uuid(), 'Design Gráfico', 'Criação de peças gráficas, identidade visual e materiais de marketing'),
  (gen_random_uuid(), 'Desenvolvimento Web', 'Criação e manutenção de sites e landing pages'),
  (gen_random_uuid(), 'SEO', 'Otimização para mecanismos de busca'),
  (gen_random_uuid(), 'Produção de Vídeo', 'Criação de vídeos institucionais, comerciais e para redes sociais'),
  (gen_random_uuid(), 'Copywriting', 'Redação publicitária e criação de conteúdo escrito'),
  (gen_random_uuid(), 'Email Marketing', 'Criação e gestão de campanhas de email marketing'),
  (gen_random_uuid(), 'Consultoria Digital', 'Consultoria estratégica em marketing digital'),
  (gen_random_uuid(), 'Branding', 'Desenvolvimento e gestão de marca')
-- Corrigido ON CONFLICT para usar name ao invés de id
ON CONFLICT (name) DO NOTHING;
