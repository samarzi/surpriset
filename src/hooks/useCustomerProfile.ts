import { useCallback, useEffect, useState } from 'react'
import { getTelegramWebApp } from '@/utils/telegram'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

export type CustomerProfile = Database['public']['Tables']['customer_profiles']['Row']

export type CustomerProfileUpsert = {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
}

export function useCustomerProfile() {
  const [telegramId, setTelegramId] = useState<number | null>(null)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const tg = getTelegramWebApp()
    const id = tg?.initDataUnsafe?.user?.id ?? null
    setTelegramId(id)
  }, [])

  const fetchProfile = useCallback(async () => {
    if (!telegramId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('telegram_id', telegramId)
        .maybeSingle()

      if (error) throw error
      setProfile((data as CustomerProfile) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [telegramId])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  const upsertProfile = useCallback(
    async (payload: CustomerProfileUpsert) => {
      if (!telegramId) {
        throw new Error('Telegram user not found')
      }

      try {
        setLoading(true)
        setError(null)

        const now = new Date().toISOString()

        const { data, error } = await supabase
          .from('customer_profiles')
          .upsert(
            {
              telegram_id: telegramId,
              first_name: payload.first_name ?? null,
              last_name: payload.last_name ?? null,
              email: payload.email ?? null,
              phone: payload.phone ?? null,
              updated_at: now,
            },
            { onConflict: 'telegram_id' },
          )
          .select()
          .single()

        if (error) throw error

        setProfile(data as CustomerProfile)
        return data as CustomerProfile
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to save profile'
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    [telegramId],
  )

  const isComplete = Boolean(
    profile?.first_name && profile?.last_name && profile?.phone && profile?.email,
  )

  return {
    telegramId,
    profile,
    isComplete,
    loading,
    error,
    refetch: fetchProfile,
    upsertProfile,
  }
}
