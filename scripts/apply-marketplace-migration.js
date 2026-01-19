import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    
    // Read migration file
    const migrationPath = join(__dirname, '..', 'migrations', '008_add_marketplace_import_fields.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('New fields added to products table:');
    console.log('  - is_imported: boolean (default false)');
    console.log('  - source_url: text (marketplace URL)');
    console.log('  - last_price_check_at: timestamp');
    console.log('');
    console.log('✨ You can now import products from marketplaces!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

applyMigration();
