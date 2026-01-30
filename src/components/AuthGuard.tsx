import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, LogIn, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface BrowserUser {
  id: string
  telegram_id: number
  telegram_username: string
  first_name: string
  last_name: string
  email: string
  is_admin: boolean
}

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [user, setUser] = useState<BrowserUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    // Блокируем скролл когда модальное окно открыто
    if (showLogin) {
      document.body.classList.add('modal-open')
      return () => {
        document.body.classList.remove('modal-open')
      }
    }
  }, [showLogin])

  const checkAuth = () => {
    try {
      const storedUser = localStorage.getItem('browser_user')
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      localStorage.removeItem('browser_user')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password) {
      setMessage('Введите пароль')
      return
    }

    setLoginLoading(true)
    setMessage('')

    try {
      // Ищем пользователя с включенным паролем
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('password_enabled', true)
        .single()

      if (error || !userData) {
        setMessage('Пользователь не найден или пароль не установлен')
        return
      }

      const passwordHash = btoa(password)
      if (userData.password_hash !== passwordHash) {
        setMessage('Неверный пароль')
        return
      }

      const browserUser: BrowserUser = {
        id: userData.id,
        telegram_id: userData.telegram_id,
        telegram_username: userData.telegram_username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        is_admin: userData.is_admin
      }

      localStorage.setItem('browser_user', JSON.stringify(browserUser))
      setUser(browserUser)
      setShowLogin(false)
      setPassword('')
      setMessage('')

    } catch (error) {
      console.error('Login error:', error)
      setMessage('Ошибка при входе')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('browser_user')
    setUser(null)
    setMessage('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-modern flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return (
      <>
        {children}
        {/* User Menu */}
        <div className="fixed top-4 right-4 z-50">
          <Card className="bg-background/95 backdrop-blur-sm border-2">
            <CardContent className="!p-3">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs"
                >
                  Выйти
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (showLogin) {
    return (
      <div className="modal-centered">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Вход в профиль</h2>
            <p className="text-muted-foreground mb-6">
              Введите пароль для доступа к профилю
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loginLoading} className="flex-1">
                <LogIn className="w-4 h-4 mr-2" />
                {loginLoading ? 'Вход...' : 'Войти'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLogin(false)
                  setPassword('')
                  setMessage('')
                }}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('успешно') 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Нет пароля?{' '}
              <a 
                href="https://t.me/surpriset_bot" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Войдите через Telegram
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show fallback or login button
  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="min-h-screen bg-gradient-modern flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-4">Требуется вход</h2>
          <p className="text-muted-foreground mb-6">
            Войдите в профиль для доступа к функциям
          </p>
          <Button onClick={() => setShowLogin(true)} className="w-full">
            <LogIn className="w-4 h-4 mr-2" />
            Войти по паролю
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Или{' '}
            <a 
              href="https://t.me/surpriset_bot" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              войдите через Telegram
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
