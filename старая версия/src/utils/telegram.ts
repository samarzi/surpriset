// Утилиты для работы с Telegram WebApp

interface TelegramUser {
  id: number
  username?: string
  first_name?: string
  last_name?: string
}

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  isExpanded?: boolean
  viewportHeight?: number
  enableClosingConfirmation?: () => void
  disableClosingConfirmation?: () => void
  requestFullscreen?: () => void
  exitFullscreen?: () => void
  isFullscreen?: boolean
  disableVerticalSwipes?: () => void
  enableVerticalSwipes?: () => void
  onEvent?: (eventType: string, callback: () => void) => void
  offEvent?: (eventType: string, callback: () => void) => void
  initDataUnsafe?: {
    user?: TelegramUser
  }
  MainButton?: {
    show: () => void
    hide: () => void
    setText: (text: string) => void
    onClick: (callback: () => void) => void
  }
  BackButton?: {
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
  }
}

interface TelegramWindow extends Window {
  Telegram?: {
    WebApp?: TelegramWebApp
  }
}

/**
 * Получает объект Telegram WebApp
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  return (window as TelegramWindow).Telegram?.WebApp || null
}

/**
 * Проверяет, запущено ли приложение в Telegram
 */
export function isTelegramWebApp(): boolean {
  return getTelegramWebApp() !== null
}

/**
 * Проверяет доступность метода в Telegram WebApp API
 */
function isMethodAvailable(tg: TelegramWebApp, methodName: string): boolean {
  return typeof (tg as any)[methodName] === 'function'
}

/**
 * Определяет приблизительную версию Telegram WebApp API
 */
function detectTelegramApiVersion(tg: TelegramWebApp): string {
  // Проверяем наличие методов, появившихся в разных версиях
  if (isMethodAvailable(tg, 'requestFullscreen')) {
    return '7.0+'
  } else if (isMethodAvailable(tg, 'disableVerticalSwipes')) {
    return '6.1+'
  } else if (isMethodAvailable(tg, 'enableClosingConfirmation')) {
    return '6.0+'
  } else if (isMethodAvailable(tg, 'expand')) {
    return '5.0+'
  } else {
    return 'unknown'
  }
}

/**
 * Логирует информацию о совместимости API
 */
function logApiCompatibility(tg: TelegramWebApp): void {
  const version = detectTelegramApiVersion(tg)
  console.log(`📱 Telegram WebApp API version: ${version}`)
  
  const methods = [
    'expand',
    'enableClosingConfirmation',
    'disableClosingConfirmation', 
    'disableVerticalSwipes',
    'enableVerticalSwipes',
    'requestFullscreen',
    'exitFullscreen',
    'onEvent'
  ]
  
  console.log('🔍 API Methods availability:')
  methods.forEach(method => {
    const available = isMethodAvailable(tg, method)
    console.log(`  ${method}: ${available ? '✅' : '❌'}`)
  })
}

/**
 * Настраивает полноэкранный режим Telegram WebApp
 */
