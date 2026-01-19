import { supabase } from '../src/lib/supabase.js';

async function testLikesSystem() {
  console.log('🧪 Testing likes system...');

  try {
    // Get first product
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, likes_count')
      .limit(1);

    if (productsError) throw productsError;
    if (!products || products.length === 0) {
      console.log('❌ No products found');
      return;
    }

    const product = products[0];
    console.log(`📦 Testing with product: ${product.name} (current likes: ${product.likes_count})`);

    // Test user session
    const userSession = 'test_user_' + Date.now();
    console.log(`👤 Using test user session: ${userSession}`);

    // Add like
    console.log('➕ Adding like...');
    const { error: addError } = await supabase
      .from('product_likes')
      .insert({ product_id: product.id, user_session: userSession });

    if (addError) throw addError;

    // Check updated likes count
    const { data: updatedProduct, error: checkError } = await supabase
      .from('products')
      .select('likes_count')
      .eq('id', product.id)
      .single();

    if (checkError) throw checkError;

    console.log(`✅ Like added! New count: ${updatedProduct.likes_count}`);

    // Remove like
    console.log('➖ Removing like...');
    const { error: removeError } = await supabase
      .from('product_likes')
      .delete()
      .eq('product_id', product.id)
      .eq('user_session', userSession);

    if (removeError) throw removeError;

    // Check final likes count
    const { data: finalProduct, error: finalError } = await supabase
      .from('products')
      .select('likes_count')
      .eq('id', product.id)
      .single();

    if (finalError) throw finalError;

    console.log(`✅ Like removed! Final count: ${finalProduct.likes_count}`);
    console.log('🎉 Likes system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLikesSystem();