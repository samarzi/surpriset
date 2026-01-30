-- Create users table for browser authentication
CREATE TABLE users (
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
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_telegram_username ON users(telegram_username);
CREATE INDEX idx_users_email ON users(email);

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (
        telegram_id = current_setting('app.current_user_id', true)::BIGINT
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (
        telegram_id = current_setting('app.current_user_id', true)::BIGINT
    );

CREATE POLICY "Admin can manage all users" ON users
    FOR ALL USING (true);
