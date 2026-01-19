import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, setTheme, isTelegram } = useTheme()

  // Не показываем переключатель в Telegram
  if (isTelegram) {
    return null
  }

  const isDark = theme === 'dark'

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted hidden sm:inline">
        {isDark ? 'Темная' : 'Светлая'}
      </span>
      
      <button
        onClick={toggleTheme}
        className="theme-toggle-button"
        title={`Переключить на ${isDark ? 'светлую' : 'темную'} тему`}
      >
        {/* Sliding toggle */}
        <div className={`theme-toggle-slider ${isDark ? 'theme-toggle-slider-dark' : ''}`}>
          {/* Icon container */}
          <div className="theme-toggle-icon">
            {isDark ? (
              <Moon className="h-3 w-3 text-gray-600" />
            ) : (
              <Sun className="h-3 w-3 text-yellow-600" />
            )}
          </div>
        </div>
      </button>
    </div>
  )
}