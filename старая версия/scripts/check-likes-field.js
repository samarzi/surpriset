import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmcedkzodiqcxnpenjld.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2Vka3pvZGlxY3hucGVuamxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjQyMTAsImV4cCI6MjA4MDIwMDIxMH0.rb6MkZ0l1Wh6bFp0KNAvUKPchbYMoZVgwDFEUnNDhcE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLikesField() {
  console.log('🔍 Checking likes_count field...');

  try {
    // Try to select likes_count field
    const { data, error } = await supabase
      .from('products')
      .select('id, name, likes_count')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing likes_count field:', error.message);
    } else {
      console.log('✅ likes_count field exists');
      console.log('Sample data:', data);
    }

    // Check if product_likes table exists
    const { data: likesData, error: likesError } = await supabase
      .from('product_likes')
      .select('*')
      .limit(1);

    if (likesError) {
      console.error('❌ product_likes table issue:', likesError.message);
    } else {
      console.log('✅ product_likes table exists');
      console.log('Likes data:', likesData);
    }

    // Test adding a like
    console.log('🧪 Testing like functionality...');
    const testSession = 'test_' + Date.now();
    
    if (data && data.length > 0) {
      const productId = data[0].id;
      
      // Add like
      const { error: addError } = await supabase
        .from('product_likes')
        .insert({ product_id: productId, user_session: testSession });
      
      if (addError) {
        console.error('❌ Failed to add like:', addError.message);
      } else {
        console.log('✅ Like added successfully');
        
        // Remove like
        const { error: removeError } = await supabase
          .from('product_likes')
          .delete()
          .eq('product_id', productId)
          .eq('user_session', testSession);
        
        if (removeError) {
          console.error('❌ Failed to remove like:', removeError.message);
        } else {
          console.log('✅ Like removed successfully');
        }
      }
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

checkLikesField();