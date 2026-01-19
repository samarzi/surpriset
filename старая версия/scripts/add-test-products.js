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

const testProducts = [
  {
    sku: 'GIFT-001',
    name: 'Романтический набор для двоих',
    description: 'Идеальный набор для романтического вечера: свечи, шоколад, вино и красивая упаковка.',
    composition: 'Свечи ароматические - 2 шт, Шоколад премиум - 200г, Вино красное - 1 бутылка',
    price: 2500,
    original_price: 3000,
    images: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=533&fit=crop',
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=533&fit=crop'
    ],
    tags: ['Для двоих', 'Романтика', 'Премиум'],
    status: 'in_stock',
    type: 'bundle',
    is_featured: true,
    specifications: {
      'Вес': '1.2 кг',
      'Размер упаковки': '30x25x15 см',
      'Срок годности': '6 месяцев'
    }
  },
  {
    sku: 'GIFT-002',
    name: 'Сладкий сюрприз для неё',
    description: 'Нежный набор сладостей и косметики для особенной девушки.',
    composition: 'Макаруны - 12 шт, Крем для рук - 1 шт, Бальзам для губ - 1 шт',
    price: 1800,
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=533&fit=crop',
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=533&fit=crop'
    ],
    tags: ['Для неё', 'Сладости', 'Красота'],
    status: 'in_stock',
    type: 'bundle',
    is_featured: false
  },
  {
    sku: 'GIFT-003',
    name: 'Мужской стиль',
    description: 'Стильный набор аксессуаров для современного мужчины.',
    composition: 'Кожаный кошелек, Запонки, Парфюм 50мл',
    price: 3200,
    original_price: 3800,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=533&fit=crop',
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=533&fit=crop'
    ],
    tags: ['Для него', 'Стиль', 'Аксессуары'],
    status: 'in_stock',
    type: 'bundle',
    is_featured: true
  },
  {
    sku: 'PROD-001',
    name: 'Ароматическая свеча "Лаванда"',
    description: 'Натуральная соевая свеча с ароматом лаванды для релаксации.',
    composition: 'Соевый воск, эфирное масло лаванды, хлопковый фитиль',
    price: 450,
    images: [
      'https://images.unsplash.com/photo-1602874801006-e26d3d17d0ed?w=400&h=533&fit=crop'
    ],
    tags: ['Для дома', 'Релакс', 'Ароматерапия'],
    status: 'in_stock',
    type: 'product',
    is_featured: false
  },
  {
    sku: 'PROD-002',
    name: 'Бельгийский шоколад премиум',
    description: 'Изысканный бельгийский шоколад ручной работы.',
    composition: 'Какао-бобы, сахар, какао-масло, ваниль',
    price: 680,
    images: [
      'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=533&fit=crop'
    ],
    tags: ['Сладости', 'Премиум', 'Бельгия'],
    status: 'in_stock',
    type: 'product',
    is_featured: false
  },
  {
    sku: 'PROD-003',
    name: 'Кожаный кошелек ручной работы',
    description: 'Элегантный кошелек из натуральной кожи, сделанный вручную.',
    composition: 'Натуральная кожа, металлическая фурнитура',
    price: 1200,
    original_price: 1500,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=533&fit=crop'
    ],
    tags: ['Аксессуары', 'Кожа', 'Ручная работа'],
    status: 'in_stock',
    type: 'product',
    is_featured: false
  }
];

async function addTestProducts() {
  try {
    console.log('🔍 Проверяем существующие товары...');
    
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id, sku')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Ошибка при проверке товаров:', checkError.message);
      return;
    }
    
    if (existingProducts && existingProducts.length > 0) {
      console.log('✅ В базе уже есть товары, пропускаем добавление тестовых данных');
      return;
    }
    
    console.log('📦 Добавляем тестовые товары...');
    
    const { data, error } = await supabase
      .from('products')
      .insert(testProducts)
      .select();
    
    if (error) {
      console.error('❌ Ошибка при добавлении товаров:', error.message);
      return;
    }
    
    console.log(`✅ Успешно добавлено ${data.length} тестовых товаров`);
    console.log('📋 Добавленные товары:');
    data.forEach(product => {
      console.log(`  - ${product.name} (${product.sku})`);
    });
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
  }
}

// Запускаем скрипт
addTestProducts();