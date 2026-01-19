import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rmcedkzodiqcxnpenjld.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2Vka3pvZGlxY3hucGVuamxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNDIxMCwiZXhwIjoyMDgwMjAwMjEwfQ.ho3yPVKELwbv3b-AKzasOWFZxo5we5_1dQQmlK2YzKU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database with sample data...')
    
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('count')
      .limit(1)
    
    if (testError && testError.message.includes('relation "products" does not exist')) {
      console.log('⚠️  Tables do not exist. Please run the SQL migration manually in Supabase dashboard.')
      console.log('📋 Copy the contents of migrations/001_initial_schema.sql and run it in the SQL editor.')
      return
    }
    
    if (testError) {
      throw testError
    }
    
    console.log('✅ Database connection successful')
    
    // Check if we already have data
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    if (existingProducts && existingProducts.length > 0) {
      console.log('📦 Database already has data, skipping sample data insertion')
      return
    }
    
    // Insert sample products
    console.log('📦 Inserting sample products...')
    const { error: productsError } = await supabase
      .from('products')
      .insert([
        {
          sku: 'GIFT-001',
          name: 'Романтический набор',
          description: 'Идеальный подарок для влюбленных',
          price: 2500.00,
          images: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400'],
          tags: ['романтика', 'любовь'],
          status: 'in_stock',
          type: 'bundle',
          is_featured: true
        },
        {
          sku: 'PROD-001',
          name: 'Свеча ароматическая',
          description: 'Свеча с ароматом ванили',
          price: 450.00,
          images: ['https://images.unsplash.com/photo-1602874801006-e26d3d17d0a5?w=400'],
          tags: ['свечи', 'аромат'],
          status: 'in_stock',
          type: 'product',
          is_featured: false
        },
        {
          sku: 'PROD-002',
          name: 'Шоколад премиум',
          description: 'Бельгийский шоколад ручной работы',
          price: 890.00,
          images: ['https://images.unsplash.com/photo-1511381939415-e44015466834?w=400'],
          tags: ['сладости', 'премиум'],
          status: 'in_stock',
          type: 'product',
          is_featured: true
        },
        {
          sku: 'PROD-003',
          name: 'Мягкая игрушка',
          description: 'Плюшевый мишка 30см',
          price: 1200.00,
          images: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400'],
          tags: ['игрушки', 'детям'],
          status: 'coming_soon',
          type: 'product',
          is_featured: false
        },
        {
          sku: 'GIFT-002',
          name: 'Набор для чая',
          description: 'Элитный чай с аксессуарами',
          price: 3200.00,
          images: ['https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400'],
          tags: ['чай', 'элитный'],
          status: 'in_stock',
          type: 'bundle',
          is_featured: true
        }
      ])
    
    if (productsError) {
      throw productsError
    }
    
    console.log('✅ Sample products inserted')
    
    // Insert sample banners
    console.log('🎨 Inserting sample banners...')
    const { error: bannersError } = await supabase
      .from('banners')
      .insert([
        {
          title: 'Новогодние подарки',
          image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800',
          is_active: true,
          order: 1
        },
        {
          title: 'Скидки до 50%',
          image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800',
          is_active: true,
          order: 2
        },
        {
          title: 'Индивидуальные наборы',
          image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800',
          is_active: false,
          order: 3
        }
      ])
    
    if (bannersError) {
      throw bannersError
    }
    
    console.log('✅ Sample banners inserted')
    
    // Verify the setup
    const { data: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
    
    const { data: bannerCount } = await supabase
      .from('banners')
      .select('id', { count: 'exact' })
    
    console.log(`🎉 Database setup complete!`)
    console.log(`📊 Products: ${productCount?.length || 0}`)
    console.log(`🎨 Banners: ${bannerCount?.length || 0}`)
    
  } catch (error) {
    console.error('💥 Database setup failed:', error.message)
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n📋 Please run the following steps:')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Copy and paste the contents of migrations/001_initial_schema.sql')
      console.log('4. Run the SQL script')
      console.log('5. Then run this setup script again')
    }
    
    process.exit(1)
  }
}

setupDatabase()