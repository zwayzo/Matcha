-- Add fame_rating column to profile table
ALTER TABLE profile ADD COLUMN IF NOT EXISTS fame_rating INTEGER DEFAULT 0;

-- Update existing records to have a default fame rating
UPDATE profile SET fame_rating = 0 WHERE fame_rating IS NULL;