# Настройка API сервера для импорта товаров

## Быстрая проверка

### 1. Проверка работы сервера

```bash
# Проверка health endpoint
curl http://localhost:5001/api/health
# Должен вернуть: {"ok":true}

# Проверка parse endpoint
curl "http://localhost:5001/api/parse?url=https://www.wildberries.ru/catalog/123456/detail.aspx"
# Должен вернуть JSON с данными товара
```

### 2. Перезапуск сервера

Если сервер уже запущен, перезапустите его:

```bash
# Остановите текущий процесс (Ctrl+C)
# Затем запустите снова:
python api_server.py
```

## Настройка для локальной разработки

### Вариант 1: Использование локального сервера

1. Запустите API сервер:
   ```bash
   python api_server.py
   ```

2. Создайте файл `.env` в корне проекта:
   ```env
   VITE_API_BASE_URL=http://localhost:5001
   ```

3. Перезапустите фронтенд (Vite автоматически подхватит переменную)

### Вариант 2: Использование ngrok (для внешнего доступа)

1. Запустите API сервер:
   ```bash
   python api_server.py
   ```

2. В другом терминале запустите ngrok:
   ```bash
   ngrok http 5001
   ```

3. Скопируйте HTTPS URL из ngrok (например: `https://xxxx-xx-xx-xx-xx.ngrok-free.dev`)

4. Обновите URL в `src/lib/marketplaceParsers.ts`:
   ```typescript
   const apiBaseUrl = 'https://ваш-ngrok-url.ngrok-free.dev';
   ```

## Доступные endpoints

- `GET /api/health` - Проверка работы сервера
- `GET /api/parse?url=...` - Парсинг товара с маркетплейса
- `GET /` - Информация о сервере (после перезапуска)

## Решение проблем

### "Not Found" ошибка

1. **Проверьте, что сервер запущен:**
   ```bash
   curl http://localhost:5001/api/health
   ```

2. **Проверьте правильность URL:**
   - Должен быть: `http://localhost:5001/api/parse`
   - Не: `http://localhost:5001/parse`

3. **Перезапустите сервер** после изменений в коде

### Порт занят

Если порт 5001 занят, используйте другой:
```bash
FLASK_PORT=8000 python api_server.py
```

И обновите `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### CORS ошибки

CORS уже настроен в `api_server.py`. Если проблемы остаются:
- Убедитесь, что `CORS(app)` не закомментирован
- Проверьте, что запросы идут на правильный домен

## Тестирование

Протестируйте парсинг товара:

```bash
# Wildberries
curl "http://localhost:5001/api/parse?url=https://www.wildberries.ru/catalog/123456/detail.aspx"

# Ozon
curl "http://localhost:5001/api/parse?url=https://www.ozon.ru/product/..."

# Яндекс Маркет
curl "http://localhost:5001/api/parse?url=https://market.yandex.ru/product--..."
```
