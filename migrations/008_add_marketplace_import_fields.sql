-- Добавление полей для импорта товаров с маркетплейсов
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS last_price_check_at TIMESTAMP WITH TIME ZONE;

-- Создание индекса для быстрого поиска импортированных товаров
CREATE INDEX IF NOT EXISTS idx_products_is_imported ON products(is_imported) WHERE is_imported = TRUE;

-- Создание индекса для проверки цен
CREATE INDEX IF NOT EXISTS idx_products_price_check ON products(last_price_check_at) WHERE is_imported = TRUE;

-- Комментарии к полям
COMMENT ON COLUMN products.is_imported IS 'Товар импортирован с маркетплейса';
COMMENT ON COLUMN products.source_url IS 'URL источника товара (только для системы, не показывать клиентам)';
COMMENT ON COLUMN products.last_price_check_at IS 'Время последней проверки цены на маркетплейсе';
