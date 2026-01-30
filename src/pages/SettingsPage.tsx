import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ProfileSettings from '@/components/ProfileSettings'
import { getTelegramWebApp } from '@/utils/telegram'

export default function SettingsPage() {
  const navigate = useNavigate()
  const [telegramUser, setTelegramUser] = useState<any>(null)

  useEffect(() => {
    const tg = getTelegramWebApp()
    if (tg) {
      const user = tg.initDataUnsafe?.user ?? null
      setTelegramUser(user)
    }
  }, [])

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
            <h1 className="text-xl font-bold text-foreground">Настройки профиля</h1>
            <p className="text-sm text-muted-foreground">
              Управление личной информацией и паролем
            </p>
          </div>
        </div>

        {/* Settings Content */}
        <div className="max-w-2xl mx-auto">
          {telegramUser ? (
            <ProfileSettings />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Для доступа к настройкам необходимо войти через Telegram
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => window.open('https://t.me/surpriset_bot', '_blank')}
                >
                  Открыть в Telegram
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
