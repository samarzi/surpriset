import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmcedkzodiqcxnpenjld.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2Vka3pvZGlxY3hucGVuamxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjQyMTAsImV4cCI6MjA4MDIwMDIxMH0.rb6MkZ0l1Wh6bFp0KNAvUKPchbYMoZVgwDFEUnNDhcE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCRUD() {
  console.log('🧪 Testing CRUD operations...');

  try {
    // Test CREATE
    console.log('➕ Testing CREATE...');
    const testProduct = {
      sku: 'TEST-' + Date.now(),
      name: 'Тестовый товар',
      description: 'Описание тестового товара',
      price: 999.99,
      images: ['https://example.com/test.jpg'],
      tags: ['тест'],
      status: 'in_stock',
      type: 'product',
      is_featured: false,
      likes_count: 0
    };

    const { data: createdProduct, error: createError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    if (createError) {
      console.error('❌ CREATE failed:', createError.message);
      return;
    }

    console.log('✅ CREATE successful:', createdProduct.name);

    // Test READ
    console.log('📖 Testing READ...');
    const { data: readProduct, error: readError } = await supabase
      .from('products')
      .select('*')
      .eq('id', createdProduct.id)
      .single();

    if (readError) {
      console.error('❌ READ failed:', readError.message);
      return;
    }

    console.log('✅ READ successful:', readProduct.name);

    // Test UPDATE
    console.log('✏️ Testing UPDATE...');
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({ 
        name: 'Обновленный тестовый товар',
        price: 1299.99,
        tags: ['тест', 'обновлено']
      })
      .eq('id', createdProduct.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ UPDATE failed:', updateError.message);
      return;
    }

    console.log('✅ UPDATE successful:', updatedProduct.name, updatedProduct.price);

    // Test DELETE
    console.log('🗑️ Testing DELETE...');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', createdProduct.id);

    if (deleteError) {
      console.error('❌ DELETE failed:', deleteError.message);
      return;
    }

    console.log('✅ DELETE successful');

    // Verify deletion
    const { data: deletedCheck, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('id', createdProduct.id);

    if (checkError) {
      console.error('❌ DELETE verification failed:', checkError.message);
      return;
    }

    if (deletedCheck.length === 0) {
      console.log('✅ DELETE verified - product no longer exists');
    } else {
      console.log('❌ DELETE verification failed - product still exists');
    }

    console.log('🎉 All CRUD operations completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCRUD();