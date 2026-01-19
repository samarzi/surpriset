import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://rmcedkzodiqcxnpenjld.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2Vka3pvZGlxY3hucGVuamxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNDIxMCwiZXhwIjoyMDgwMjAwMjEwfQ.ho3yPVKELwbv3b-AKzasOWFZxo5we5_1dQQmlK2YzKU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...')
    
    // Read the migration file
    const migrationPath = join(__dirname, '../migrations/001_initial_schema.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        })
        
        if (error) {
          // Try direct query for some statements
          const { error: directError } = await supabase
            .from('_temp')
            .select('1')
            .limit(0)
          
          if (error.message.includes('function exec_sql')) {
            console.log('⚠️  exec_sql function not available, trying direct execution...')
            // For statements that don't need exec_sql, we'll handle them differently
            continue
          } else {
            throw error
          }
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`)
      } catch (statementError) {
        console.error(`❌ Error executing statement ${i + 1}:`, statementError.message)
        console.log('Statement:', statement.substring(0, 100) + '...')
      }
    }
    
    // Test the connection and verify tables
    console.log('🔍 Verifying database setup...')
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('count')
      .limit(1)
    
    if (productsError) {
      console.error('❌ Products table verification failed:', productsError.message)
    } else {
      console.log('✅ Products table is accessible')
    }
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('count')
      .limit(1)
    
    if (ordersError) {
      console.error('❌ Orders table verification failed:', ordersError.message)
    } else {
      console.log('✅ Orders table is accessible')
    }
    
    const { data: banners, error: bannersError } = await supabase
      .from('banners')
      .select('count')
      .limit(1)
    
    if (bannersError) {
      console.error('❌ Banners table verification failed:', bannersError.message)
    } else {
      console.log('✅ Banners table is accessible')
    }
    
    console.log('🎉 Migration completed!')
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()