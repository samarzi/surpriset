// Product Types
export type ProductStatus = 'in_stock' | 'coming_soon' | 'out_of_stock';
export type ProductType = 'product' | 'bundle';

export interface Product {
  id: string;
  sku: string; // Уникальный артикул
  name: string;
  description: string;
  composition?: string | null; // Состав/комплектация
  price: number;
  original_price?: number | null; // Для скидок (snake_case для DB)
  images: string[]; // Массив URL изображений
  category_ids?: string[]; // Массив ID категорий (максимум 3)
  status: ProductStatus;
  type: ProductType;
  is_featured: boolean; // snake_case для DB
  likes_count: number; // Количество лайков
  specifications?: Record<string, string> | null;
  is_imported?: boolean; // Импортирован с маркетплейса
  source_url?: string | null; // URL источника (только для системы)
  last_price_check_at?: string | null; // Последняя проверка цены
  margin_percent?: number | null; // Наценка в процентах (0-100)
  created_at: string; // snake_case для DB
  updated_at: string; // snake_case для DB
}

// Product Category Types
export interface ProductCategory {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

// Likes Types
export interface ProductLike {
  id: string;
  product_id: string;
  user_session: string;
  created_at: string;
}

export interface LikesState {
  likedProducts: Set<string>;
  isLoading: boolean;
}

// Cart Types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  type: ProductType;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Custom Bundle Types
export interface BundleItem {
  product: Product;
  quantity: number;
}

export interface CustomBundleState {
  items: BundleItem[];
  total: number;
  isValid: boolean; // true если 5-20 товаров
  step: 'selection' | 'review' | 'checkout';
}

// Order Types
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type OrderType = 'regular' | 'custom_bundle';

export interface OrderItem {
  product_id: string; // snake_case для DB
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string; // Артикул товара
  description?: string; // Описание товара (опционально)
}

export interface Order {
  id: string;
  customer_name: string; // snake_case для DB
  customer_email: string; // snake_case для DB
  customer_phone: string; // snake_case для DB
  customer_address?: string | null; // snake_case для DB - может быть null из БД
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  type: OrderType;
  packaging_id?: string | null; // ID выбранной упаковки
  assembly_service_price?: number; // Стоимость услуги сборки
  created_at: string; // snake_case для DB
  updated_at: string; // snake_case для DB
}

// Legacy interface for frontend compatibility
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

// Banner Types
export interface Banner {
  id: string;
  title: string;
  description?: string | null; // Описание баннера
  image: string;
  link?: string | null; // Ссылка на товар/категорию
  is_active: boolean; // snake_case для DB
  order: number; // Порядок отображения
  created_at: string; // snake_case для DB
}

// Packaging Types
export interface Packaging {
  id: string;
  name: string;
  price: number;
  width?: number | null; // ширина в см
  height?: number | null; // высота в см
  depth?: number | null; // глубина в см
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Service Category Types
export interface ServiceCategory {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Additional Service Types
export interface AdditionalService {
  id: string;
  category_id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Order Service (junction table)
export interface OrderService {
  id: string;
  order_id: string;
  service_id: string;
  price: number;
  created_at: string;
}

// Filter Types
export interface ProductFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  status?: ProductStatus[];
  type?: ProductType[];
  categories?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  limit?: number;
  offset?: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}