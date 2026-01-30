# Исправление ошибки сохранения импортированных товаров

## Дата: 26 января 2026

## Проблема
При попытке сохранить импортированный товар возникала ошибка 400 от Supabase.

## Причина
1. Поле `category_ids` отсутствует в базе данных (миграция 007 не применена)
2. Поле `margin_percent` в базе данных определено как `INTEGER`, но передавалось как `number` (float)
3. Возможно не применены миграции для полей импорта (миграции 008, 009)

## Решение

### 1. Округление margin_percent до целого числа
```typescript
// БЫЛО
margin_percent: formData.is_imported ? formData.margin_percent : null,

// СТАЛО
margin_percent: formData.is_imported ? Math.round(formData.margin_percent) : null,
```

### 2. Применение миграций в Supabase

**ВАЖНО:** Необходимо выполнить SQL в Supabase SQL Editor:

```sql
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
```

### 3. Проверка структуры таблицы
После применения миграций выполните:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('is_imported', 'source_url', 'last_price_check_at', 'margin_percent')
ORDER BY column_name;
```

Должны быть видны все 4 поля.

## Инструкция по применению миграций

### Шаг 1: Откройте Supabase Dashboard
1. Перейдите на https://supabase.com
2. Выберите ваш проект
3. Откройте SQL Editor (слева в меню)

### Шаг 2: Выполните SQL
1. Создайте новый запрос
2. Скопируйте содержимое файла `apply_all_migrations.sql`
3. Нажмите "Run" или Ctrl+Enter
4. Проверьте, что все команды выполнены успешно

### Шаг 3: Проверьте результат
Выполните проверочный запрос:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('category_ids', 'is_imported', 'source_url', 'last_price_check_at', 'margin_percent')
ORDER BY column_name;
```

Ожидаемый результат:
- `category_ids` - ARRAY, nullable, default '{}'
- `is_imported` - boolean, nullable, default FALSE
- `last_price_check_at` - timestamp with time zone, nullable
- `margin_percent` - integer, nullable, default 20
- `source_url` - text, nullable

## Изменения в коде

### Файлы изменены:
- `src/components/admin/ProductForm.tsx` - округление margin_percent
- `apply_all_migrations.sql` - SQL для применения миграций (новый файл)

### Добавлено логирование:
```typescript
console.log('📤 Отправка данных товара:', productData);
```

Это поможет отладить проблемы с сохранением в будущем.

## Сборка проекта
Проект успешно собран:
```bash
npm run build
✓ built in 6.97s
```

## Тестирование
После применения миграций:
1. Импортируйте товар с Ozon
2. Заполните все поля
3. Нажмите "Создать товар"
4. Проверьте консоль браузера на наличие логов
5. Товар должен успешно сохраниться

## Статус
✅ **Код исправлен** - margin_percent округляется до целого числа
⚠️ **Требуется действие** - необходимо применить миграции в Supabase вручную
✅ **Проект собран** - готов к деплою