export function enableFullscreenMode(): boolean {
  const tg = getTelegramWebApp()
  if (!tg) {
    console.log('Telegram WebApp not available for fullscreen mode')
    return false
  }

  try {
    console.log('Enabling fullscreen mode...')
    
    // Логируем информацию о совместимости API
    logApiCompatibility(tg)
    
    // КРИТИЧНО: Отключаем вертикальные свайпы (новый API) - с проверкой совместимости и try-catch
    if (isMethodAvailable(tg, 'disableVerticalSwipes')) {
      try {
        tg.disableVerticalSwipes!()
        console.log('🔒 Vertical swipes DISABLED via new API')
      } catch (error) {
        console.log('⚠️ disableVerticalSwipes failed - method exists but not supported in this version:', error)
      }
    } else {
      console.log('⚠️ disableVerticalSwipes not supported in this Telegram version - using CSS fallback')
    }
    
    // Используем новый API для полноэкранного режима (если доступен) - с проверкой совместимости и try-catch
    if (isMethodAvailable(tg, 'requestFullscreen')) {
      try {
        tg.requestFullscreen!()
        console.log('Fullscreen mode requested via new API')
      } catch (error) {
        console.log('⚠️ requestFullscreen failed - method exists but not supported in this version:', error)
      }
    } else {
      console.log('⚠️ requestFullscreen not supported in this Telegram version - using expand() fallback')
    }
    
    // Разворачиваем приложение (базовый метод, доступен во всех версиях)
    try {
      tg.expand()
      console.log('WebApp expanded')
    } catch (error) {
      console.log('⚠️ expand() failed:', error)
    }
    
    // Включаем подтверждение закрытия (отключает свайп) - старый метод - с проверкой совместимости и try-catch
    if (isMethodAvailable(tg, 'enableClosingConfirmation')) {
      try {
        tg.enableClosingConfirmation!()
        console.log('🔒 Closing confirmation enabled - swipe-to-close DISABLED')
      } catch (error) {
        console.log('⚠️ enableClosingConfirmation failed - method exists but not supported in this version:', error)
      }
    } else {
      console.log('⚠️ enableClosingConfirmation not supported - relying on CSS protection only')
    }
    
    // МАКСИМАЛЬНАЯ ЗАЩИТА: используем только overscroll-behavior
    document.body.style.overscrollBehavior = 'none'
    document.body.style.overscrollBehaviorX = 'none'
    document.body.style.overscrollBehaviorY = 'none'
    document.documentElement.style.overscrollBehavior = 'none'
    document.documentElement.style.overscrollBehaviorX = 'none'
    document.documentElement.style.overscrollBehaviorY = 'none'
    
    // Отключаем стандартные жесты браузера
    const bodyStyle = document.body.style as unknown as {
      webkitTouchCallout?: string
      webkitUserSelect?: string
      webkitTapHighlightColor?: string
    }
    bodyStyle.webkitTouchCallout = 'none'
    bodyStyle.webkitUserSelect = 'none'
    bodyStyle.webkitTapHighlightColor = 'transparent'
    
    // Устанавливаем обработчики событий - с проверкой совместимости и try-catch
    if (isMethodAvailable(tg, 'onEvent')) {
      try {
        // Обработчик изменения viewport
        tg.onEvent!('viewportChanged', () => {
          console.log('Viewport changed, maintaining fullscreen')
          if (tg.viewportHeight) {
            document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`)
          }
          // Повторно применяем защиту от свайпа
          document.body.style.overscrollBehavior = 'none'
        })
        
        // Обработчик попытки закрытия
        tg.onEvent!('mainButtonClicked', () => {
          console.log('Main button clicked')
        })
        console.log('Event handlers set successfully')
      } catch (error) {
        console.log('⚠️ onEvent failed - method exists but not supported in this version:', error)
      }
    } else {
      console.log('⚠️ onEvent not supported - event handling disabled')
    }
    
    return true
  } catch (error) {
    console.error('Failed to enable fullscreen mode:', error)
    return false
  }
}

/**
 * Простое и надежное развертывание WebApp
 */
export function expandTelegramWebApp(): boolean {
  const tg = getTelegramWebApp()
  if (!tg) {
    console.log('Telegram WebApp not available for expansion')
    return false
  }

  try {
    console.log('Attempting to expand Telegram WebApp...')
    tg.expand()
    console.log('Expand command sent successfully')
    
    // Проверяем результат через небольшую задержку
    setTimeout(() => {
      if (tg.isExpanded !== undefined) {
        console.log('WebApp expanded status:', tg.isExpanded)
      } else {
        console.log('WebApp expansion status unknown')
      }
    }, 100)
    
    return true
  } catch (error) {
    console.error('Failed to expand Telegram WebApp:', error)
    return false
  }
}

/**
 * Инициализирует Telegram WebApp с полноэкранным режимом
 */
export function initTelegramWebApp(): void {
  const tg = getTelegramWebApp()
  if (!tg) {
    console.log('Telegram WebApp not available for initialization')
    return
  }

  console.log('Initializing Telegram WebApp with fullscreen mode...')

  try {
    // Логируем информацию о совместимости API
    logApiCompatibility(tg)
    
    // Инициализируем WebApp СНАЧАЛА
    try {
      tg.ready()
      console.log('Telegram WebApp ready() called')
    } catch (error) {
      console.log('⚠️ ready() failed:', error)
    }
    
    // Даем время React приложению загрузиться перед блокировкой
    setTimeout(() => {
      console.log('Applying Telegram WebApp restrictions after React initialization...')
      
      // Включаем полноэкранный режим
      enableFullscreenMode()
      
      // Мягкая блокировка скролла (только overscroll-behavior)
      document.body.style.overscrollBehavior = 'none'
      document.body.style.overscrollBehaviorX = 'none'
      document.body.style.overscrollBehaviorY = 'none'
      document.documentElement.style.overscrollBehavior = 'none'
      document.documentElement.style.overscrollBehaviorX = 'none'
      document.documentElement.style.overscrollBehaviorY = 'none'
      
      console.log('🔒 Overscroll behavior blocked (soft protection)')
      
      // Развертываем приложение
      expandTelegramWebApp()
      
      // Скрываем стандартные кнопки Telegram
      if (tg.MainButton) {
        try {
          tg.MainButton.hide()
          console.log('Main button hidden')
        } catch (error) {
          console.log('⚠️ MainButton.hide() failed:', error)
        }
      }
      
      if (tg.BackButton) {
        try {
          tg.BackButton.hide()
          console.log('Back button hidden')
        } catch (error) {
          console.log('⚠️ BackButton.hide() failed:', error)
        }
      }
      
      // Устанавливаем CSS переменные для viewport
      if (tg.viewportHeight) {
        document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`)
        console.log(`Viewport height set to: ${tg.viewportHeight}px`)
      }
      
      // Добавляем класс для полноэкранного режима
      document.body.classList.add('telegram-fullscreen')
      document.body.classList.add('telegram-env')
      document.documentElement.classList.add('telegram-fullscreen')
      document.documentElement.classList.add('telegram-env')
      
      console.log('Telegram WebApp initialized successfully with soft protection')
    }, 1000) // Даем 1 секунду React приложению для загрузки
    
  } catch (error) {
    console.error('Failed to initialize Telegram WebApp:', error)
  }
}

/**
 * Принудительно поддерживает полноэкранный режим
 */
export function maintainFullscreenMode(): void {
  const tg = getTelegramWebApp()
  if (!tg) return

  // ВРЕМЕННЫЙ ЛОГ ДЛЯ ПРОВЕРКИ ЗАГРУЗКИ ИСПРАВЛЕННОГО КОДА
  console.log('🔧 maintainFullscreenMode: ИСПРАВЛЕННАЯ ВЕРСИЯ с проверкой совместимости')

  try {
    // КРИТИЧНО: Отключаем вертикальные свайпы (новый API) - с проверкой совместимости
    if (isMethodAvailable(tg, 'disableVerticalSwipes')) {
      try {
        tg.disableVerticalSwipes!()
      } catch {
        console.log('⚠️ disableVerticalSwipes failed - method exists but not supported in this version')
      }
    } else {
      console.log('⚠️ disableVerticalSwipes not supported - maintaining CSS protection only')
    }
    
    // Повторно включаем полноэкранный режим (только API вызовы) - с проверкой совместимости
    if (isMethodAvailable(tg, 'requestFullscreen')) {
      try {
        tg.requestFullscreen!()
      } catch {
        console.log('⚠️ requestFullscreen failed - method exists but not supported in this version')
      }
    } else {
      console.log('⚠️ requestFullscreen not supported - using expand() fallback')
    }
    
    // Убеждаемся, что приложение развернуто (базовый метод, доступен во всех версиях)
    try {
      tg.expand()
    } catch (error) {
      console.log('⚠️ expand() failed in maintainFullscreenMode:', error)
    }
    
    // КРИТИЧНО: Повторно включаем подтверждение закрытия (отключает свайп для сворачивания) - с проверкой совместимости и try-catch
    if (isMethodAvailable(tg, 'enableClosingConfirmation')) {
      try {
        tg.enableClosingConfirmation!()
        console.log('🔒 Closing confirmation RE-ENABLED - swipe-to-close BLOCKED')
      } catch (error) {
        console.log('⚠️ enableClosingConfirmation failed in maintainFullscreenMode:', error)
      }
    } else {
      console.log('⚠️ enableClosingConfirmation not supported - relying on CSS protection only')
    }
    
    // Добавляем класс, если его нет
    if (!document.body.classList.contains('telegram-fullscreen')) {
      document.body.classList.add('telegram-fullscreen')
    }
    
    // МАКСИМАЛЬНАЯ ЗАЩИТА: используем только overscroll-behavior
    document.body.style.overscrollBehavior = 'none'
    document.body.style.overscrollBehaviorX = 'none'
    document.body.style.overscrollBehaviorY = 'none'
    document.documentElement.style.overscrollBehavior = 'none'
    document.documentElement.style.overscrollBehaviorX = 'none'
    document.documentElement.style.overscrollBehaviorY = 'none'
    
    console.log('✅ Fullscreen mode maintained with MAXIMUM swipe protection')
  } catch (error) {
    console.error('Failed to maintain fullscreen mode:', error)
  }
}

/**
 * Очищает настройки Telegram WebApp
 */
export function cleanupTelegramWebApp(): void {
  const tg = getTelegramWebApp()
  if (!tg) return

  try {
    // Включаем вертикальные свайпы обратно - с проверкой совместимости и try-catch
    if (isMethodAvailable(tg, 'enableVerticalSwipes')) {
      try {
        tg.enableVerticalSwipes!()
        console.log('Vertical swipes re-enabled')
      } catch (error) {
        console.log('⚠️ enableVerticalSwipes failed:', error)
      }
    }
    
    // Отключаем подтверждение закрытия - с проверкой совместимости и try-catch
    if (isMethodAvailable(tg, 'disableClosingConfirmation')) {
      try {
        tg.disableClosingConfirmation!()
        console.log('Closing confirmation disabled')
      } catch (error) {
        console.log('⚠️ disableClosingConfirmation failed:', error)
      }
    }
    
    // Выходим из полноэкранного режима - с проверкой совместимости и try-catch
    if (isMethodAvailable(tg, 'exitFullscreen')) {
      try {
        tg.exitFullscreen!()
        console.log('Exited fullscreen mode')
      } catch (error) {
        console.log('⚠️ exitFullscreen failed:', error)
      }
    }
    
    // Удаляем классы
    document.body.classList.remove('telegram-fullscreen')
    
    console.log('Telegram WebApp cleaned up')
  } catch (error) {
    console.error('Failed to cleanup Telegram WebApp:', error)
  }
}