import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  try {
    console.log('🔍 Проверяем RLS политики...');
    
    // Проверяем, можем ли мы читать товары с анонимным ключом
    const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    console.log('📡 Тестируем чтение товаров с анонимным ключом...');
    const { data: anonProducts, error: anonError } = await anonSupabase
      .from('products')
      .select('id, name, price, status')
      .limit(5);
    
    if (anonError) {
      console.error('❌ Ошибка чтения с анонимным ключом:', anonError.message);
      
      // Пытаемся исправить RLS политики
      console.log('🔧 Пытаемся исправить RLS политики...');
      
      // Создаем политику для чтения товаров
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Удаляем существующие политики для products
          DROP POLICY IF EXISTS "Enable read access for all users" ON products;
          DROP POLICY IF EXISTS "products_select_policy" ON products;
          DROP POLICY IF EXISTS "Allow public read access to products" ON products;
          
          -- Создаем новую политику для публичного чтения товаров
          CREATE POLICY "Allow public read access to products" ON products
            FOR SELECT USING (true);
          
          -- Убеждаемся, что RLS включен
          ALTER TABLE products ENABLE ROW LEVEL SECURITY;
        `
      });
      
      if (policyError) {
        console.error('❌ Ошибка создания RLS политики:', policyError.message);
      } else {
        console.log('✅ RLS политика создана');
        
        // Повторно тестируем
        const { data: retestProducts, error: retestError } = await anonSupabase
          .from('products')
          .select('id, name, price, status')
          .limit(5);
        
        if (retestError) {
          console.error('❌ Все еще ошибка после исправления:', retestError.message);
        } else {
          console.log('✅ Товары успешно читаются после исправления RLS');
          console.log(`📦 Найдено товаров: ${retestProducts.length}`);
        }
      }
    } else {
      console.log('✅ Товары успешно читаются с анонимным ключом');
      console.log(`📦 Найдено товаров: ${anonProducts.length}`);
      
      if (anonProducts.length > 0) {
        console.log('📋 Первые товары:');
        anonProducts.forEach(product => {
          console.log(`  - ${product.name} (${product.price}₽) - ${product.status}`);
        });
      }
    }
    
    // Проверяем другие таблицы
    console.log('\n🔍 Проверяем другие таблицы...');
    
    const tables = ['banners', 'orders', 'product_likes'];
    
    for (const table of tables) {
      const { data, error } = await anonSupabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: доступ разрешен`);
      }
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
  }
}

// Запускаем проверку
checkRLSPolicies();