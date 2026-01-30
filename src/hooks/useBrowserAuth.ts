import { useState, useEffect } from 'react'

interface BrowserUser {
  id: string
  telegram_id: number
  telegram_username: string
  first_name: string
  last_name: string
  email: string
  is_admin: boolean
}

export function useBrowserAuth() {
  const [user, setUser] = useState<BrowserUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

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

  const login = (userData: BrowserUser) => {
    localStorage.setItem('browser_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('browser_user')
    setUser(null)
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth
  }
}
