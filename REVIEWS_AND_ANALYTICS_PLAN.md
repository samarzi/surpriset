# План реализации: Отзывы и аналитика товаров

## Выполнено
- ✅ Навигационная панель опущена на 12px от края
- ✅ Создана миграция 005_add_reviews_system.sql
- ✅ Миграция успешно применена в БД
- ✅ Создана утилита imageCompression.ts (сжатие изображений)
- ✅ Создана утилита reviewStorage.ts (работа с Supabase Storage)
- ✅ Создан компонент StarRating (звездный рейтинг)
- ✅ Создан компонент PhotoUpload (загрузка фото)
- ✅ Создан компонент ReviewForm (форма отзыва)
- ✅ Создан компонент ReviewCard (карточка отзыва)
- ✅ Создан компонент ReviewList (список отзывов)
- ✅ Создан хук useReviews (работа с отзывами)
- ✅ Обновлен ProductDetailPage (добавлена вкладка "Отзывы")
- ✅ Обновлены типы Supabase (добавлена таблица reviews)
- ✅ Установлен date-fns для форматирования дат
- ✅ Создана страница ReviewModerationPage (модерация отзывов)
- ✅ Создана страница ProductAnalyticsPage (аналитика товаров)
- ✅ Обновлен AdminPage (добавлены новые пункты меню)

## Текущий статус

**Все шаги выполнены!** ✅

**Шаг 1: База данных - ГОТОВО** ✅
**Шаг 2: Утилиты - ГОТОВО** ✅  
**Шаг 3: Базовые компоненты - ГОТОВО** ✅
**Шаг 4: Компоненты отзывов - ГОТОВО** ✅
**Шаг 5: Интеграция в ProductDetailPage - ГОТОВО** ✅
**Шаг 6: Админ панель - ГОТОВО** ✅

**Осталось:**
- Создать Storage bucket для фотографий (см. `scripts/setup-review-storage.js`)
- Протестировать систему (см. `REVIEWS_TESTING.md`)

## Уточненные требования

### Система отзывов
- ✅ 1 отзыв на товар от пользователя
- ✅ Редактирование в течение 24 часов после публикации
- ✅ Максимум 3 фото к отзыву
- ✅ Админ может отвечать на отзывы
- ✅ Только авторизованные пользователи (через Telegram WebApp)
- ✅ Отзывы в отдельной вкладке на странице товара
- ✅ Сортировка отзывов (по дате, рейтингу, с фото)
- ✅ Пагинация отзывов

### Система лайков
- ✅ Только "нравится" (без дизлайков)
- ✅ Лайки не показывают, кто лайкнул
- ✅ Кнопка лайка уже реализована (оставляем как есть)

### Аналитика в админ панели
- ✅ Показывать все товары (включая с 0 лайков)
- ✅ Сортировка по лайкам, рейтингу, дате
- ✅ Поиск по названию товара
- ✅ Фильтры: неделя, месяц, полгода, все время

### Модерация отзывов
- ✅ Простая модерация: одобрить/отклонить
- ✅ Без причин отклонения
- ✅ Без уведомлений пользователю
- ✅ Без редактирования админом
- ✅ Только список на модерации (pending)

### Загрузка фото
- ✅ Хранение в Supabase Storage
- ✅ Максимум 5-10 МБ на фото
- ✅ Автосжатие перед загрузкой
- ✅ Форматы: JPG, PNG, WEBP

## Задачи

### 1. База данных - Схемы и миграции

#### 1.1 Таблица отзывов (reviews)
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT[], -- массив URL фотографий
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_reply TEXT, -- ответ админа на отзыв
  admin_reply_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMP,
  can_edit_until TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE(product_id, user_id) -- один отзыв от пользователя на товар
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
```

#### 1.2 Таблица лайков товаров (product_likes)
```sql
CREATE TABLE product_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

