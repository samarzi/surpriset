-- Admin users table for Telegram-based access control
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  telegram_id BIGINT,
  first_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed main admin from Telegram
INSERT INTO admins (username, telegram_id, first_name)
VALUES ('t0g0r0t', 1346574159, 'samarzi')
ON CONFLICT (username) DO NOTHING;

-- Basic policies (development): allow all operations
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access" ON admins
  FOR ALL USING (true);
