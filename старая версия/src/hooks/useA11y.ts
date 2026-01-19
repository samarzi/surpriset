/**
 * Хуки для поддержки доступности (A11Y)
 */

import { useEffect, useRef, useState } from 'react'

/**
 * Хук для управления фокусом
 */
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement>(null)

  const focusElement = () => {
    if (focusRef.current) {
      focusRef.current.focus()
    }
  }

  const trapFocus = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    const focusableElements = focusRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (!focusableElements || focusableElements.length === 0) return

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  return {
    focusRef,
    focusElement,
    trapFocus
  }
}

/**
 * Хук для ARIA live regions
 */
export function useAriaLive() {
  const [message, setMessage] = useState('')
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite')

  const announce = (text: string, level: 'polite' | 'assertive' = 'polite') => {
    setMessage('')
    setPoliteness(level)
    
    // Небольшая задержка для обеспечения обновления
    setTimeout(() => {
      setMessage(text)
    }, 100)
  }

  const clear = () => {
    setMessage('')
  }

  return {
    message,
    politeness,
    announce,
    clear
  }
}

/**
 * Хук для клавиатурной навигации
 */
export function useKeyboardNavigation(items: HTMLElement[], options: {
  loop?: boolean
  orientation?: 'horizontal' | 'vertical'
} = {}) {
  const { loop = true, orientation = 'vertical' } = options
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleKeyDown = (event: KeyboardEvent) => {
    const isVertical = orientation === 'vertical'
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft'

    switch (event.key) {
      case nextKey:
        event.preventDefault()
        setCurrentIndex(prev => {
          const next = prev + 1
          if (next >= items.length) {
            return loop ? 0 : prev
          }
          return next
        })
        break

      case prevKey:
        event.preventDefault()
        setCurrentIndex(prev => {
          const next = prev - 1
          if (next < 0) {
            return loop ? items.length - 1 : prev
          }
          return next
        })
        break

      case 'Home':
        event.preventDefault()
        setCurrentIndex(0)
        break

      case 'End':
        event.preventDefault()
        setCurrentIndex(items.length - 1)
        break
    }
  }

  useEffect(() => {
    if (items[currentIndex]) {
      items[currentIndex].focus()
    }
  }, [currentIndex, items])

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown
  }
}

/**
 * Хук для определения предпочтений пользователя по доступности
 */
export function useAccessibilityPreferences() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [prefersHighContrast, setPrefersHighContrast] = useState(false)
  const [prefersDarkMode, setPrefersDarkMode] = useState(false)

  useEffect(() => {
    // Проверяем предпочтения пользователя
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')

    setPrefersReducedMotion(reducedMotionQuery.matches)
    setPrefersHighContrast(highContrastQuery.matches)
    setPrefersDarkMode(darkModeQuery.matches)

    // Слушаем изменения
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches)
    }

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setPrefersDarkMode(e.matches)
    }

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange)
    highContrastQuery.addEventListener('change', handleHighContrastChange)
    darkModeQuery.addEventListener('change', handleDarkModeChange)

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange)
      highContrastQuery.removeEventListener('change', handleHighContrastChange)
      darkModeQuery.removeEventListener('change', handleDarkModeChange)
    }
  }, [])

  return {
    prefersReducedMotion,
    prefersHighContrast,
    prefersDarkMode
  }
}

/**
 * Хук для скринридеров
 */
export function useScreenReader() {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false)

  useEffect(() => {
    // Простая проверка на наличие скринридера
    // Это не 100% точно, но дает представление
    const checkScreenReader = () => {
      // Проверяем наличие специфичных для скринридеров свойств
      const hasScreenReaderIndicators = 
        'speechSynthesis' in window ||
        navigator.userAgent.includes('NVDA') ||
        navigator.userAgent.includes('JAWS') ||
        navigator.userAgent.includes('VoiceOver')

      setIsScreenReaderActive(hasScreenReaderIndicators)
    }

    checkScreenReader()

    // Также проверяем при фокусе на элементах
    const handleFocus = () => {
      if (document.activeElement?.getAttribute('aria-label') || 
          document.activeElement?.getAttribute('aria-describedby')) {
        setIsScreenReaderActive(true)
      }
    }

    document.addEventListener('focusin', handleFocus)
    return () => document.removeEventListener('focusin', handleFocus)
  }, [])

  return {
    isScreenReaderActive
  }
}

/**
 * Утилиты для доступности
 */
export const a11yUtils = {
  /**
   * Генерирует уникальный ID для связывания элементов
   */
  generateId: (prefix: string = 'a11y') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Создает описание для скринридера
   */
  createAriaDescription: (text: string, id?: string) => {
    const descId = id || a11yUtils.generateId('desc')
    
    // Создаем скрытый элемент с описанием
    let descElement = document.getElementById(descId)
    if (!descElement) {
      descElement = document.createElement('div')
      descElement.id = descId
      descElement.className = 'sr-only'
      descElement.setAttribute('aria-hidden', 'true')
      document.body.appendChild(descElement)
    }
    
    descElement.textContent = text
    return descId
  },

  /**
   * Объявляет сообщение для скринридера
   */
  announceToScreenReader: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    // Удаляем элемент через некоторое время
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  },

  /**
   * Проверяет, является ли элемент фокусируемым
   */
  isFocusable: (element: HTMLElement): boolean => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ]

    return focusableSelectors.some(selector => element.matches(selector))
  },

  /**
   * Получает все фокусируемые элементы в контейнере
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const selector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    return Array.from(container.querySelectorAll(selector))
  }
}