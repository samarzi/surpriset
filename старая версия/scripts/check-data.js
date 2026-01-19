import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rmcedkzodiqcxnpenjld.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2Vka3pvZGlxY3hucGVuamxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjQyMTAsImV4cCI6MjA4MDIwMDIxMH0.rb6MkZ0l1Wh6bFp0KNAvUKPchbYMoZVgwDFEUnNDhcE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkData() {
  try {
    console.log('🔍 Checking database data...')
    
    // Check products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5)
    
    if (productsError) {
      console.error('❌ Products table error:', productsError.message)
    } else {
      console.log(`✅ Products table: ${products?.length || 0} items found`)
      if (products && products.length > 0) {
        console.log('   Sample product:', products[0].name)
      }
    }
    
    // Check banners
    const { data: banners, error: bannersError } = await supabase
      .from('banners')
      .select('*')
      .limit(5)
    
    if (bannersError) {
      console.error('❌ Banners table error:', bannersError.message)
    } else {
      console.log(`✅ Banners table: ${banners?.length || 0} items found`)
      if (banners && banners.length > 0) {
        console.log('   Sample banner:', banners[0].title)
      }
    }
    
    // Check orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5)
    
    if (ordersError) {
      console.error('❌ Orders table error:', ordersError.message)
    } else {
      console.log(`✅ Orders table: ${orders?.length || 0} items found`)
    }
    
  } catch (error) {
    console.error('💥 Data check failed:', error.message)
  }
}

checkData()