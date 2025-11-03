-- Cria o bucket para armazenar comprovantes financeiros no Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('financial-proofs', 'financial-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Configura políticas de acesso ao bucket
-- Permite que usuários autenticados façam upload
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'financial-proofs');

-- Permite que todos vejam os arquivos (bucket público)
CREATE POLICY "Arquivos são públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'financial-proofs');

-- Permite que usuários autenticados deletem seus próprios arquivos
CREATE POLICY "Usuários podem deletar seus arquivos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'financial-proofs');
