# 🚀 Инструкция по запуску серверов

## Быстрый запуск (автоматический)

```bash
./start-all.sh
```

## Ручной запуск

### Вариант 1: Два отдельных терминала (рекомендуется)

**Терминал 1 - Python API сервер:**
```bash
cd "/Users/samarzi/Desktop/IT/D E M O/surpriset"
source venv/bin/activate
python api_server.py
```

Вы увидите:
```
Starting Flask API server on port 5001
 * Running on http://127.0.0.1:5001
```

**Терминал 2 - Express сервер:**
```bash
cd "/Users/samarzi/Desktop/IT/D E M O/surpriset"
npm start
```

Вы увидите:
```
Server listening on port 3000
```

### Вариант 2: Запуск в фоне

**Python API:**
```bash
cd "/Users/samarzi/Desktop/IT/D E M O/surpriset"
source venv/bin/activate
python api_server.py > /tmp/api_server.log 2>&1 &
```

**Express:**
```bash
cd "/Users/samarzi/Desktop/IT/D E M O/surpriset"
npm start > /tmp/express_server.log 2>&1 &
```

## Проверка работы

### Python API:
```bash
curl http://localhost:5001/api/health
# Должен вернуть: {"ok":true}
```

### Express сервер:
```bash
curl http://localhost:3000/api/health
# Должен вернуть: {"ok":true}
```

### Тест импорта товара:
```bash
curl "http://localhost:3000/api/parse?url=https://market.yandex.ru/card/kholodilnik-dlya-napitkov-meyvel-md-04c3b-rgb/4705719999"
```

## Просмотр логов

**Python API:**
```bash
tail -f /tmp/api_server.log
```

**Express:**
```bash
tail -f /tmp/express_server.log
```

## Остановка серверов

**Найти процессы:**
```bash
ps aux | grep -E "(python.*api_server|node.*server)" | grep -v grep
```

**Остановить по PID:**
```bash
kill <PID>
```

**Или остановить все:**
```bash
pkill -f "python.*api_server"
pkill -f "node.*server"
```

## Порты

- **Python API:** `5001`
- **Express сервер:** `3000`
- **Frontend:** `http://localhost:3000`

## Для продакшена

1. Убедитесь, что Python API запущен и доступен
2. Установите переменную окружения (если Python API на другом сервере):
   ```bash
   export PYTHON_API_URL=http://localhost:5001
   ```
3. Запустите Express сервер:
   ```bash
   npm start
   ```

## Troubleshooting

**Порт занят:**
```bash
# Проверить, что использует порт
lsof -i :5001
lsof -i :3000

# Остановить процесс
kill <PID>
```

**Python API не запускается:**
```bash
# Проверить виртуальное окружение
source venv/bin/activate
python --version

# Проверить зависимости
pip list | grep flask
pip list | grep playwright
```

**Express не запускается:**
```bash
# Проверить зависимости
npm list express

# Переустановить
npm install
```
