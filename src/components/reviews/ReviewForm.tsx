import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from './StarRating'
import { PhotoUpload } from './PhotoUpload'
import { ReviewFormData } from '@/types/review'
import { Loader2 } from 'lucide-react'

interface ReviewFormProps {
  onSubmit: (data: ReviewFormData) => Promise<void>
  initialData?: ReviewFormData
  isEditing?: boolean
  onCancel?: () => void
}

export function ReviewForm({
  onSubmit,
  initialData,
  isEditing = false,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialData?.rating || 0)
  const [comment, setComment] = useState(initialData?.comment || '')
  const [photos, setPhotos] = useState<File[]>(initialData?.photos || [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setRating(initialData.rating)
      setComment(initialData.comment)
      setPhotos(initialData.photos)
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (rating === 0) {
      setError('Пожалуйста, поставьте оценку')
      return
    }

    try {
      setSubmitting(true)
      await onSubmit({
        rating,
        comment,
        photos,
      })
      
      // Reset form if not editing
      if (!isEditing) {
        setRating(0)
        setComment('')
        setPhotos([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Оценка <span className="text-destructive">*</span>
        </label>
        <StarRating
          rating={rating}
          onRatingChange={setRating}
          size="lg"
        />
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium mb-2">
          Комментарий (необязательно)
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Расскажите о вашем опыте с этим товаром..."
          rows={4}
          maxLength={1000}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {comment.length}/1000 символов
        </p>
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Фотографии (необязательно)
        </label>
        <PhotoUpload
          photos={photos}
          onPhotosChange={setPhotos}
          maxPhotos={3}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={submitting || rating === 0}
          className="flex-1"
        >
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Сохранить изменения' : 'Отправить отзыв'}
        </Button>
        
        {isEditing && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Отмена
          </Button>
        )}
      </div>

      {/* Info */}
      {!isEditing && (
        <p className="text-xs text-muted-foreground">
          Отзыв будет отправлен на модерацию. После одобрения вы сможете редактировать его в течение 24 часов.
        </p>
      )}
    </form>
  )
}
