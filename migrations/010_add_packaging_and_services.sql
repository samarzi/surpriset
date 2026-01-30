-- Миграция 010: Добавление упаковок и дополнительных услуг

-- Таблица упаковок
CREATE TABLE IF NOT EXISTS packaging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  width DECIMAL(10, 2), -- ширина в см
  height DECIMAL(10, 2), -- высота в см
  depth DECIMAL(10, 2), -- глубина в см
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица категорий дополнительных услуг
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица дополнительных услуг
CREATE TABLE IF NOT EXISTS additional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавляем поля в таблицу orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS packaging_id UUID REFERENCES packaging(id),
ADD COLUMN IF NOT EXISTS assembly_service_price DECIMAL(10, 2) DEFAULT 0;

-- Таблица связи заказов и дополнительных услуг
CREATE TABLE IF NOT EXISTS order_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES additional_services(id),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_packaging_active ON packaging(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_additional_services_active ON additional_services(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_additional_services_category ON additional_services(category_id);
CREATE INDEX IF NOT EXISTS idx_order_services_order ON order_services(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_packaging ON orders(packaging_id);

-- Комментарии
COMMENT ON TABLE packaging IS 'Варианты упаковки для заказов';
COMMENT ON TABLE service_categories IS 'Категории дополнительных услуг (Открытки, Подарочная упаковка и т.д.)';
COMMENT ON TABLE additional_services IS 'Дополнительные услуги для заказов';
COMMENT ON TABLE order_services IS 'Связь заказов и дополнительных услуг';
COMMENT ON COLUMN orders.assembly_service_price IS 'Стоимость услуги сборки (включена по умолчанию)';

