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
      <span className="text-sm font-medium text-foreground/80 hidden sm:inline">
        {isDark ? 'Темная' : 'Светлая'}
      </span>
      
      <button
        onClick={toggleTheme}
        className="relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' 
            : 'linear-gradient(135deg, #C6FF00 0%, #A8FF00 100%)',
          boxShadow: isDark
            ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
            : 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.1)'
        }}
        title={`Переключить на ${isDark ? 'светлую' : 'темную'} тему`}
      >
        {/* Track inner shadow */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
        />
        
        {/* Sliding toggle */}
        <div
          className="relative inline-block h-6 w-6 transform rounded-full transition-all duration-300 ease-in-out"
          style={{
            transform: isDark ? 'translateX(2rem)' : 'translateX(0.25rem)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Icon container */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isDark ? (
              <Moon className="h-3 w-3 text-gray-600" />
            ) : (
              <Sun className="h-3 w-3 text-yellow-600" />
            )}
          </div>
          
          {/* Highlight effect */}
          <div 
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.2) 100%)'
            }}
          />
        </div>
      </button>
    </div>
  )
}