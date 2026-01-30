import { Product, Banner, Order } from '@/types';

// Mock Products
export const mockProducts: Product[] = [
  {
    id: '1',
    sku: 'GIFT-001',
    name: 'Подарочный набор для неё "Нежность"',
    description: 'Изысканный набор для особенной женщины, включающий ароматические свечи, натуральную косметику и сладости.',
    composition: 'Ароматическая свеча, крем для рук, шоколадные конфеты, травяной чай',
    price: 4990,
    original_price: 5990,
    images: [
      'https://images.unsplash.com/photo-1758874089961-e52549c294c3?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1640253621029-7ec13d3b1ece?w=400&h=400&fit=crop'
    ],
    tags: ['Для неё', 'Популярное', 'Скидка'],
    status: 'in_stock',
    type: 'bundle',
    is_featured: true,
    likes_count: 24,
    specifications: {
      'Размер упаковки': '25x20x10 см',
      'Вес': '800 г',
      'Материал упаковки': 'Крафт-бумага'
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    sku: 'GIFT-002',
    name: 'Набор для романтического вечера',
    description: 'Создайте незабываемую атмосферу с нашим романтическим набором.',
    price: 3590,
    images: [
      'https://images.unsplash.com/photo-1616423492443-5322d910aedb?w=400&h=400&fit=crop'
    ],
    tags: ['Для двоих', 'Романтика'],
    status: 'in_stock',
    type: 'bundle',
    is_featured: true,
    likes_count: 18,
    created_at: '2024-01-14T10:00:00Z',
    updated_at: '2024-01-14T10:00:00Z'
  },
  {
    id: '3',
    sku: 'PROD-001',
    name: 'Ароматическая свеча "Лаванда"',
    description: 'Натуральная соевая свеча с ароматом лаванды для создания уютной атмосферы.',
    price: 890,
    images: [
      'https://images.unsplash.com/photo-1602874801006-8e0c8e9d5b8a?w=400&h=400&fit=crop'
    ],
    tags: ['Для дома', 'Ароматы'],
    status: 'in_stock',
    type: 'product',
    is_featured: false,
    likes_count: 7,
    specifications: {
      'Время горения': '40 часов',
      'Материал': 'Соевый воск',
      'Аромат': 'Лаванда'
    },
    created_at: '2024-01-13T10:00:00Z',
    updated_at: '2024-01-13T10:00:00Z'
  },
  {
    id: '4',
    sku: 'PROD-002',
    name: 'Шоколадные конфеты ручной работы',
    description: 'Изысканные шоколадные конфеты, изготовленные вручную из лучших ингредиентов.',
    price: 1290,
    images: [
      'https://images.unsplash.com/photo-1767510533183-425731f088a7?w=400&h=400&fit=crop'
    ],
    tags: ['Сладости', 'Премиум'],
    status: 'in_stock',
    type: 'product',
    is_featured: false,
    likes_count: 12,
    specifications: {
      'Вес': '200 г',
      'Количество': '12 штук',
      'Состав': 'Темный шоколад 70%'
    },
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z'
  },
  {
    id: '5',
    sku: 'PROD-003',
    name: 'Плюшевый мишка "Тедди"',
    description: 'Мягкий плюшевый мишка, который станет прекрасным подарком для любого возраста.',
    price: 1590,
    images: [
      'https://images.unsplash.com/photo-1706697267467-d628942c35b0?w=400&h=400&fit=crop'
    ],
    tags: ['Игрушки', 'Для детей'],
    status: 'coming_soon',
    type: 'product',
    is_featured: false,
    likes_count: 31,
    specifications: {
      'Размер': '30 см',
      'Материал': 'Плюш',
      'Цвет': 'Коричневый'
    },
    created_at: '2024-01-11T10:00:00Z',
    updated_at: '2024-01-11T10:00:00Z'
  },
  {
    id: '6',
    sku: 'PROD-004',
    name: 'Крем для рук "Роза"',
    description: 'Питательный крем для рук с экстрактом розы и натуральными маслами.',
    price: 690,
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'
    ],
    tags: ['Косметика', 'Уход'],
    status: 'out_of_stock',
    type: 'product',
    is_featured: false,
    likes_count: 5,
    specifications: {
      'Объем': '50 мл',
      'Тип кожи': 'Все типы',
      'Аромат': 'Роза'
    },
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z'
  },
  {
    id: '7',
    sku: 'GIFT-003',
    name: 'Набор для мужчины "Стиль"',
    description: 'Стильный набор для современного мужчины с аксессуарами и уходовыми средствами.',
    price: 5490,
    images: [
      'https://images.unsplash.com/photo-1592903297149-37fb25202dfa?w=400&h=400&fit=crop'
    ],
    tags: ['Для него', 'Стиль'],
    status: 'in_stock',
    type: 'bundle',
    is_featured: true,
    likes_count: 9,
    created_at: '2024-01-09T10:00:00Z',
    updated_at: '2024-01-09T10:00:00Z'
  },
  {
    id: '8',
    sku: 'PROD-005',
    name: 'Травяной чай "Мята и мелисса"',
    description: 'Успокаивающий травяной чай с мятой и мелиссой для релаксации.',
    price: 490,
    images: [
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop'
    ],
    tags: ['Напитки', 'Здоровье'],
    status: 'in_stock',
    type: 'product',
    is_featured: false,
    likes_count: 3,
    specifications: {
      'Вес': '100 г',
      'Состав': 'Мята, мелисса',
      'Упаковка': 'Крафт-пакет'
    },
    created_at: '2024-01-08T10:00:00Z',
    updated_at: '2024-01-08T10:00:00Z'
  }
];

// Mock Banners
export const mockBanners: Banner[] = [
  {
    id: '1',
    title: 'Новогодние подарки со скидкой до 30%',
    image: 'https://images.unsplash.com/photo-1758874089961-e52549c294c3?w=1200&h=400&fit=crop',
    link: '/catalog?sale=true',
    is_active: true,
    order: 1,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Широкий выбор товаров в каталоге',
    image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=400&fit=crop',
    link: '/catalog',
    is_active: true,
    order: 2,
    created_at: '2024-01-14T10:00:00Z'
  }
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customer_name: 'Анна Петрова',
    customer_email: 'anna@example.com',
    customer_phone: '+7 (999) 123-45-67',
    customer_address: 'Москва, ул. Тверская, д. 1, кв. 10',
    items: [
      {
        product_id: '1',
        name: 'Подарочный набор для неё "Нежность"',
        price: 4990,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1758874089961-e52549c294c3?w=400&h=400&fit=crop'
      }
    ],
    total: 4990,
    status: 'processing',
    type: 'regular',
    created_at: '2024-01-15T14:30:00Z',
    updated_at: '2024-01-15T14:30:00Z'
  },
  {
    id: 'ORD-002',
    customer_name: 'Михаил Иванов',
    customer_email: 'mikhail@example.com',
    customer_phone: '+7 (999) 987-65-43',
    items: [
      {
        product_id: '3',
        name: 'Ароматическая свеча "Лаванда"',
        price: 890,
        quantity: 2
      },
      {
        product_id: '4',
        name: 'Шоколадные конфеты ручной работы',
        price: 1290,
        quantity: 1
      }
    ],
    total: 3070,
    status: 'shipped',
    type: 'custom_bundle',
    created_at: '2024-01-14T16:45:00Z',
    updated_at: '2024-01-15T09:20:00Z'
  }
];

// Helper functions
export function getProductById(id: string): Product | undefined {
  return mockProducts.find(product => product.id === id);
}

export function getProductsBySku(sku: string): Product | undefined {
  return mockProducts.find(product => product.sku === sku);
}

export function getFeaturedProducts(): Product[] {
  return mockProducts.filter(product => product.is_featured);
}

export function getProductsByType(type: 'product' | 'bundle'): Product[] {
  return mockProducts.filter(product => product.type === type);
}

export function searchProducts(query: string): Product[] {
  const lowercaseQuery = query.toLowerCase();
  return mockProducts.filter(product => 
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery) ||
    product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function getActiveBanners(): Banner[] {
  return mockBanners
    .filter(banner => banner.is_active)
    .sort((a, b) => a.order - b.order);
}

export function getOrderById(id: string): Order | undefined {
  return mockOrders.find(order => order.id === id);
}