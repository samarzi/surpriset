-- Применение всех миграций для импорта товаров

-- Миграция 007: Добавление поля category_ids
ALTER TABLE products
ADD COLUMN IF NOT EXISTS category_ids TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_products_category_ids ON products USING GIN(category_ids);

COMMENT ON COLUMN products.category_ids IS 'Массив ID категорий (максимум 3)';

-- Миграция 008: Поля для импорта с маркетплейсов
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS last_price_check_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_products_is_imported ON products(is_imported) WHERE is_imported = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_price_check ON products(last_price_check_at) WHERE is_imported = TRUE;

-- Миграция 009: Поле наценки
ALTER TABLE products
ADD COLUMN IF NOT EXISTS margin_percent INTEGER DEFAULT 20 CHECK (margin_percent >= 0 AND margin_percent <= 100);

CREATE INDEX IF NOT EXISTS idx_products_margin_percent 
ON products(margin_percent) WHERE is_imported = TRUE;

COMMENT ON COLUMN products.margin_percent IS 'Наценка в процентах (0-100) для импортированных товаров. По умолчанию 20%';

-- Проверка структуры таблицы
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('category_ids', 'is_imported', 'source_url', 'last_price_check_at', 'margin_percent')
ORDER BY column_name;
