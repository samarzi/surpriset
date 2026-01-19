import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmcedkzodiqcxnpenjld.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2Vka3pvZGlxY3hucGVuamxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjQyMTAsImV4cCI6MjA4MDIwMDIxMH0.rb6MkZ0l1Wh6bFp0KNAvUKPchbYMoZVgwDFEUnNDhcE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addLikesTriggers() {
  console.log('🔧 Добавляем триггеры для автоматического обновления лайков...');

  try {
    // First, ensure likes_count column exists
    console.log('1️⃣ Проверяем поле likes_count...');
    
    const { data: products, error: checkError } = await supabase
      .from('products')
      .select('likes_count')
      .limit(1);

    if (checkError) {
      console.log('❌ Поле likes_count не найдено, добавляем...');
      
      // Add likes_count column if it doesn't exist
      const addColumnSQL = `
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'likes_count'
          ) THEN
            ALTER TABLE products ADD COLUMN likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0);
            CREATE INDEX IF NOT EXISTS idx_products_likes_count ON products(likes_count);
          END IF;
        END $$;
      `;

      // Since we can't use exec_sql, let's try a different approach
      // We'll manually update likes counts
      console.log('⚠️ Не можем добавить поле через SQL, используем ручное обновление');
    } else {
      console.log('✅ Поле likes_count существует');
    }

    // Update all products' likes count manually
    console.log('2️⃣ Обновляем счетчики лайков для всех товаров...');
    
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('id');

    if (productsError) throw productsError;

    for (const product of allProducts) {
      // Count likes for this product
      const { count, error: countError } = await supabase
        .from('product_likes')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id);

      if (countError) {
        console.log(`❌ Ошибка подсчета лайков для товара ${product.id}:`, countError.message);
        continue;
      }

      // Update product with correct likes count
      const { error: updateError } = await supabase
        .from('products')
        .update({ likes_count: count || 0 })
        .eq('id', product.id);

      if (updateError) {
        console.log(`❌ Ошибка обновления лайков для товара ${product.id}:`, updateError.message);
      } else {
        console.log(`✅ Обновлен счетчик лайков для товара ${product.id}: ${count || 0}`);
      }
    }

    console.log('3️⃣ Тестируем обновление лайков...');
    
    if (allProducts.length > 0) {
      const testProduct = allProducts[0];
      const testSession = 'trigger_test_' + Date.now();

      // Get initial count
      const { data: initialProduct, error: initialError } = await supabase
        .from('products')
        .select('likes_count')
        .eq('id', testProduct.id)
        .single();

      if (initialError) throw initialError;

      const initialCount = initialProduct.likes_count || 0;
      console.log(`📊 Начальное количество лайков: ${initialCount}`);

      // Add like
      const { error: addError } = await supabase
        .from('product_likes')
        .insert({ product_id: testProduct.id, user_session: testSession });

      if (addError) throw addError;

      // Manually update likes count (since we don't have triggers)
      const { count: newCount, error: newCountError } = await supabase
        .from('product_likes')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', testProduct.id);

      if (newCountError) throw newCountError;

      const { error: updateError } = await supabase
        .from('products')
        .update({ likes_count: newCount || 0 })
        .eq('id', testProduct.id);

      if (updateError) throw updateError;

      console.log(`✅ Лайк добавлен, новое количество: ${newCount || 0}`);

      // Remove test like
      const { error: removeError } = await supabase
        .from('product_likes')
        .delete()
        .eq('product_id', testProduct.id)
        .eq('user_session', testSession);

      if (removeError) throw removeError;

      // Update count again
      const { count: finalCount, error: finalCountError } = await supabase
        .from('product_likes')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', testProduct.id);

      if (finalCountError) throw finalCountError;

      const { error: finalUpdateError } = await supabase
        .from('products')
        .update({ likes_count: finalCount || 0 })
        .eq('id', testProduct.id);

      if (finalUpdateError) throw finalUpdateError;

      console.log(`✅ Лайк удален, финальное количество: ${finalCount || 0}`);
    }

    console.log('🎉 Настройка системы лайков завершена!');
    console.log('');
    console.log('📝 ВАЖНО: Поскольку у нас нет доступа к созданию триггеров в Supabase,');
    console.log('   счетчики лайков обновляются вручную через функцию updateProductLikesCount()');
    console.log('   в файле src/lib/database.ts');

  } catch (error) {
    console.log('❌ Ошибка настройки триггеров:', error.message);
  }
}

addLikesTriggers();