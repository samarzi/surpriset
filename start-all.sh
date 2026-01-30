#!/bin/bash

# Скрипт для запуска всех сервисов

echo "🚀 Запуск SurpriSet сервисов..."

# Проверка виртуального окружения
if [ ! -d "venv" ]; then
    echo "❌ Виртуальное окружение не найдено. Создайте его: python3 -m venv venv"
    exit 1
fi

# Активация виртуального окружения
source venv/bin/activate

# Запуск Python API сервера в фоне
echo "📦 Запуск Python API сервера на порту 5001..."
python api_server.py > /tmp/api_server.log 2>&1 &
API_PID=$!
echo "✅ Python API сервер запущен (PID: $API_PID)"

# Ожидание запуска API
sleep 2

# Проверка работы API
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo "✅ Python API сервер работает"
else
    echo "⚠️  Python API сервер не отвечает, но продолжаем..."
fi

# Запуск Express сервера
echo "🌐 Запуск Express сервера на порту 3000..."
echo "📝 Логи Python API: tail -f /tmp/api_server.log"
echo "🛑 Для остановки: kill $API_PID и Ctrl+C"
echo ""
echo "✨ Сервисы запущены!"
echo "   - Frontend: http://localhost:3000"
echo "   - Python API: http://localhost:5001"
echo ""

# Запуск Express сервера (блокирующий)
npm start
