# Руководство по применению миграции отзывов

## Миграция 005: Система отзывов

### Что добавляет миграция:

1. **Таблица `reviews`**
   - Хранение отзывов с рейтингом (1-5 звезд)
   - Поддержка до 3 фотографий
   - Статусы: pending, approved, rejected
   - Возможность редактирования в течение 24 часов
   - Ответы админа на отзывы
   - Один отзыв от пользователя на товар

2. **Обновление таблицы `products`**
   - `reviews_count` - количество одобренных отзывов
   - `average_rating` - средний рейтинг товара

3. **Автоматические триггеры**
   - Автоматический пересчет статистики при изменении отзывов
   - Автоматическое обновление `updated_at`

## Применение миграции

### Вариант 1: Через Supabase Dashboard

1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Скопируйте содержимое файла `migrations/005_add_reviews_system.sql`
4. Вставьте в SQL Editor
5. Нажмите "Run"

### Вариант 2: Через командную строку (если используете Supabase CLI)

```bash
# Применить миграцию
supabase db push

# Или применить конкретный файл
psql $DATABASE_URL -f migrations/005_add_reviews_system.sql
```

### Вариант 3: Через скрипт Node.js

```bash
# Создайте файл apply-migration.js
node scripts/apply-migration.js 005_add_reviews_system.sql
```

## Проверка миграции

После применения миграции выполните следующие проверки:

```sql
-- 1. Проверить, что таблица reviews создана
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'reviews';

-- 2. Проверить структуру таблицы
\d reviews

-- 3. Проверить, что колонки добавлены в products
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('reviews_count', 'average_rating');

-- 4. Проверить триггеры
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'reviews';

-- 5. Проверить индексы
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'reviews';
```

## Тестовые данные

Для тестирования можно добавить тестовый отзыв:

```sql
-- Вставить тестовый отзыв (замените UUID на реальные из вашей БД)
INSERT INTO reviews (
    product_id,
    user_id,
    rating,
    comment,
    status
) VALUES (
    'your-product-uuid',
    'your-user-uuid',
    5,
    'Отличный товар! Очень доволен покупкой.',
    'approved'
);

-- Проверить, что статистика обновилась
SELECT id, name, reviews_count, average_rating
FROM products
WHERE id = 'your-product-uuid';
```

## Откат миграции (если нужно)

```sql
-- Удалить триггеры
DROP TRIGGER IF EXISTS trigger_update_reviews_stats_insert ON reviews;
DROP TRIGGER IF EXISTS trigger_update_reviews_stats_update ON reviews;
DROP TRIGGER IF EXISTS trigger_update_reviews_stats_delete ON reviews;
DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON reviews;

-- Удалить функции
DROP FUNCTION IF EXISTS update_product_reviews_stats();
DROP FUNCTION IF EXISTS update_reviews_updated_at();

-- Удалить колонки из products
ALTER TABLE products 
DROP COLUMN IF EXISTS reviews_count,
DROP COLUMN IF EXISTS average_rating;

-- Удалить таблицу reviews
DROP TABLE IF EXISTS reviews CASCADE;
```

## Следующие шаги

После успешного применения миграции:

1. ✅ Создать API endpoints для работы с отзывами
2. ✅ Создать компоненты UI для отзывов
3. ✅ Добавить модерацию в админ панель
4. ✅ Интегрировать в страницу товара

## Troubleshooting

### Ошибка: "relation already exists"
Если таблица уже существует, используйте `DROP TABLE reviews CASCADE;` перед повторным применением.

### Ошибка: "column already exists"
Если колонки уже добавлены в products, закомментируйте соответствующие строки ALTER TABLE.

### Ошибка с UUID
Убедитесь, что расширение uuid-ossp включено:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
