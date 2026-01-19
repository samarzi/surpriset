#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔍 Диагностика запуска приложения...\n');

// Проверка файлов конфигурации
const configFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  '.env',
  'index.html'
];

console.log('📁 Проверка конфигурационных файлов:');
configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - найден`);
  } else {
    console.log(`❌ ${file} - отсутствует`);
  }
});

// Проверка основных файлов приложения
const appFiles = [
  'src/main.tsx',
  'src/App.tsx',
  'src/index.css'
];

console.log('\n📱 Проверка основных файлов приложения:');
appFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - найден`);
  } else {
    console.log(`❌ ${file} - отсутствует`);
  }
});

// Проверка зависимостей
console.log('\n📦 Проверка зависимостей:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  
  console.log(`✅ Зависимости: ${dependencies.length} пакетов`);
  console.log(`✅ Dev зависимости: ${devDependencies.length} пакетов`);
  
  // Проверка критических зависимостей
  const criticalDeps = ['react', 'react-dom', 'vite', 'typescript'];
  criticalDeps.forEach(dep => {
    if (dependencies.includes(dep) || devDependencies.includes(dep)) {
      console.log(`✅ ${dep} - установлен`);
    } else {
      console.log(`❌ ${dep} - отсутствует`);
    }
  });
} catch (error) {
  console.log('❌ Ошибка чтения package.json:', error.message);
}

// Проверка TypeScript
console.log('\n🔧 Проверка TypeScript:');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript - без ошибок');
} catch (error) {
  console.log('❌ TypeScript - есть ошибки:');
  console.log(error.stdout?.toString() || error.message);
}

// Проверка переменных окружения
console.log('\n🌍 Проверка переменных окружения:');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const envVars = envContent.split('\n').filter(line => line.includes('='));
  console.log(`✅ Найдено ${envVars.length} переменных окружения`);
  
  // Проверка критических переменных
  const criticalEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  criticalEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar} - настроена`);
    } else {
      console.log(`⚠️ ${envVar} - не найдена`);
    }
  });
} else {
  console.log('⚠️ Файл .env не найден');
}

// Проверка портов
console.log('\n🌐 Проверка доступности портов:');
const ports = [3000, 5173];
ports.forEach(port => {
  try {
    execSync(`lsof -i :${port}`, { stdio: 'pipe' });
    console.log(`✅ Порт ${port} - занят (сервер работает)`);
  } catch (error) {
    console.log(`⚠️ Порт ${port} - свободен`);
  }
});

// Проверка сборки
console.log('\n🏗️ Проверка сборки:');
if (fs.existsSync('dist')) {
  const distFiles = fs.readdirSync('dist');
  if (distFiles.length > 0) {
    console.log(`✅ Папка dist содержит ${distFiles.length} файлов`);
    if (distFiles.includes('index.html')) {
      console.log('✅ index.html найден в dist');
    }
  } else {
    console.log('⚠️ Папка dist пуста');
  }
} else {
  console.log('⚠️ Папка dist не найдена');
}

console.log('\n🎯 Рекомендации:');
console.log('1. Убедитесь, что все зависимости установлены: npm install');
console.log('2. Проверьте переменные окружения в .env файле');
console.log('3. Запустите сервер разработки: npm run dev');
console.log('4. Откройте http://localhost:3000 в браузере');
console.log('5. Проверьте консоль браузера на наличие ошибок');

console.log('\n✨ Диагностика завершена!');