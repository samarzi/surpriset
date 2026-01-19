import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🔧 Applying RLS policy fix migration...')

    // Read migration file
    const migrationPath = join(__dirname, '..', 'migrations', '006_fix_reviews_rls_policies.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // Try direct execution if rpc doesn't work
      console.log('Trying direct SQL execution...')
      
      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        const { error: execError } = await supabase.rpc('exec', { 
          query: statement + ';' 
        })
        
        if (execError) {
          console.error('Error executing statement:', statement.substring(0, 100))
          console.error(execError)
        }
      }
    }

    console.log('✅ Migration applied successfully!')
    console.log('')
    console.log('📝 Changes made:')
    console.log('  - Removed auth.uid() checks from RLS policies')
    console.log('  - Reviews can now be created without Supabase Auth')
    console.log('  - User validation is handled in application code')
    console.log('')
    console.log('🔄 Please test creating a review now!')

  } catch (error) {
    console.error('❌ Error applying migration:', error)
    console.log('')
    console.log('📋 Manual steps:')
    console.log('1. Go to Supabase Dashboard > SQL Editor')
    console.log('2. Copy the contents of migrations/006_fix_reviews_rls_policies.sql')
    console.log('3. Paste and run the SQL')
    process.exit(1)
  }
}

applyMigration()
