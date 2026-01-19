import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Review } from '@/types/review'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/reviews/StarRating'
import { Check, X, MessageSquare, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { ru } from 'date-fns/locale/ru'

interface ReviewWithProduct extends Review {
  products?: {
    name: string
    images: string[]
  }
}

export default function ReviewModerationPage() {
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    fetchPendingReviews()
  }, [])

  const fetchPendingReviews = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('reviews')
        .select('*, products(name, images)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      setReviews(data || [])
    } catch (err) {
      console.error('Error fetching reviews:', err)
      toast.error('Не удалось загрузить отзывы')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (reviewId: string) => {
    try {
      setProcessingId(reviewId)
      const { error } = await supabase
        .from('reviews')
        .update({
          status: 'approved',
          moderated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)

      if (error) throw error

      toast.success('Отзыв одобрен')
      await fetchPendingReviews()
    } catch (err) {
      console.error('Error approving review:', err)
      toast.error('Не удалось одобрить отзыв')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (reviewId: string) => {
    try {
      setProcessingId(reviewId)
      const { error } = await supabase
        .from('reviews')
        .update({
          status: 'rejected',
          moderated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)

      if (error) throw error

      toast.success('Отзыв отклонен')
      await fetchPendingReviews()
    } catch (err) {
      console.error('Error rejecting review:', err)
      toast.error('Не удалось отклонить отзыв')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error('Введите текст ответа')
      return
    }

    try {
      setProcessingId(reviewId)
      const { error } = await supabase
        .from('reviews')
        .update({
          admin_reply: replyText,
          admin_reply_at: new Date().toISOString(),
        })
        .eq('id', reviewId)

      if (error) throw error

      toast.success('Ответ добавлен')
      setReplyingTo(null)
      setReplyText('')
      await fetchPendingReviews()
    } catch (err) {
      console.error('Error adding reply:', err)
      toast.error('Не удалось добавить ответ')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Модерация отзывов</h1>
          <p className="text-muted-foreground">
            Отзывов на модерации: {reviews.length}
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">Нет отзывов на модерации</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 space-y-4">
                {/* Product Info */}
                <div className="flex items-center gap-3 pb-3 border-b">
                  {review.products?.images?.[0] && (
                    <img
                      src={review.products.images[0]}
                      alt={review.products.name || 'Товар'}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium">{review.products?.name || 'Товар'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </p>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {review.user_name || 'Пользователь'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {review.user_id}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <StarRating rating={review.rating} readonly size="sm" />

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm leading-relaxed">{review.comment}</p>
                )}

                {/* Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {review.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Фото ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === review.id ? (
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <label className="text-sm font-medium">Ответ администратора</label>
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Введите ваш ответ..."
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReply(review.id)}
                        disabled={processingId === review.id}
                      >
                        {processingId === review.id && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Отправить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyText('')
                        }}
                        disabled={processingId === review.id}
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReplyingTo(review.id)}
                    disabled={processingId !== null}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ответить
                  </Button>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    onClick={() => handleApprove(review.id)}
                    disabled={processingId !== null}
                    className="flex-1"
                  >
                    {processingId === review.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Одобрить
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(review.id)}
                    disabled={processingId !== null}
                    className="flex-1"
                  >
                    {processingId === review.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Отклонить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
