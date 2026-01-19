import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getTelegramWebApp } from '@/utils/telegram'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  isTelegram: boolean
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  isTelegram: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'surpriset-ui-theme',
  ...props
}: ThemeProviderProps) {
  // Проверяем, запущено ли приложение в Telegram
  const isTelegram = !!getTelegramWebApp()
  
  // В Telegram всегда используем темную тему, иначе берем из localStorage
  const [theme, setTheme] = useState<Theme>(
    () => isTelegram ? 'dark' : ((localStorage.getItem(storageKey) as Theme) || defaultTheme)
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    // В Telegram всегда используем темную тему
    if (isTelegram) {
      root.classList.add('dark')
      return
    }

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme, isTelegram])

  const value = {
    theme: isTelegram ? 'dark' : theme,
    setTheme: (newTheme: Theme) => {
      // В Telegram игнорируем попытки изменить тему
      if (isTelegram) {
        return
      }
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
    isTelegram,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}