import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Проверка структуры таблицы products...\n');

  // Попробуем создать тестовый товар с минимальными данными
  const testProduct = {
    sku: 'TEST-' + Date.now(),
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    images: [],
    category_ids: [],
    status: 'in_stock',
    type: 'product',
    is_featured: false,
    likes_count: 0
  };

  console.log('📤 Попытка создать тестовый товар (без полей импорта)...');
  const { data: data1, error: error1 } = await supabase
    .from('products')
    .insert(testProduct)
    .select()
    .single();

  if (error1) {
    console.error('❌ Ошибка создания базового товара:', error1.message);
    console.error('Детали:', error1);
  } else {
    console.log('✅ Базовый товар создан успешно');
    console.log('ID:', data1.id);
    
    // Удаляем тестовый товар
    await supabase.from('products').delete().eq('id', data1.id);
    console.log('🗑️ Тестовый товар удален\n');
  }

  // Теперь попробуем с полями импорта
  const testProductWithImport = {
    ...testProduct,
    sku: 'TEST-IMP-' + Date.now(),
    is_imported: true,
    source_url: 'https://example.com/product',
    margin_percent: 20,
    last_price_check_at: new Date().toISOString()
  };

  console.log('📤 Попытка создать товар с полями импорта...');
  const { data: data2, error: error2 } = await supabase
    .from('products')
    .insert(testProductWithImport)
    .select()
    .single();

  if (error2) {
    console.error('❌ Ошибка создания товара с импортом:', error2.message);
    console.error('Детали:', error2);
    console.log('\n⚠️ МИГРАЦИИ НЕ ПРИМЕНЕНЫ! Выполните SQL из файла apply_all_migrations.sql');
  } else {
    console.log('✅ Товар с полями импорта создан успешно');
    console.log('ID:', data2.id);
    console.log('Поля импорта:', {
      is_imported: data2.is_imported,
      source_url: data2.source_url,
      margin_percent: data2.margin_percent,
      last_price_check_at: data2.last_price_check_at
    });
    
    // Удаляем тестовый товар
    await supabase.from('products').delete().eq('id', data2.id);
    console.log('🗑️ Тестовый товар удален');
    console.log('\n✅ ВСЕ МИГРАЦИИ ПРИМЕНЕНЫ УСПЕШНО!');
  }
}

checkTableStructure().catch(console.error);
