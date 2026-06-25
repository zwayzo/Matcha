-- Create the missing profile_visits table
-- Run this SQL in your PostgreSQL database

CREATE TABLE IF NOT EXISTS profile_visits (
    id SERIAL PRIMARY KEY,
    visitor_id INTEGER NOT NULL,
    visited_id INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (visitor_id) REFERENCES "user"(id),
    FOREIGN KEY (visited_id) REFERENCES "user"(id)
);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_profile_visits_visited_id ON profile_visits(visited_id);
CREATE INDEX IF NOT EXISTS idx_profile_visits_visitor_id ON profile_visits(visitor_id);

-- Verify the table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profile_visits';