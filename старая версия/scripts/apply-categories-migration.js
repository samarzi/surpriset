#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем переменные окружения
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Отсутствуют переменные окружения VITE_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Применение миграции категорий товаров...');

    // Читаем SQL файл миграции
    const migrationPath = join(__dirname, '../migrations/007_add_product_categories.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Выполняем миграцию
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Ошибка выполнения миграции:', error);
      process.exit(1);
    }

    console.log('✅ Миграция категорий товаров успешно применена!');
    console.log('📦 Созданы:');
    console.log('   - Таблица product_categories');
    console.log('   - Поле category_id в таблице products');
    console.log('   - Базовые категории товаров');
    console.log('   - RLS политики для категорий');

    // Проверяем созданные категории
    const { data: categories, error: categoriesError } = await supabase
      .from('product_categories')
      .select('*')
      .order('name');

    if (categoriesError) {
      console.warn('⚠️ Не удалось загрузить категории для проверки:', categoriesError);
    } else {
      console.log('\n📋 Созданные категории:');
      categories.forEach(category => {
        console.log(`   - ${category.name}: ${category.description || 'Без описания'}`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка применения миграции:', error);
    process.exit(1);
  }
}

// Функция для создания exec_sql если её нет
async function createExecSqlFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;

  const { error } = await supabase.rpc('exec', { sql: createFunctionSQL });
  if (error && !error.message.includes('already exists')) {
    // Если функция exec не существует, попробуем выполнить SQL напрямую
    console.log('⚠️ Функция exec_sql недоступна, выполняем SQL напрямую...');
    return false;
  }
  return true;
}

async function main() {
  console.log('🔧 Подготовка к применению миграции категорий товаров...');
  
  const canUseExecSql = await createExecSqlFunction();
  
  if (!canUseExecSql) {
    console.log('📝 Пожалуйста, выполните следующий SQL в Supabase Dashboard:');
    console.log('');
    const migrationPath = join(__dirname, '../migrations/007_add_product_categories.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    console.log(migrationSQL);
    console.log('');
    console.log('После выполнения SQL в Dashboard, система категорий будет готова к использованию.');
    return;
  }

  await applyMigration();
}

main().catch(console.error);