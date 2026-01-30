-- Добавление поля наценки (margin_percent) для товаров
ALTER TABLE products
ADD COLUMN IF NOT EXISTS margin_percent INTEGER DEFAULT 20 CHECK (margin_percent >= 0 AND margin_percent <= 100);

-- Создание индекса для быстрого поиска товаров с наценкой
CREATE INDEX IF NOT EXISTS idx_products_margin_percent 
ON products(margin_percent) WHERE is_imported = TRUE;

-- Комментарий к полю
COMMENT ON COLUMN products.margin_percent IS 'Наценка в процентах (0-100) для импортированных товаров. По умолчанию 20%';
