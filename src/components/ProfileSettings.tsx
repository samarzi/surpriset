import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Save, Key, User, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getTelegramWebApp } from '@/utils/telegram'
import { mediumHaptic } from '@/utils/haptics'

interface UserProfile {
  id: string
  telegram_id: number
  telegram_username: string
  first_name: string
  last_name: string
  phone: string
  email: string
  password_enabled: boolean
}

export default function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const tg = getTelegramWebApp()
      if (!tg?.initDataUnsafe?.user) return

      const telegramUser = tg.initDataUnsafe.user
      
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .single()

      if (existingUser) {
        setProfile(existingUser)
      } else {
        // Create new user
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            telegram_id: telegramUser.id,
            telegram_username: telegramUser.username || '',
            first_name: telegramUser.first_name || '',
            last_name: telegramUser.last_name || '',
          })
          .select()
          .single()

        setProfile(newUser)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!profile) return

    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          email: profile.email,
        })
        .eq('id', profile.id)

      if (error) throw error

      setMessage('Профиль успешно сохранен!')
      mediumHaptic()
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage('Ошибка при сохранении профиля')
    } finally {
      setSaving(false)
    }
  }

  const setPassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('Пароли не совпадают')
      return
    }

    if (newPassword.length < 6) {
      setMessage('Пароль должен быть не менее 6 символов')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      // Hash password (simple hash for demo - in production use proper hashing)
      const passwordHash = btoa(newPassword) // Simple encoding - use bcrypt in production

      const { error } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          password_enabled: true,
        })
        .eq('id', profile!.id)

      if (error) throw error

      setMessage('Пароль успешно установлен!')
      setShowPasswordForm(false)
      setNewPassword('')
      setConfirmPassword('')
      mediumHaptic()
      
      // Reload profile
      await loadProfile()
    } catch (error) {
      console.error('Error setting password:', error)
      setMessage('Ошибка при установке пароля')
    } finally {
      setSaving(false)
    }
  }

  const removePassword = async () => {
    if (!confirm('Вы уверены, что хотите удалить пароль?')) return

    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('users')
        .update({
          password_hash: null,
          password_enabled: false,
        })
        .eq('id', profile!.id)

      if (error) throw error

      setMessage('Пароль успешно удален!')
      mediumHaptic()
      
      // Reload profile
      await loadProfile()
    } catch (error) {
      console.error('Error removing password:', error)
      setMessage('Ошибка при удалении пароля')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <p>Ошибка загрузки профиля</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Личная информация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                value={profile.first_name || ''}
                onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                placeholder="Введите имя"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                value={profile.last_name || ''}
                onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                placeholder="Введите фамилию"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ''}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <Button onClick={saveProfile} disabled={saving} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Сохранение...' : 'Сохранить профиль'}
          </Button>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Пароль для входа через браузер
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.password_enabled ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-green-800 dark:text-green-200">
                  ✓ Пароль установлен. Вы можете войти через браузер используя ваш email и пароль.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="flex-1"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Изменить пароль
                </Button>
                <Button
                  variant="destructive"
                  onClick={removePassword}
                  disabled={saving}
                  className="flex-1"
                >
                  Удалить пароль
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Пароль не установлен. Установите пароль для возможности входа через браузер.
              </p>
              <Button
                onClick={() => setShowPasswordForm(true)}
                className="w-full"
              >
                <Key className="w-4 h-4 mr-2" />
                Установить пароль
              </Button>
            </div>
          )}

          {showPasswordForm && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <Label htmlFor="newPassword">Новый пароль</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
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

              <div>
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={setPassword}
                  disabled={saving || !newPassword || !confirmPassword}
                  className="flex-1"
                >
                  {saving ? 'Сохранение...' : 'Установить пароль'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('успешно') 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
