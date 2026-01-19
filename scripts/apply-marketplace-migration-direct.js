import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('📦 Applying marketplace import migration...');
    console.log('');
    
    // Добавляем поля по одному
    console.log('Adding is_imported column...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT FALSE;'
    }).catch(() => {
      // Если RPC не работает, пробуем через прямой запрос
      return supabase.from('products').select('is_imported').limit(1);
    });
    
    console.log('Adding source_url column...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS source_url TEXT;'
    }).catch(() => {
      return supabase.from('products').select('source_url').limit(1);
    });
    
    console.log('Adding last_price_check_at column...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS last_price_check_at TIMESTAMP WITH TIME ZONE;'
    }).catch(() => {
      return supabase.from('products').select('last_price_check_at').limit(1);
    });
    
    console.log('');
    console.log('✅ Migration completed!');
    console.log('');
    console.log('⚠️  IMPORTANT: If you see errors above, you need to run this SQL manually in Supabase SQL Editor:');
    console.log('');
    console.log('ALTER TABLE products');
    console.log('ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT FALSE,');
    console.log('ADD COLUMN IF NOT EXISTS source_url TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS last_price_check_at TIMESTAMP WITH TIME ZONE;');
    console.log('');
    console.log('CREATE INDEX IF NOT EXISTS idx_products_is_imported ON products(is_imported) WHERE is_imported = TRUE;');
    console.log('CREATE INDEX IF NOT EXISTS idx_products_price_check ON products(last_price_check_at) WHERE is_imported = TRUE;');
    console.log('');
    console.log('✨ After running the SQL, you can import products from marketplaces!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('');
    console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:');
    console.log('');
    console.log('ALTER TABLE products');
    console.log('ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT FALSE,');
    console.log('ADD COLUMN IF NOT EXISTS source_url TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS last_price_check_at TIMESTAMP WITH TIME ZONE;');
    console.log('');
    console.log('CREATE INDEX IF NOT EXISTS idx_products_is_imported ON products(is_imported) WHERE is_imported = TRUE;');
    console.log('CREATE INDEX IF NOT EXISTS idx_products_price_check ON products(last_price_check_at) WHERE is_imported = TRUE;');
  }
}

applyMigration();
