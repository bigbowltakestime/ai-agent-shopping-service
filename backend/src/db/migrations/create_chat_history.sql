-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on timestamp for chronological ordering
CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp DESC);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_chat_history_role ON chat_history(role);