CREATE INDEX idx_product_likes_product_id ON product_likes(product_id);
CREATE INDEX idx_product_likes_user_id ON product_likes(user_id);
```

#### 1.3 Обновление таблицы products
```sql
ALTER TABLE products 
ADD COLUMN likes_count INTEGER DEFAULT 0,
ADD COLUMN reviews_count INTEGER DEFAULT 0,
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0;

CREATE INDEX idx_products_likes_count ON products(likes_count);
CREATE INDEX idx_products_average_rating ON products(average_rating);
```

### 2. API Endpoints

#### 2.1 Отзывы
- POST /api/reviews - создать отзыв (требует auth)
- GET /api/reviews/:productId - получить одобренные отзывы товара (с пагинацией и сортировкой)
- PUT /api/reviews/:id - редактировать свой отзыв (в течение 24ч)
- DELETE /api/reviews/:id - удалить свой отзыв
- POST /api/reviews/:id/photos - загрузить фото к отзыву (макс 3)

#### 2.2 Админ - Модерация отзывов
- GET /api/admin/reviews/pending - получить отзывы на модерации
- PUT /api/admin/reviews/:id/approve - одобрить отзыв
- PUT /api/admin/reviews/:id/reject - отклонить отзыв
- POST /api/admin/reviews/:id/reply - ответить на отзыв

#### 2.3 Лайки
- POST /api/products/:id/like - поставить/убрать лайк (toggle)
- GET /api/products/:id/is-liked - проверить, лайкнул ли текущий пользователь

#### 2.4 Аналитика (Admin)
- GET /api/admin/analytics/products - список товаров с аналитикой
  - Query params: 
    - period: week|month|half_year|all_time
    - sort: likes|rating|date
    - search: название товара
    - page, limit

### 3. Frontend компоненты

#### 3.1 Компоненты отзывов
- `ReviewForm.tsx` - форма добавления/редактирования отзыва
- `ReviewCard.tsx` - карточка отзыва с рейтингом, комментарием, фото
- `ReviewList.tsx` - список отзывов с пагинацией и сортировкой
- `StarRating.tsx` - компонент звездного рейтинга (интерактивный и readonly)
- `PhotoUpload.tsx` - загрузка и превью фото (макс 3)
- `AdminReplyForm.tsx` - форма ответа админа на отзыв

#### 3.2 Админ панель - новые страницы
- `ProductAnalyticsPage.tsx` - аналитика товаров с лайками
  - Таблица с товарами
  - Фильтры по времени
  - Поиск
  - Сортировка
- `ReviewModerationPage.tsx` - модерация отзывов
  - Список отзывов на модерации
  - Кнопки одобрить/отклонить
  - Форма ответа

#### 3.3 Обновление существующих компонентов
- `ProductDetailPage.tsx` - добавить вкладку "Отзывы"
- `AdminPage.tsx` - добавить пункты меню для новых страниц

### 4. Утилиты
- `imageCompression.ts` - сжатие изображений перед загрузкой
- `supabaseStorage.ts` - работа с Supabase Storage для фото

### 5. Порядок реализации

**Шаг 1: База данных**
1. Создать миграцию для reviews
2. Создать миграцию для product_likes
3. Обновить таблицу products

**Шаг 2: Backend API** (если есть отдельный backend)
Или использовать Supabase Edge Functions

**Шаг 3: Утилиты**
1. Создать imageCompression.ts
2. Создать supabaseStorage.ts

**Шаг 4: Компоненты отзывов**
1. StarRating
2. PhotoUpload
3. ReviewForm
4. ReviewCard
5. ReviewList

**Шаг 5: Интеграция в ProductDetailPage**
1. Добавить вкладку "Отзывы"
2. Интегрировать ReviewList и ReviewForm

**Шаг 6: Админ панель - Модерация**
1. ReviewModerationPage
2. Добавить в меню AdminPage

**Шаг 7: Админ панель - Аналитика**
1. ProductAnalyticsPage
2. Добавить в меню AdminPage

**Шаг 8: Тестирование**

## Начинаем реализацию?
Предлагаю начать с создания миграций БД.
