#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 Проверка сборки для Netlify...\n');

const distPath = 'dist';
const requiredFiles = [
  'index.html',
  'assets'
];

// Проверка существования папки dist
if (!fs.existsSync(distPath)) {
  console.log('❌ Папка dist не найдена. Запустите: npm run build');
  process.exit(1);
}

console.log('✅ Папка dist найдена');

// Проверка обязательных файлов
requiredFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - найден`);
  } else {
    console.log(`❌ ${file} - отсутствует`);
    process.exit(1);
  }
});

// Проверка index.html
const indexPath = path.join(distPath, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

if (indexContent.includes('<div id="root">')) {
  console.log('✅ index.html содержит root элемент');
} else {
  console.log('❌ index.html не содержит root элемент');
  process.exit(1);
}

if (indexContent.includes('type="module"')) {
  console.log('✅ index.html содержит модульные скрипты');
} else {
  console.log('❌ index.html не содержит модульные скрипты');
  process.exit(1);
}

// Проверка ассетов
const assetsPath = path.join(distPath, 'assets');
if (fs.existsSync(assetsPath)) {
  const assets = fs.readdirSync(assetsPath);
  const jsFiles = assets.filter(file => file.endsWith('.js'));
  const cssFiles = assets.filter(file => file.endsWith('.css'));
  
  console.log(`✅ Найдено ${jsFiles.length} JS файлов`);
  console.log(`✅ Найдено ${cssFiles.length} CSS файлов`);
  
  if (jsFiles.length === 0) {
    console.log('❌ Не найдено JS файлов');
    process.exit(1);
  }
  
  if (cssFiles.length === 0) {
    console.log('❌ Не найдено CSS файлов');
    process.exit(1);
  }
} else {
  console.log('❌ Папка assets не найдена');
  process.exit(1);
}

// Проверка размера файлов
const stats = fs.statSync(indexPath);
const indexSize = stats.size;

if (indexSize > 0) {
  console.log(`✅ index.html размер: ${indexSize} байт`);
} else {
  console.log('❌ index.html пустой');
  process.exit(1);
}

// Проверка конфигурации Netlify
const netlifyConfig = 'netlify.toml';
const redirectsFile = 'public/_redirects';

if (fs.existsSync(netlifyConfig)) {
  console.log('✅ netlify.toml найден');
} else {
  console.log('⚠️ netlify.toml не найден (опционально)');
}

if (fs.existsSync(redirectsFile)) {
  console.log('✅ public/_redirects найден');
} else {
  console.log('❌ public/_redirects не найден - создайте для SPA роутинга');
}

console.log('\n🎉 Сборка готова для развертывания на Netlify!');
console.log('\n📋 Следующие шаги:');
console.log('1. Убедитесь, что переменные окружения настроены в Netlify');
console.log('2. Установите команду сборки: npm run build');
console.log('3. Установите папку публикации: dist');
console.log('4. Разверните проект');

console.log('\n🔧 Переменные окружения для Netlify:');
console.log('- VITE_SUPABASE_URL');
console.log('- VITE_SUPABASE_ANON_KEY');