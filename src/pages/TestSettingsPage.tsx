import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TestSettingsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-modern mobile-safe-area">
      <div className="container mx-auto px-2 py-3">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Тест настроек</h1>
            <p className="text-sm text-muted-foreground">
              Проверка работы маршрутизации
            </p>
          </div>
        </div>

        {/* Test Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Настройки работают!</h2>
            <p className="text-muted-foreground mb-4">
              Если вы видите эту страницу, значит маршрутизация работает правильно.
            </p>
            <Button onClick={() => navigate('/profile')}>
              Вернуться в профиль
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
