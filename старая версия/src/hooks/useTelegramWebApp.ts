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

      // Инициализируем WebApp с задержкой, чтобы не блокировать React
      const timeoutId = setTimeout(() => {
        initTelegramWebApp()
        
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
        
        // Одна проверка через 2 секунды
        const recheckTimeoutId = setTimeout(() => {
          checkStatus()
          maintainFullscreenMode()
        }, 2000)

        // Периодическое поддержание полноэкранного режима (реже)
        const maintainInterval = setInterval(() => {
          maintainFullscreenMode()
        }, 60000) // каждую минуту вместо 30 секунд

        // Добавляем классы для стилизации
        document.body.classList.add('telegram-env')

        return () => {
          clearTimeout(recheckTimeoutId)
          clearInterval(maintainInterval)
          document.body.classList.remove('telegram-env')
          cleanupTelegramWebApp()
        }
      }, 500) // Задержка 500ms для загрузки React

      return () => {
        clearTimeout(timeoutId)
      }
      
    } else {
      // Telegram WebApp не обнаружен - это нормально для разработки
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
