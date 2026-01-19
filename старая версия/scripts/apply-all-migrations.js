#!/usr/bin/env node

/**
 * Script to apply all migrations in order
 * Usage: node scripts/apply-all-migrations.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
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

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .limit(0)
  
  return !error || error.code === 'PGRST116' // PGRST116 = empty result
}

async function applyAllMigrations() {
  console.log('🚀 Starting database migration process...\n')

  try {
    // Get all migration files
    const migrationsDir = join(__dirname, '..', 'migrations')
    const migrationFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    console.log(`📁 Found ${migrationFiles.length} migration files:\n`)
    migrationFiles.forEach(f => console.log(`   - ${f}`))
    console.log()

    // Check which migrations need to be applied
    console.log('🔍 Checking current database state...\n')
    
    const productsExist = await checkTableExists('products')
    const likesExist = await checkTableExists('product_likes')
    const reviewsExist = await checkTableExists('reviews')

    console.log(`   Products table: ${productsExist ? '✅ exists' : '❌ missing'}`)
    console.log(`   Product_likes table: ${likesExist ? '✅ exists' : '❌ missing'}`)
    console.log(`   Reviews table: ${reviewsExist ? '✅ exists' : '❌ missing'}`)
    console.log()

    if (!productsExist) {
      console.log('⚠️  Base tables missing. You need to apply migrations manually.')
      console.log('\n📋 Please follow these steps:\n')
      console.log('1. Open Supabase Dashboard: https://app.supabase.com')
      console.log('2. Go to SQL Editor')
      console.log('3. Apply migrations in order:\n')
      
      migrationFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. Copy content from: migrations/${file}`)
        console.log(`      Paste in SQL Editor and click "Run"\n`)
      })
      
      console.log('💡 Or use psql:')
      console.log('   psql $DATABASE_URL -f migrations/001_initial_schema.sql')
      console.log('   psql $DATABASE_URL -f migrations/002_add_likes_system.sql')
      console.log('   psql $DATABASE_URL -f migrations/003_add_likes_count.sql')
      console.log('   psql $DATABASE_URL -f migrations/004_admins.sql')
      console.log('   psql $DATABASE_URL -f migrations/005_add_reviews_system.sql')
      
      return
    }

    if (reviewsExist) {
      console.log('✅ All migrations already applied!')
      return
    }

    // Apply reviews migration
    console.log('📊 Applying reviews migration...\n')
    const migrationPath = join(migrationsDir, '005_add_reviews_system.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('⚠️  Note: This script cannot directly execute SQL.')
    console.log('Please apply the migration manually:\n')
    console.log('1. Open Supabase Dashboard SQL Editor')
    console.log('2. Copy content from: migrations/005_add_reviews_system.sql')
    console.log('3. Paste and click "Run"')
    console.log('\nOr use: psql $DATABASE_URL -f migrations/005_add_reviews_system.sql')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run migration check
applyAllMigrations()
