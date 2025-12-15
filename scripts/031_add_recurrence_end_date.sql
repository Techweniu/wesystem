-- Adiciona a coluna para controlar até quando a recorrência deve existir
ALTER TABLE costs ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
