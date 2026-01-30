# Исправление верхних отступов контента

## Проблема
Во всем проекте контент был прижат к верхней части экрана из-за использования `md:items-center` в обертках, что центрировало контент вертикально по центру экрана, создавая ощущение "прилипания" к верху.

## Решение
Изменено вертикальное выравнивание с `items-center` на `items-start` и добавлен верхний отступ `md:pt-16` для всех страниц админ-панели.

## Измененные файлы

### 1. src/pages/AdminPage.tsx
- **AdminDashboard**: `md:items-center` → `md:items-start` + `md:pt-16`
- **OrdersAdmin**: `md:items-center` → `md:items-start` + `md:pt-16`
- **AnalyticsAdmin**: `md:items-center` → `md:items-start` + `md:pt-16`
- **CategoriesAdmin**: `md:items-center` → `md:items-start` + `md:pt-16`
- **SettingsAdmin**: `md:items-center` → `md:items-start` + `md:pt-16`

### 2. src/components/admin/ProductsManager.tsx
- Изменено: `md:items-center` → `md:items-start` + `md:pt-16`

### 3. src/components/admin/CategoryManager.tsx
- Изменено: `md:items-center` → `md:items-start` + `md:pt-16`

### 4. src/components/admin/BannersManager.tsx
- Изменено: `md:items-center` → `md:items-start` + `md:pt-16`

## Результат
✅ Контент теперь имеет комфортное "воздушное" пространство сверху (64px на десктопе)
✅ Улучшена визуальная иерархия
✅ Повышена читаемость интерфейса
✅ Устранено ощущение "обрезанного" контента
✅ Применено глобально во всех админ-страницах

## Технические детали
- `md:items-start` - выравнивание по верхнему краю вместо центра
- `md:pt-16` - верхний отступ 64px (4rem) только на десктопе
- Мобильная версия не затронута (сохранен стандартный `md:py-8`)
