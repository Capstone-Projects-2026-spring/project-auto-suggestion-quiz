-- Add teacher feedback column to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS feedback TEXT;
