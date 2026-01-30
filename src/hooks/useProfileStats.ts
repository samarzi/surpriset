import { useCallback, useEffect, useState } from 'react'
import { getTelegramWebApp } from '@/utils/telegram'
import { supabase } from '@/lib/supabase'

export interface ProfileStats {
  ordersCount: number
  totalSpent: number
  likesCount: number
}

export function useProfileStats() {
  const [stats, setStats] = useState<ProfileStats>({
    ordersCount: 0,
    totalSpent: 0,
    likesCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const tg = getTelegramWebApp()
      const telegramId = tg?.initDataUnsafe?.user?.id

      if (!telegramId) {
        setStats({ ordersCount: 0, totalSpent: 0, likesCount: 0 })
        return
      }

      // Получаем email пользователя из профиля
      const { data: profileData } = await supabase
        .from('customer_profiles')
        .select('email')
        .eq('telegram_id', telegramId)
        .maybeSingle()

      const email = profileData?.email

      // Получаем количество заказов и общую сумму
      let ordersCount = 0
      let totalSpent = 0

      if (email) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('total')
          .eq('customer_email', email)

        if (!ordersError && ordersData) {
          ordersCount = ordersData.length
          totalSpent = ordersData.reduce((sum, order) => sum + (order.total || 0), 0)
        }
      }

      // Получаем количество лайков
      const { count: likesCount, error: likesError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('telegram_id', telegramId)

      setStats({
        ordersCount,
        totalSpent,
        likesCount: likesError ? 0 : (likesCount || 0),
      })
    } catch (e) {
      console.error('Failed to fetch profile stats:', e)
      setError(e instanceof Error ? e.message : 'Failed to fetch stats')
      setStats({ ordersCount: 0, totalSpent: 0, likesCount: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}
