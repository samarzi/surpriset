# БЫСТРОЕ ИСПРАВЛЕНИЕ ОШИБКИ 400

## Проблема
Ошибка `400 Bad Request` при сохранении импортированного товара.

## Причина
Отсутствует поле `category_ids` в базе данных.

## Решение (2 минуты)

### 1. Откройте Supabase Dashboard
https://supabase.com → Ваш проект → SQL Editor

### 2. Скопируйте и выполните этот SQL:

```sql
-- Добавление category_ids
ALTER TABLE products
ADD COLUMN IF NOT EXISTS category_ids TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_products_category_ids ON products USING GIN(category_ids);

-- Добавление полей импорта
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS last_price_check_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS margin_percent INTEGER DEFAULT 20 CHECK (margin_percent >= 0 AND margin_percent <= 100);

CREATE INDEX IF NOT EXISTS idx_products_is_imported ON products(is_imported) WHERE is_imported = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_margin_percent ON products(margin_percent) WHERE is_imported = TRUE;
```

### 3. Проверьте
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' AND column_name IN ('category_ids', 'is_imported', 'margin_percent');
```

Должны увидеть все 3 поля.

### 4. Готово!
Теперь можно сохранять импортированные товары.

## Альтернатива
Выполните весь SQL из файла `apply_all_migrations.sql`
