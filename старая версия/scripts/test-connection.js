import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rmcedkzodiqcxnpenjld.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2Vka3pvZGlxY3hucGVuamxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjQyMTAsImV4cCI6MjA4MDIwMDIxMH0.rb6MkZ0l1Wh6bFp0KNAvUKPchbYMoZVgwDFEUnNDhcE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('📊 Project URL:', supabaseUrl)
    
    // Try to list tables (this will fail if no tables exist, which is expected)
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
      
      if (tablesError) {
        console.log('⚠️  Cannot list tables (this is normal if no tables exist yet)')
      } else {
        console.log('📋 Available tables:', tables?.map(t => t.table_name) || [])
      }
    } catch (e) {
      console.log('⚠️  Tables not accessible yet (run migration first)')
    }
    
    console.log('\n📋 Next steps:')
    console.log('1. Go to https://supabase.com/dashboard/project/rmcedkzodiqcxnpenjld')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of migrations/001_initial_schema.sql')
    console.log('4. Run the SQL script')
    console.log('5. Then run: npm run db:setup')
    
  } catch (error) {
    console.error('💥 Connection test failed:', error.message)
  }
}

testConnection()