#!/bin/bash

echo "🔍 Диагностика приложения SurpriSet"
echo "===================================="
echo ""

echo "1️⃣ Проверка Node.js и npm:"
node --version
npm --version
echo ""

echo "2️⃣ Проверка зависимостей:"
if [ -d "node_modules" ]; then
    echo "✅ node_modules существует"
else
    echo "❌ node_modules не найден"
fi
echo ""

echo "3️⃣ Проверка переменных окружения:"
if [ -f ".env" ]; then
    echo "✅ .env файл существует"
    echo "Переменные:"
    grep "^VITE_" .env | sed 's/=.*/=***/'
else
    echo "❌ .env файл не найден"
fi
echo ""

echo "4️⃣ Проверка порта 3000:"
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✅ Порт 3000 занят (сервер запущен)"
    echo "PID: $(lsof -ti:3000)"
else
    echo "❌ Порт 3000 свободен (сервер не запущен)"
fi
echo ""

echo "5️⃣ Проверка доступности сервера:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "✅ Сервер отвечает (HTTP 200)"
else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    if [ "$HTTP_CODE" = "000" ]; then
        echo "❌ Сервер не отвечает (не удалось подключиться)"
    else
        echo "⚠️ Сервер вернул код: $HTTP_CODE"
    fi
fi
echo ""

echo "6️⃣ Проверка основных файлов:"
files=("src/main.tsx" "src/App.tsx" "src/pages/AdminPage.tsx" "index.html" "vite.config.ts")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file не найден"
    fi
done
echo ""

echo "7️⃣ Проверка TypeScript:"
if npx tsc --noEmit 2>&1 | grep -q "error"; then
    echo "❌ Есть ошибки TypeScript"
    npx tsc --noEmit 2>&1 | head -20
else
    echo "✅ Ошибок TypeScript не найдено"
fi
echo ""

echo "===================================="
echo "Диагностика завершена!"
echo ""
echo "📝 Для просмотра в браузере откройте: file://$(pwd)/test-app.html"
echo "🌐 Приложение должно быть доступно на: http://localhost:3000"
