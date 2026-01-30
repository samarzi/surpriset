# 🚀 Инструкция по развертыванию на продакшене

## Проблема
При развертывании на домене `rybakovarina-psy.online` импорт товаров выдает ошибку 404, потому что:
1. Express сервер не может подключиться к Python API на `localhost:5001`
2. Python API должен быть запущен на продакшен сервере

## Решение

### Вариант 1: Запуск Python API на том же сервере (рекомендуется)

1. **Установите зависимости на продакшен сервере:**
```bash
# Установите Python 3.10+
python3 --version

# Создайте виртуальное окружение
python3 -m venv venv
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt

# Установите Playwright браузеры
playwright install chromium
```

2. **Настройте переменные окружения:**
```bash
# В .env файле или через экспорт
export PYTHON_API_URL=http://localhost:5001
export FLASK_PORT=5001
export FLASK_DEBUG=false
```

3. **Запустите Python API сервер:**
```bash
# В фоновом режиме или через systemd/supervisor
nohup python api_server.py > /tmp/api_server.log 2>&1 &

# Или через systemd (создайте файл /etc/systemd/system/surpriset-api.service):
[Unit]
Description=SurpriSet Python API Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/surpriset
Environment="PYTHON_API_URL=http://localhost:5001"
ExecStart=/path/to/surpriset/venv/bin/python api_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

4. **Проверьте работу:**
```bash
curl http://localhost:5001/api/health
# Должен вернуть: {"ok":true}
```

### Вариант 2: Использование внешнего Python API сервера

Если Python API запущен на другом сервере:

1. **Настройте переменную окружения в Express:**
```bash
export PYTHON_API_URL=http://your-python-api-server:5001
# или
export PYTHON_API_URL=https://your-python-api-server.com
```

2. **Перезапустите Express сервер:**
```bash
pm2 restart server
# или
systemctl restart surpriset-express
```

### Вариант 3: Использование Nginx как reverse proxy

Если используете Nginx:

```nginx
# В конфигурации Nginx
upstream python_api {
    server localhost:5001;
}

server {
    listen 80;
    server_name rybakovarina-psy.online;

    # Прокси для Python API
    location /api/parse {
        proxy_pass http://python_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }

    # Прокси для Express (остальные маршруты)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Проверка работы

1. **Проверьте Python API:**
```bash
curl http://localhost:5001/api/health
```

2. **Проверьте Express прокси:**
```bash
curl https://rybakovarina-psy.online/api/health
```

3. **Проверьте импорт товара:**
- Откройте админ-панель
- Попробуйте импортировать товар
- Проверьте логи: `tail -f /tmp/api_server.log`

## Логирование

- **Python API:** `/tmp/api_server.log`
- **Express:** консоль или PM2 логи
- **Проверка ошибок:**
```bash
# Python API логи
tail -f /tmp/api_server.log

# Express логи (если через PM2)
pm2 logs server

# Системные логи
journalctl -u surpriset-api -f
```

## Важные замечания

1. **Безопасность:**
   - Не открывайте Python API напрямую в интернет
   - Используйте только через Express прокси или Nginx
   - Настройте firewall для порта 5001

2. **Производительность:**
   - Playwright требует ресурсов
   - Рекомендуется минимум 2GB RAM
   - Рассмотрите использование очередей для парсинга

3. **Мониторинг:**
   - Настройте мониторинг процессов
   - Используйте systemd или PM2 для автозапуска
   - Настройте алерты при падении сервисов
