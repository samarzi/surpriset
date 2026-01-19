import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { adminService } from '@/lib/database'

interface AdminRow {
  id: string
  username: string
  telegram_id: number | null
  first_name: string | null
}

export function AdminsManager() {
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const loadAdmins = async () => {
    try {
      setLoading(true)
      const data = await adminService.getAll()
      setAdmins(data as AdminRow[])
    } catch (error) {
      console.error('Failed to load admins', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAdmins()
  }, [])

  const handleAdd = async () => {
    if (!username.trim()) return
    try {
      setLoading(true)
      await adminService.addAdmin(username.trim())
      setUsername('')
      await loadAdmins()
    } catch (error) {
      console.error('Failed to add admin', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (name: string) => {
    try {
      setLoading(true)
      await adminService.removeAdmin(name)
      await loadAdmins()
    } catch (error) {
      console.error('Failed to remove admin', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Администраторы</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex gap-2">
          <Input
            placeholder="username без @ (например, t0g0r0t)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={loading}>
            Добавить
          </Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {admins.length === 0 && (
            <p className="text-muted-foreground text-xs">Пока нет администраторов.</p>
          )}
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between rounded border px-3 py-1.5 bg-card"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">@{admin.username}</p>
                {admin.first_name && (
                  <p className="text-xs text-muted-foreground truncate">{admin.first_name}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(admin.username)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Удалить
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
