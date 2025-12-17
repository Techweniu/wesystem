-- Remove a restrição antiga que permitia apenas 'positive' e 'negative'
ALTER TABLE employee_observations DROP CONSTRAINT IF EXISTS employee_observations_tag_check;

-- Adiciona a nova restrição abrangendo todas as tags definidas no actions.ts
ALTER TABLE employee_observations ADD CONSTRAINT employee_observations_tag_check 
CHECK (tag IN (
    'feedback_positivo', 
    'feedback_negativo', 
    'reuniao_1_1', 
    'desenvolvimento', 
    'performance', 
    'comportamento', 
    'geral', 
    'positive', 
    'negative'
));
