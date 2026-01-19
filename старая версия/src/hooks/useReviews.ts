import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Review, ReviewFormData, ReviewStats } from '@/types/review'
import { uploadReviewPhotos, deleteReviewPhotos } from '@/utils/reviewStorage'
import { useTelegramWebApp } from './useTelegramWebApp'

export function useReviews(productId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { telegramUser } = useTelegramWebApp()

  // Fetch reviews
  const fetchReviews = async (sortBy: 'date' | 'rating' | 'photos' = 'date') => {
    if (!productId) return

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'approved')

      // Apply sorting
      switch (sortBy) {
        case 'rating':
          query = query.order('rating', { ascending: false })
          break
        case 'photos':
          query = query.not('photos', 'eq', '{}').order('created_at', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setReviews(data || [])
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError('Не удалось загрузить отзывы')
    } finally {
      setLoading(false)
    }
  }

  // Fetch review stats
  const fetchStats = async () => {
    if (!productId) return

    try {
      const { data, error: statsError } = await supabase
        .from('products')
        .select('reviews_count, average_rating')
        .eq('id', productId)
        .single()

      if (statsError) throw statsError

      // Fetch rating distribution
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('status', 'approved')

      if (reviewsError) throw reviewsError

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      reviewsData?.forEach((review) => {
        distribution[review.rating as keyof typeof distribution]++
      })

      setStats({
        average_rating: data?.average_rating || 0,
        reviews_count: data?.reviews_count || 0,
        rating_distribution: distribution,
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  // Create review
  const createReview = async (formData: ReviewFormData): Promise<void> => {
    if (!productId || !telegramUser) {
      throw new Error('Необходима авторизация через Telegram')
    }

    try {
      // Create review record
      const { data: review, error: createError } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: telegramUser.id.toString(),
          user_name: telegramUser.first_name || telegramUser.username || 'Пользователь',
          rating: formData.rating,
          comment: formData.comment || null,
          photos: [],
          status: 'pending',
        })
        .select()
        .single()

      if (createError) throw createError

      // Upload photos if any
      if (formData.photos.length > 0) {
        const photoUrls = await uploadReviewPhotos(formData.photos, review.id)
        
        // Update review with photo URLs
        const { error: updateError } = await supabase
          .from('reviews')
          .update({ photos: photoUrls })
          .eq('id', review.id)

        if (updateError) throw updateError
      }

      // Refresh reviews
      await fetchReviews()
      await fetchStats()
    } catch (err) {
      console.error('Error creating review:', err)
      throw new Error('Не удалось создать отзыв')
    }
  }

  // Update review
  const updateReview = async (reviewId: string, formData: ReviewFormData): Promise<void> => {
    if (!telegramUser) {
      throw new Error('Необходима авторизация')
    }

    try {
      // Check if can edit (within 24 hours)
      const { data: existingReview, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .single()

      if (fetchError) throw fetchError

      const canEditUntil = new Date(existingReview.can_edit_until)
      if (new Date() > canEditUntil) {
        throw new Error('Время редактирования истекло')
      }

      // Delete old photos if new ones provided
      if (formData.photos.length > 0 && existingReview.photos.length > 0) {
        await deleteReviewPhotos(existingReview.photos)
      }

      // Upload new photos
      let photoUrls = existingReview.photos
      if (formData.photos.length > 0) {
        photoUrls = await uploadReviewPhotos(formData.photos, reviewId)
      }

      // Update review and reset status to pending for re-moderation
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          rating: formData.rating,
          comment: formData.comment || null,
          photos: photoUrls,
          status: 'pending', // Reset to pending for re-moderation
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)

      if (updateError) throw updateError

      // Refresh reviews
      await fetchReviews()
      await fetchStats()
    } catch (err) {
      console.error('Error updating review:', err)
      throw err
    }
  }

  // Delete review
  const deleteReview = async (reviewId: string): Promise<void> => {
    if (!telegramUser) {
      throw new Error('Необходима авторизация')
    }

    try {
      // Get review to delete photos
      const { data: review, error: fetchError } = await supabase
        .from('reviews')
        .select('photos')
        .eq('id', reviewId)
        .single()

      if (fetchError) throw fetchError

      // Delete photos
      if (review.photos.length > 0) {
        await deleteReviewPhotos(review.photos)
      }

      // Delete review
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (deleteError) throw deleteError

      // Refresh reviews
      await fetchReviews()
      await fetchStats()
    } catch (err) {
      console.error('Error deleting review:', err)
      throw new Error('Не удалось удалить отзыв')
    }
  }

  // Get user's review for product
  const getUserReview = async (): Promise<Review | null> => {
    if (!productId || !telegramUser) return null

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', telegramUser.id.toString())
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return data || null
    } catch (err) {
      console.error('Error fetching user review:', err)
      return null
    }
  }

  useEffect(() => {
    if (productId) {
      fetchReviews()
      fetchStats()
    }
  }, [productId])

  return {
    reviews,
    stats,
    loading,
    error,
    fetchReviews,
    createReview,
    updateReview,
    deleteReview,
    getUserReview,
  }
}
