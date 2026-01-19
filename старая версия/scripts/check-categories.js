#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Отсутствуют переменные окружения VITE_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY');
  console.log('📝 Проверьте файл .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCategories() {
  try {
    console.log('🔍 Проверяем наличие таблицы product_categories...');
    
    // Проверяем, существует ли таблица
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Таблица product_categories не существует');
        console.log('📝 Необходимо применить миграцию 007_add_product_categories.sql');
        return false;
      } else {
        console.error('❌ Ошибка при проверке таблицы:', error);
        return false;
      }
    }

    console.log('✅ Таблица product_categories существует');
    
    // Проверяем количество категорий
    const { count } = await supabase
      .from('product_categories')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Найдено категорий: ${count}`);
    
    if (count === 0) {
      console.log('⚠️ Категории не найдены, добавляем базовые категории...');
      await addDefaultCategories();
    }

    return true;
  } catch (error) {
    console.error('❌ Ошибка:', error);
    return false;
  }
}

async function addDefaultCategories() {
  const defaultCategories = [
    { name: 'Наборы для сюрпризов', description: 'Готовые наборы товаров для создания сюрпризов' },
    { name: 'Декор и украшения', description: 'Декоративные элементы и украшения' },
    { name: 'Подарочная упаковка', description: 'Коробки, пакеты и материалы для упаковки подарков' },
    { name: 'Сладости и лакомства', description: 'Конфеты, шоколад и другие сладости' },
    { name: 'Игрушки и сувениры', description: 'Мягкие игрушки, сувениры и памятные предметы' },
    { name: 'Канцелярия', description: 'Ручки, блокноты, стикеры и другие канцелярские товары' }
  ];

  try {
    const { data, error } = await supabase
      .from('product_categories')
      .insert(defaultCategories)
      .select();

    if (error) {
      console.error('❌ Ошибка при добавлении категорий:', error);
      return false;
    }

    console.log(`✅ Добавлено ${data.length} базовых категорий`);
    return true;
  } catch (error) {
    console.error('❌ Ошибка при добавлении категорий:', error);
    return false;
  }
}

async function checkProductsTable() {
  try {
    console.log('🔍 Проверяем поле category_id в таблице products...');
    
    const { data, error } = await supabase
      .from('products')
      .select('category_id')
      .limit(1);

    if (error) {
      console.error('❌ Ошибка при проверке поля category_id:', error);
      console.log('📝 Возможно, нужно добавить поле category_id в таблицу products');
      return false;
    }

    console.log('✅ Поле category_id существует в таблице products');
    return true;
  } catch (error) {
    console.error('❌ Ошибка:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Проверка системы категорий...\n');
  
  const categoriesOk = await checkCategories();
  const productsOk = await checkProductsTable();
  
  console.log('\n📋 Результаты проверки:');
  console.log(`   Таблица категорий: ${categoriesOk ? '✅' : '❌'}`);
  console.log(`   Поле category_id: ${productsOk ? '✅' : '❌'}`);
  
  if (categoriesOk && productsOk) {
    console.log('\n🎉 Система категорий готова к использованию!');
  } else {
    console.log('\n⚠️ Необходимо применить миграцию 007_add_product_categories.sql');
    console.log('📝 Выполните SQL из файла migrations/007_add_product_categories.sql в Supabase Dashboard');
  }
}

main().catch(console.error);