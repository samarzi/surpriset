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

let supportsDisableVerticalSwipes: boolean | null = null
let supportsRequestFullscreen: boolean | null = null
let supportsEnableClosingConfirmation: boolean | null = null
let supportsExitFullscreen: boolean | null = null

/**
 * Получает объект Telegram WebApp
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  return (window as TelegramWindow).Telegram?.WebApp || null
}

function setViewportVars(tg?: TelegramWebApp | null) {
  if (typeof window === 'undefined') return

  const vv = window.visualViewport
  const width = Math.round((vv?.width ?? window.innerWidth) || 0)
  const height = Math.round((vv?.height ?? window.innerHeight) || 0)

  if (width > 0) {
    document.documentElement.style.setProperty('--tg-viewport-width', `${width}px`)
  }
  if (height > 0) {
    document.documentElement.style.setProperty('--tg-viewport-height-js', `${height}px`)
  }
  if (tg?.viewportHeight) {
    document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`)
  }
}

/**
 * Проверяет, запущено ли приложение в Telegram
 */
export function isTelegramWebApp(): boolean {
  return getTelegramWebApp() !== null
}

/**
 * Настраивает полноэкранный режим Telegram WebApp
 */
export function enableFullscreenMode(): boolean {
  const tg = getTelegramWebApp()
  if (!tg) {
    return false
  }

  try {
    // КРИТИЧНО: Отключаем вертикальные свайпы (новый API v7.0+)
    if (tg.disableVerticalSwipes) {
      try {
        if (supportsDisableVerticalSwipes !== false) {
          tg.disableVerticalSwipes()
          supportsDisableVerticalSwipes = true
        }
      } catch (e) {
        // API не поддерживается в текущей версии
        supportsDisableVerticalSwipes = false
      }
    }
    
    // Используем новый API для полноэкранного режима (v7.0+)
    if (tg.requestFullscreen) {
      try {
        if (supportsRequestFullscreen !== false) {
          tg.requestFullscreen()
          supportsRequestFullscreen = true
        }
      } catch (e) {
        // API не поддерживается в текущей версии
        supportsRequestFullscreen = false
      }
    }
    
    // Разворачиваем приложение (работает во всех версиях)
    tg.expand()
    
    // Включаем подтверждение закрытия (v6.1+)
    if (tg.enableClosingConfirmation) {
      try {
        if (supportsEnableClosingConfirmation !== false) {
          tg.enableClosingConfirmation()
          supportsEnableClosingConfirmation = true
        }
      } catch (e) {
        // API не поддерживается в текущей версии
        supportsEnableClosingConfirmation = false
      }
    }
    
    // МАКСИМАЛЬНАЯ ЗАЩИТА: используем только overscroll-behavior
    document.body.style.overscrollBehavior = 'none'
    document.body.style.overscrollBehaviorX = 'none'
    document.body.style.overscrollBehaviorY = 'none'
    document.documentElement.style.overscrollBehavior = 'none'
    document.documentElement.style.overscrollBehaviorX = 'none'
    document.documentElement.style.overscrollBehaviorY = 'none'
    
    // Отключаем стандартные жесты браузера
    ;(document.body.style as any).webkitTouchCallout = 'none'
    ;(document.body.style as any).webkitUserSelect = 'none'
    ;(document.body.style as any).webkitTapHighlightColor = 'transparent'
    
    // Устанавливаем обработчики событий
    if (tg.onEvent) {
      // Обработчик изменения viewport
      tg.onEvent('viewportChanged', () => {
        if (tg.viewportHeight) {
          document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`)
        }
        setViewportVars(tg)
        // Повторно применяем защиту от свайпа
        document.body.style.overscrollBehavior = 'none'
      })
    }
    
    return true
  } catch (error) {
    return false
  }
}

/**
 * Простое и надежное развертывание WebApp
 */
export function expandTelegramWebApp(): boolean {
  const tg = getTelegramWebApp()
  if (!tg) {
    return false
  }

  try {
    tg.expand()
    return true
  } catch (error) {
    return false
  }
}

/**
 * Инициализирует Telegram WebApp с полноэкранным режимом
 */
export function initTelegramWebApp(): void {
  const tg = getTelegramWebApp()
  if (!tg) {
    return
  }

  try {
    // КРИТИЧНО: Блокируем скролл на body и html СРАЗУ с максимальным приоритетом
    const blockBodyScroll = () => {
      // Используем setProperty с !important для максимального приоритета
      document.documentElement.style.setProperty('overflow', 'hidden', 'important')
      document.documentElement.style.setProperty('position', 'fixed', 'important')
      document.documentElement.style.setProperty('width', '100%', 'important')
      document.documentElement.style.setProperty('height', '100%', 'important')
      document.documentElement.style.setProperty('top', '0', 'important')
      document.documentElement.style.setProperty('left', '0', 'important')
      document.documentElement.style.setProperty('touch-action', 'none', 'important')
      
      document.body.style.setProperty('overflow', 'hidden', 'important')
      document.body.style.setProperty('position', 'fixed', 'important')
      document.body.style.setProperty('width', '100%', 'important')
      document.body.style.setProperty('height', '100%', 'important')
      document.body.style.setProperty('top', '0', 'important')
      document.body.style.setProperty('left', '0', 'important')
      document.body.style.setProperty('touch-action', 'none', 'important')
      
      // Блокируем scrollTop
      Object.defineProperty(document.documentElement, 'scrollTop', {
        get: () => 0,
        set: () => {},
        configurable: true
      })
      
      Object.defineProperty(document.body, 'scrollTop', {
        get: () => 0,
        set: () => {},
        configurable: true
      })
    }
    
    // Блокируем скролл немедленно
    blockBodyScroll()

    // КРИТИЧНО: Фиксируем реальный размер viewport (Telegram часто даёт кривой vw)
    setViewportVars(tg)

    // Инициализируем WebApp
    tg.ready()
    
    // Включаем полноэкранный режим
    enableFullscreenMode()
    
    // ГЛОБАЛЬНАЯ ЗАЩИТА ОТ СВАЙПОВ НА УРОВНЕ WINDOW
    const blockSwipeGestures = (e: Event) => {
      // Блокируем все события, связанные с жестами
      if (e.type.includes('gesture') || e.type.includes('swipe')) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }
    
    // Добавляем глобальные обработчики
    window.addEventListener('gesturestart', blockSwipeGestures, { passive: false, capture: true })
    window.addEventListener('gesturechange', blockSwipeGestures, { passive: false, capture: true })
    window.addEventListener('gestureend', blockSwipeGestures, { passive: false, capture: true })
    
    // КРИТИЧНО: Блокируем события прокрутки на body и html
    const preventScroll = (e: Event) => {
      if (e.target === document.body || e.target === document.documentElement) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }
    
    // Блокируем все события прокрутки на body и html
    document.body.addEventListener('scroll', preventScroll, { passive: false, capture: true })
    document.body.addEventListener('touchmove', preventScroll, { passive: false, capture: true })
    document.documentElement.addEventListener('scroll', preventScroll, { passive: false, capture: true })
    document.documentElement.addEventListener('touchmove', preventScroll, { passive: false, capture: true })
    
    // Периодически проверяем и восстанавливаем блокировку скролла (реже)
    setInterval(() => {
      blockBodyScroll()
    }, 5000) // Уменьшена частота с 100ms до 5000ms
    
    // КРИТИЧНО: Добавляем MutationObserver для отслеживания изменений стилей
    const observer = new MutationObserver(() => {
      // Если стили изменились, немедленно восстанавливаем блокировку
      if (document.body.style.position !== 'fixed' || 
          document.body.style.overflow !== 'hidden' ||
          document.documentElement.style.position !== 'fixed' ||
          document.documentElement.style.overflow !== 'hidden') {
        blockBodyScroll()
      }
    })
    
    // Наблюдаем за изменениями атрибутов style на body и html
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['style'] 
    })
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['style'] 
    })
    
    // КРИТИЧНО: Блокируем window.scrollTo()
    const originalScrollTo = window.scrollTo.bind(window)
    window.scrollTo = function(x: any, y?: any) {
      // Разрешаем scrollTo(0, 0) для сброса
      if ((typeof x === 'number' && x === 0 && y === 0) || 
          (typeof x === 'object' && x.top === 0 && x.left === 0)) {
        originalScrollTo(x, y)
      }
    }
    
    // Проверяем, не находимся ли мы в iframe
    if (window.parent !== window) {
      try {
        // Попытка применить стили к parent (может не сработать из-за CORS)
        window.parent.document.body.style.overflow = 'hidden'
      } catch (e) {
        // Игнорируем CORS ошибки
      }
    }
    
    // Дополнительные попытки развертывания с задержками
    setTimeout(() => {
      expandTelegramWebApp()
      enableFullscreenMode()
      blockBodyScroll()
    }, 100)
    
    setTimeout(() => {
      expandTelegramWebApp()
      enableFullscreenMode()
      blockBodyScroll()
    }, 500)
    
    setTimeout(() => {
      expandTelegramWebApp()
      enableFullscreenMode()
      blockBodyScroll()
    }, 1000)
    
    setTimeout(() => {
      expandTelegramWebApp()
      enableFullscreenMode()
      blockBodyScroll()
    }, 2000)
    
    // Скрываем стандартные кнопки Telegram
    if (tg.MainButton) {
      tg.MainButton.hide()
    }
    
    if (tg.BackButton) {
      try {
        tg.BackButton.hide()
      } catch (e) {
        // BackButton не поддерживается в v6.0
      }
    }
    
    // Устанавливаем CSS переменные для viewport
    if (tg.viewportHeight) {
      document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`)
    }

    setViewportVars(tg)

    const onResize = () => setViewportVars(tg)
    window.addEventListener('resize', onResize)
    window.visualViewport?.addEventListener('resize', onResize)
    
    // Добавляем класс для полноэкранного режима
    document.body.classList.add('telegram-fullscreen')
    document.body.classList.add('telegram-env')
    document.documentElement.classList.add('telegram-fullscreen')
    document.documentElement.classList.add('telegram-env')

    // Обновляем переменные ещё раз после применения классов
    setTimeout(() => setViewportVars(tg), 0)
    setTimeout(() => setViewportVars(tg), 250)

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

  try {
    // КРИТИЧНО: Отключаем вертикальные свайпы (v7.0+)
    if (tg.disableVerticalSwipes) {
      try {
        if (supportsDisableVerticalSwipes !== false) {
          tg.disableVerticalSwipes()
          supportsDisableVerticalSwipes = true
        }
      } catch (e) {
        // API не поддерживается
        supportsDisableVerticalSwipes = false
      }
    }
    
    // Повторно включаем полноэкранный режим (v7.0+)
    if (tg.requestFullscreen) {
      try {
        if (supportsRequestFullscreen !== false) {
          tg.requestFullscreen()
          supportsRequestFullscreen = true
        }
      } catch (e) {
        // API не поддерживается
        supportsRequestFullscreen = false
      }
    }
    
    // Убеждаемся, что приложение развернуто
    tg.expand()
    
    // КРИТИЧНО: Повторно включаем подтверждение закрытия (v6.1+)
    if (tg.enableClosingConfirmation) {
      try {
        if (supportsEnableClosingConfirmation !== false) {
          tg.enableClosingConfirmation()
          supportsEnableClosingConfirmation = true
        }
      } catch (e) {
        // API не поддерживается
        supportsEnableClosingConfirmation = false
      }
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
  } catch (error) {
    // Игнорируем ошибки
  }
}

/**
 * Очищает настройки Telegram WebApp
 */
export function cleanupTelegramWebApp(): void {
  const tg = getTelegramWebApp()
  if (!tg) return

  try {
    // Включаем вертикальные свайпы обратно
    if (tg.enableVerticalSwipes) {
      tg.enableVerticalSwipes()
    }
    
    // Отключаем подтверждение закрытия
    if (tg.disableClosingConfirmation) {
      tg.disableClosingConfirmation()
    }
    
    // Выходим из полноэкранного режима
    if (tg.exitFullscreen) {
      if (supportsExitFullscreen !== false) {
        try {
          tg.exitFullscreen()
          supportsExitFullscreen = true
        } catch (e) {
          supportsExitFullscreen = false
        }
      }
    }
    
    // Удаляем классы
    document.body.classList.remove('telegram-fullscreen')
    
    console.log('Telegram WebApp cleaned up')
  } catch (error) {
    console.error('Failed to cleanup Telegram WebApp:', error)
  }
}