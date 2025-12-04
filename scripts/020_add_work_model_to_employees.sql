-- Cria o tipo ENUM para o modelo de trabalho (opcional, mas recomendado para integridade)
-- Ou podemos usar TEXT com CHECK constraint para simplificar em ambientes sem permissão de criar types
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS work_model TEXT CHECK (work_model IN ('presential', 'home_office'));

-- Adiciona a coluna de unidade/localização
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS office_location TEXT CHECK (office_location IN ('Itumbiara', 'Uberlândia'));

-- Comentário: A coluna office_location só deve ser preenchida se work_model for 'presential',
-- mas vamos controlar essa lógica na aplicação (Action) para flexibilidade.
