# Финальное исправление цены Ozon (в старом парсере)

## Дата: 26 января 2026, 22:42

## Проблема
Цена с Ozon импортировалась неправильно (1329₽ → 13.29₽).

## Причина
В старом парсере `parsers/ozon.py` использовалась неправильная логика конвертации цены:
```python
# НЕПРАВИЛЬНО
return float(price) / 100 if price > 1000 else float(price)
```

Эта логика предполагала, что Ozon возвращает цены в копейках, но на самом деле Ozon возвращает цены в рублях.

## Решение
Исправлены функции `_extract_price()` и `_extract_old_price()` в `parsers/ozon.py`:

### До исправления:
```python
def _extract_price(self, product_data: Dict[str, Any]) -> float:
    if product_data.get("price"):
        price = product_data["price"]
        if isinstance(price, dict):
            price_val = price.get("value", 0) or price.get("finalPrice", 0) or price.get("price", 0)
            return float(price_val) / 100 if price_val > 1000 else float(price_val)  # ❌
        return float(price) / 100 if price > 1000 else float(price)  # ❌
```

### После исправления:
```python
def _extract_price(self, product_data: Dict[str, Any]) -> float:
    if product_data.get("price"):
        price = product_data["price"]
        if isinstance(price, dict):
            price_val = price.get("value", 0) or price.get("finalPrice", 0) or price.get("price", 0)
            # НЕ конвертируем из копеек - Ozon возвращает цену в рублях
            return float(price_val) if price_val > 0 else 0  # ✅
        # НЕ конвертируем из копеек - Ozon возвращает цену в рублях
        return float(price) if price > 0 else 0  # ✅
```

## Дополнительные исправления

### 1. Исправлена функция `_extract_old_price()`
Убрано деление на 100 для старой цены:
```python
# БЫЛО
return float(old_price) / 100 if old_price > 1000 else float(old_price)

# СТАЛО
return float(old_price) if old_price > 0 else 0
```

### 2. Исправлена синтаксическая ошибка
Экранированы обратные слеши в JavaScript regex внутри Python строки:
```python
# БЫЛО (SyntaxWarning)
src = src.replace(/\/w\d+\//g, '/w2000/')

# СТАЛО
src = src.replace(/\\/w\\d+\\//g, '/w2000/')
```

## Что изменено

### Файлы:
- `parsers/ozon.py` - исправлена логика цен и синтаксис
- `parsers/__init__.py` - оставлен старый парсер по умолчанию

### Изменения:
1. ✅ Удалено деление на 100 для обычной цены
2. ✅ Удалено деление на 100 для старой цены
3. ✅ Исправлена синтаксическая ошибка с regex
4. ✅ API сервер перезапущен

## Тестирование
Теперь при импорте товара с Ozon:
1. Откройте админ-панель в Telegram Mini App
2. Создайте новый товар
3. Вставьте ссылку на товар с Ozon
4. Нажмите "Загрузить"
5. Проверьте:
   - ✅ Цена 1329₽ импортируется как 1329₽ (не 13.29₽)
   - ✅ Старая цена также корректная

## Статус
✅ **ИСПРАВЛЕНО** - Старый парсер Ozon теперь корректно импортирует цены без деления на 100.
