import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmcedkzodiqcxnpenjld.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2Vka3pvZGlxY3hucGVuamxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjQyMTAsImV4cCI6MjA4MDIwMDIxMH0.rb6MkZ0l1Wh6bFp0KNAvUKPchbYMoZVgwDFEUnNDhcE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseIssues() {
  console.log('🔍 Диагностика проблем...\n');

  // 1. Check admin authentication
  console.log('1️⃣ Проверка аутентификации админа...');
  const adminPassword = '8985';
  console.log(`✅ Пароль админа: ${adminPassword}`);
  console.log('   - Для входа перейдите на /admin и введите пароль\n');

  // 2. Check database structure
  console.log('2️⃣ Проверка структуры базы данных...');
  try {
    // Check products table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku, price, likes_count, images, tags, status, type, is_featured')
      .limit(3);

    if (productsError) {
      console.log('❌ Ошибка доступа к таблице products:', productsError.message);
      return;
    }

    console.log('✅ Таблица products доступна');
    console.log(`   - Найдено товаров: ${products.length}`);
    
    if (products.length > 0) {
      const product = products[0];
      console.log(`   - Пример товара: ${product.name}`);
      console.log(`   - Лайков: ${product.likes_count || 0}`);
      console.log(`   - Изображений: ${product.images?.length || 0}`);
      console.log(`   - Тегов: ${product.tags?.length || 0}`);
    }

    // Check product_likes table
    const { data: likes, error: likesError } = await supabase
      .from('product_likes')
      .select('*')
      .limit(5);

    if (likesError) {
      console.log('❌ Ошибка доступа к таблице product_likes:', likesError.message);
    } else {
      console.log('✅ Таблица product_likes доступна');
      console.log(`   - Найдено лайков: ${likes.length}`);
    }

  } catch (error) {
    console.log('❌ Ошибка проверки базы данных:', error.message);
  }

  console.log('');

  // 3. Test CRUD operations
  console.log('3️⃣ Тест CRUD операций...');
  try {
    // Test CREATE
    const testProduct = {
      sku: 'DIAG-' + Date.now(),
      name: 'Диагностический товар',
      description: 'Товар для диагностики',
      price: 999.99,
      images: ['https://example.com/diag.jpg'],
      tags: ['диагностика'],
      status: 'in_stock',
      type: 'product',
      is_featured: false,
      likes_count: 0
    };

    const { data: created, error: createError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    if (createError) {
      console.log('❌ CREATE не работает:', createError.message);
      return;
    }

    console.log('✅ CREATE работает');

    // Test UPDATE
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({ 
        name: 'Обновленный диагностический товар',
        price: 1299.99 
      })
      .eq('id', created.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ UPDATE не работает:', updateError.message);
    } else {
      console.log('✅ UPDATE работает');
    }

    // Test DELETE
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', created.id);

    if (deleteError) {
      console.log('❌ DELETE не работает:', deleteError.message);
    } else {
      console.log('✅ DELETE работает');
    }

  } catch (error) {
    console.log('❌ Ошибка CRUD операций:', error.message);
  }

  console.log('');

  // 4. Test likes system
  console.log('4️⃣ Тест системы лайков...');
  try {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, likes_count')
      .limit(1);

    if (productsError || !products || products.length === 0) {
      console.log('❌ Нет товаров для тестирования лайков');
      return;
    }

    const product = products[0];
    const testSession = 'diag_' + Date.now();
    const initialLikes = product.likes_count || 0;

    // Add like
    const { error: addError } = await supabase
      .from('product_likes')
      .insert({ product_id: product.id, user_session: testSession });

    if (addError) {
      console.log('❌ Добавление лайка не работает:', addError.message);
      return;
    }

    console.log('✅ Добавление лайка работает');

    // Check if likes count updated
    const { data: updatedProduct, error: checkError } = await supabase
      .from('products')
      .select('likes_count')
      .eq('id', product.id)
      .single();

    if (checkError) {
      console.log('❌ Ошибка проверки обновления лайков:', checkError.message);
    } else {
      const newLikes = updatedProduct.likes_count || 0;
      if (newLikes > initialLikes) {
        console.log('✅ Счетчик лайков обновляется автоматически');
      } else {
        console.log('⚠️ Счетчик лайков НЕ обновляется автоматически');
        console.log('   - Возможно, нужно добавить триггеры в базу данных');
      }
    }

    // Remove like
    const { error: removeError } = await supabase
      .from('product_likes')
      .delete()
      .eq('product_id', product.id)
      .eq('user_session', testSession);

    if (removeError) {
      console.log('❌ Удаление лайка не работает:', removeError.message);
    } else {
      console.log('✅ Удаление лайка работает');
    }

  } catch (error) {
    console.log('❌ Ошибка тестирования лайков:', error.message);
  }

  console.log('');

  // 5. Check data consistency
  console.log('5️⃣ Проверка целостности данных...');
  try {
    const { data: allProducts, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.log('❌ Ошибка получения всех товаров:', error.message);
      return;
    }

    let issues = [];
    
    allProducts.forEach(product => {
      if (!product.sku || !product.name || !product.description) {
        issues.push(`Товар ${product.id}: отсутствуют обязательные поля`);
      }
      
      if (product.price <= 0) {
        issues.push(`Товар ${product.name}: некорректная цена (${product.price})`);
      }
      
      if (product.tags && product.tags.length > 3) {
        issues.push(`Товар ${product.name}: слишком много тегов (${product.tags.length})`);
      }
      
      if (product.images && product.images.length > 10) {
        issues.push(`Товар ${product.name}: слишком много изображений (${product.images.length})`);
      }
    });

    if (issues.length === 0) {
      console.log('✅ Все данные корректны');
    } else {
      console.log('⚠️ Найдены проблемы с данными:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

  } catch (error) {
    console.log('❌ Ошибка проверки целостности:', error.message);
  }

  console.log('');

  // 6. Recommendations
  console.log('6️⃣ РЕКОМЕНДАЦИИ ПО УСТРАНЕНИЮ ПРОБЛЕМ:');
  console.log('');
  console.log('Если данные не обновляются для пользователей:');
  console.log('1. Откройте консоль браузера (F12) и проверьте ошибки');
  console.log('2. Убедитесь, что приложение запущено (npm run dev)');
  console.log('3. Проверьте, что вы вошли в админ панель с паролем 8985');
  console.log('4. Попробуйте обновить страницу (Ctrl+F5)');
  console.log('');
  console.log('Если не работает редактирование:');
  console.log('1. Убедитесь, что форма товара открывается');
  console.log('2. Проверьте, что все поля заполнены корректно');
  console.log('3. Посмотрите на ошибки в консоли при сохранении');
  console.log('');
  console.log('Если не работают лайки:');
  console.log('1. Проверьте, что кнопка сердечка кликабельна');
  console.log('2. Посмотрите на уведомления (toast) при клике');
  console.log('3. Проверьте консоль на ошибки JavaScript');
  console.log('');
  console.log('🔧 Для дополнительной диагностики:');
  console.log('- Перейдите в админ панель -> Настройки');
  console.log('- Используйте компонент "Тест обновления данных"');
  console.log('- Нажмите "Тест лайков" и посмотрите результаты');
}

diagnoseIssues();