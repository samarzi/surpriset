-- Создание таблицы категорий товаров
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавление поля category_id в таблицу products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

-- Создание индекса для быстрого поиска по категориям
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Добавление базовых категорий
INSERT INTO product_categories (name, description) VALUES
  ('Наборы для сюрпризов', 'Готовые наборы товаров для создания сюрпризов'),
  ('Декор и украшения', 'Декоративные элементы и украшения'),
  ('Подарочная упаковка', 'Коробки, пакеты и материалы для упаковки подарков'),
  ('Сладости и лакомства', 'Конфеты, шоколад и другие сладости'),
  ('Игрушки и сувениры', 'Мягкие игрушки, сувениры и памятные предметы'),
  ('Канцелярия', 'Ручки, блокноты, стикеры и другие канцелярские товары')
ON CONFLICT (name) DO NOTHING;

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_product_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_product_categories_updated_at ON product_categories;
CREATE TRIGGER trigger_update_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_product_categories_updated_at();

-- RLS политики для категорий
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Политика для чтения категорий (доступно всем)
CREATE POLICY "Allow read access to product_categories" ON product_categories
  FOR SELECT USING (true);

-- Политика для создания категорий (только для аутентифицированных пользователей)
CREATE POLICY "Allow insert access to product_categories" ON product_categories
  FOR INSERT WITH CHECK (true);

-- Политика для обновления категорий (только для аутентифицированных пользователей)
CREATE POLICY "Allow update access to product_categories" ON product_categories
  FOR UPDATE USING (true);

-- Политика для удаления категорий (только для аутентифицированных пользователей)
CREATE POLICY "Allow delete access to product_categories" ON product_categories
  FOR DELETE USING (true);