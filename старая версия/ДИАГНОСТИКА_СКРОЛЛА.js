// ДИАГНОСТИКА ПРОБЛЕМЫ СКРОЛЛА В TELEGRAM WEBAPP
// Скопируйте этот код в консоль браузера и выполните

console.log('🔍 НАЧАЛО ДИАГНОСТИКИ СКРОЛЛА')
console.log('=' .repeat(50))

// 1. Проверка окружения
console.log('\n📱 1. ПРОВЕРКА ОКРУЖЕНИЯ:')
console.log('User Agent:', navigator.userAgent)
console.log('Telegram доступен:', !!window.Telegram)
console.log('WebApp доступен:', !!window.Telegram?.WebApp)
console.log('Версия WebApp:', window.Telegram?.WebApp?.version || 'неизвестно')
console.log('В iframe:', window.parent !== window)

// 2. Проверка стилей HTML
console.log('\n🎨 2. СТИЛИ HTML:')
const htmlStyles = getComputedStyle(document.documentElement)
console.log('overflow:', htmlStyles.overflow)
console.log('overflow-x:', htmlStyles.overflowX)
console.log('overflow-y:', htmlStyles.overflowY)
console.log('position:', htmlStyles.position)
console.log('width:', htmlStyles.width)
console.log('height:', htmlStyles.height)
console.log('top:', htmlStyles.top)
console.log('left:', htmlStyles.left)

// 3. Проверка стилей BODY
console.log('\n🎨 3. СТИЛИ BODY:')
const bodyStyles = getComputedStyle(document.body)
console.log('overflow:', bodyStyles.overflow)
console.log('overflow-x:', bodyStyles.overflowX)
console.log('overflow-y:', bodyStyles.overflowY)
console.log('position:', bodyStyles.position)
console.log('width:', bodyStyles.width)
console.log('height:', bodyStyles.height)
console.log('top:', bodyStyles.top)
console.log('left:', bodyStyles.left)
console.log('touch-action:', bodyStyles.touchAction)

// 4. Проверка классов
console.log('\n🏷️ 4. КЛАССЫ:')
console.log('HTML classes:', document.documentElement.className || '(нет)')
console.log('Body classes:', document.body.className || '(нет)')

// 5. Проверка контейнеров
console.log('\n📦 5. КОНТЕЙНЕРЫ:')
const root = document.getElementById('root')
if (root) {
  const rootStyles = getComputedStyle(root)
  console.log('#root overflow:', rootStyles.overflow)
  console.log('#root position:', rootStyles.position)
  console.log('#root height:', rootStyles.height)
}

const container = document.getElementById('telegram-app-container')
if (container) {
  const containerStyles = getComputedStyle(container)
  console.log('#telegram-app-container overflow:', containerStyles.overflow)
  console.log('#telegram-app-container position:', containerStyles.position)
  console.log('#telegram-app-container height:', containerStyles.height)
}

// 6. Проверка scrollTop
console.log('\n📏 6. ТЕКУЩИЙ SCROLL:')
console.log('HTML scrollTop:', document.documentElement.scrollTop)
console.log('HTML scrollHeight:', document.documentElement.scrollHeight)
console.log('HTML clientHeight:', document.documentElement.clientHeight)
console.log('Body scrollTop:', document.body.scrollTop)
console.log('Body scrollHeight:', document.body.scrollHeight)
console.log('Body clientHeight:', document.body.clientHeight)

// 7. Тест прокрутки
console.log('\n🧪 7. ТЕСТ ПРОКРУТКИ (через 3 секунды):')
console.log('Попробуйте прокрутить страницу в течение 3 секунд...')

setTimeout(() => {
  console.log('\n📊 РЕЗУЛЬТАТЫ ПОСЛЕ ПРОКРУТКИ:')
  console.log('HTML scrollTop:', document.documentElement.scrollTop)
  console.log('Body scrollTop:', document.body.scrollTop)
  
  if (document.documentElement.scrollTop > 0) {
    console.log('❌ ПРОБЛЕМА: HTML элемент скроллится!')
  } else if (document.body.scrollTop > 0) {
    console.log('❌ ПРОБЛЕМА: Body элемент скроллится!')
  } else {
    console.log('✅ HTML и Body не скроллятся')
  }
  
  // Проверяем контейнеры
  if (root) {
    console.log('#root scrollTop:', root.scrollTop)
    if (root.scrollTop > 0) {
      console.log('⚠️ #root скроллится')
    }
  }
  
  if (container) {
    console.log('#telegram-app-container scrollTop:', container.scrollTop)
    if (container.scrollTop > 0) {
      console.log('⚠️ #telegram-app-container скроллится')
    }
  }
  
  // Ищем все скроллируемые элементы
  console.log('\n🔍 ПОИСК СКРОЛЛИРУЕМЫХ ЭЛЕМЕНТОВ:')
  const allElements = document.querySelectorAll('*')
  const scrollableElements = []
  
  allElements.forEach(el => {
    if (el.scrollTop > 0 || el.scrollHeight > el.clientHeight) {
      const styles = getComputedStyle(el)
      if (styles.overflow !== 'visible' && styles.overflow !== 'hidden') {
        scrollableElements.push({
          tag: el.tagName,
          id: el.id || '(нет id)',
          class: el.className || '(нет class)',
          scrollTop: el.scrollTop,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          overflow: styles.overflow
        })
      }
    }
  })
  
  if (scrollableElements.length > 0) {
    console.log('Найдено скроллируемых элементов:', scrollableElements.length)
    scrollableElements.forEach((el, i) => {
      console.log(`${i + 1}.`, el)
    })
  } else {
    console.log('Скроллируемые элементы не найдены')
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('🏁 ДИАГНОСТИКА ЗАВЕРШЕНА')
  console.log('\nОтправьте эти результаты разработчику для анализа')
  
}, 3000)

// 8. Установка слушателя событий прокрутки
console.log('\n👂 8. СЛУШАТЕЛЬ СОБЫТИЙ ПРОКРУТКИ:')
console.log('Установлен слушатель. При прокрутке будет показано, какой элемент скроллится.')

let scrollEventCount = 0
const scrollListener = (e) => {
  scrollEventCount++
  if (scrollEventCount <= 5) { // Показываем только первые 5 событий
    console.log(`📜 Scroll event #${scrollEventCount}:`, {
      target: e.target.tagName,
      id: e.target.id || '(нет)',
      class: e.target.className || '(нет)',
      scrollTop: e.target.scrollTop
    })
  } else if (scrollEventCount === 6) {
    console.log('... (дальнейшие события скрыты)')
  }
}

document.addEventListener('scroll', scrollListener, true)

// Очистка через 10 секунд
setTimeout(() => {
  document.removeEventListener('scroll', scrollListener, true)
  console.log('\n🛑 Слушатель событий прокрутки отключен')
}, 10000)

console.log('\n⏳ Ожидание результатов...')
