import { useEffect, useState } from 'react'
import { getTelegramWebApp, initTelegramWebApp, cleanupTelegramWebApp, maintainFullscreenMode } from '@/utils/telegram'

interface TelegramUser {
  id: number
  username?: string
  first_name?: string
  last_name?: string
}

export function useTelegramWebApp() {
  const [isTelegram, setIsTelegram] = useState(false)
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const tg = getTelegramWebApp()
    if (tg) {
      setIsTelegram(true)

      const user = tg.initDataUnsafe?.user ?? null
      if (user) {
        setTelegramUser(user)
      }

      // КРИТИЧНО: Не инициализируем fullscreen на админ-панели
      const isAdminPage = window.location.pathname.startsWith('/admin')
      if (isAdminPage) {
        return
      }

      // Инициализируем WebApp с полноэкранным режимом
      initTelegramWebApp()
      
      // Добавляем состояние в историю для предотвращения случайного выхода
      window.history.pushState(null, '', window.location.href)
      
      // Проверяем статус развертывания и полноэкранного режима
      const checkStatus = () => {
        if (tg.isExpanded !== undefined) {
          setIsExpanded(tg.isExpanded)
        } else {
          setIsExpanded(true)
        }
        
        if (tg.isFullscreen !== undefined) {
          setIsFullscreen(tg.isFullscreen)
        } else {
          setIsFullscreen(true)
        }
      }

      checkStatus()
      
      // Повторные проверки статуса и поддержание полноэкранного режима
      const intervals = [100, 500, 1000, 2000, 5000]
      intervals.forEach(delay => {
        setTimeout(() => {
          checkStatus()
          maintainFullscreenMode()
          
          // Дополнительно вызываем enableClosingConfirmation и disableVerticalSwipes
          const tg = getTelegramWebApp()
          if (tg?.enableClosingConfirmation) {
            try {
              tg.enableClosingConfirmation()
            } catch (e) {
              // API не поддерживается
            }
          }
          if (tg?.disableVerticalSwipes) {
            try {
              tg.disableVerticalSwipes()
            } catch (e) {
              // API не поддерживается
            }
          }
        }, delay)
      })

      // Периодическое поддержание полноэкранного режима (реже)
      const maintainInterval = setInterval(() => {
        maintainFullscreenMode()
        
        // Дополнительно вызываем enableClosingConfirmation и disableVerticalSwipes
        const tg = getTelegramWebApp()
        if (tg?.enableClosingConfirmation) {
          try {
            tg.enableClosingConfirmation()
          } catch (e) {
            // API не поддерживается
          }
        }
        if (tg?.disableVerticalSwipes) {
          try {
            tg.disableVerticalSwipes()
          } catch (e) {
            // API не поддерживается
          }
        }
      }, 30000) // каждые 30 секунд вместо 10

      // Добавляем классы для стилизации
      document.body.classList.add('telegram-env')

      return () => {
        clearInterval(maintainInterval)
        document.body.classList.remove('telegram-env')
        
        cleanupTelegramWebApp()
      }
    }
  }, [])

  // Функция для принудительного включения полноэкранного режима
  const forceFullscreen = () => {
    if (isTelegram) {
      maintainFullscreenMode()
    }
  }

  return {
    isTelegram,
    telegramUser,
    isExpanded,
    isFullscreen,
    forceFullscreen,
  }
}
