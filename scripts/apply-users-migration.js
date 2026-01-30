const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyUsersMigration() {
  try {
    console.log('Applying users table migration...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create users table for browser authentication
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            telegram_id BIGINT UNIQUE,
            telegram_username VARCHAR(255),
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            phone VARCHAR(50),
            email VARCHAR(255),
            password_hash VARCHAR(255), -- Hashed password for browser login
            password_enabled BOOLEAN DEFAULT false, -- Whether user has enabled password
            is_admin BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
        CREATE INDEX IF NOT EXISTS idx_users_telegram_username ON users(telegram_username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

        -- Enable RLS
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;

        -- Policies
        CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON users
            FOR SELECT USING (
                telegram_id = current_setting('app.current_user_id', true)::BIGINT
            );

        CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON users
            FOR UPDATE USING (
                telegram_id = current_setting('app.current_user_id', true)::BIGINT
            );

        CREATE POLICY IF NOT EXISTS "Admin can manage all users" ON users
            FOR ALL USING (true);
      `
    });

    if (error) {
      console.error('Error applying migration:', error);
      process.exit(1);
    }

    console.log('✅ Users table migration applied successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyUsersMigration();
