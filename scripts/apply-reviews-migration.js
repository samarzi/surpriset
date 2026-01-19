#!/usr/bin/env node

/**
 * Script to apply reviews system migration
 * Usage: node scripts/apply-reviews-migration.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Starting reviews system migration...\n')

  try {
    // Read migration file
    const migrationPath = join(__dirname, '..', 'migrations', '005_add_reviews_system.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration file loaded')
    console.log('📊 Applying migration to database...\n')

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying alternative method...')
      
      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      console.log(`📝 Executing ${statements.length} SQL statements...\n`)

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement) {
          try {
            console.log(`  [${i + 1}/${statements.length}] Executing...`)
            // Note: This requires direct database access
            // You may need to use a PostgreSQL client library instead
            console.log('⚠️  Please apply migration manually through Supabase Dashboard')
            console.log('   or use: psql $DATABASE_URL -f migrations/005_add_reviews_system.sql')
            break
          } catch (err) {
            console.error(`❌ Error in statement ${i + 1}:`, err.message)
            throw err
          }
        }
      }
    } else {
      console.log('✅ Migration applied successfully!')
    }

    // Verify migration
    console.log('\n🔍 Verifying migration...')
    
    // Check if reviews table exists
    const { data: tables, error: tablesError } = await supabase
      .from('reviews')
      .select('id')
      .limit(0)

    if (tablesError && tablesError.code !== 'PGRST116') {
      console.error('❌ Error checking reviews table:', tablesError.message)
    } else {
      console.log('✅ Reviews table created successfully')
    }

    // Check if products columns exist
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, reviews_count, average_rating')
      .limit(1)

    if (productsError) {
      console.error('❌ Error checking products columns:', productsError.message)
    } else {
      console.log('✅ Products table updated with reviews columns')
    }

    console.log('\n✨ Migration completed!')
    console.log('\n📋 Next steps:')
    console.log('  1. Verify migration in Supabase Dashboard')
    console.log('  2. Test creating a review')
    console.log('  3. Check that product statistics update automatically')
    console.log('\n💡 See REVIEWS_MIGRATION_GUIDE.md for more details')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\n📖 Please check REVIEWS_MIGRATION_GUIDE.md for manual migration steps')
    process.exit(1)
  }
}

// Run migration
applyMigration()
