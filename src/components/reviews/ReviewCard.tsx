import { Review } from '@/types/review'
import { StarRating } from './StarRating'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { ru } from 'date-fns/locale/ru'
import { User, MessageSquare, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface ReviewCardProps {
  review: Review
  canEdit?: boolean
  canDelete?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function ReviewCard({
  review,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const timeAgo = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
    locale: ru,
  })

  const canEditNow = canEdit && new Date() < new Date(review.can_edit_until)

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {review.user_name || 'Пользователь'}
            </p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>

        {/* Actions */}
        {(canEditNow || canDelete) && (
          <div className="flex gap-1">
            {canEditNow && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Rating */}
      <StarRating rating={review.rating} readonly size="sm" />

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-foreground leading-relaxed">
          {review.comment}
        </p>
      )}

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {review.photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setSelectedPhoto(photo)}
              className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border hover:border-primary transition-colors"
            >
              <img
                src={photo}
                alt={`Фото ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Admin Reply */}
      {review.admin_reply && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg border-l-2 border-primary">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-primary">Ответ администратора</p>
          </div>
          <p className="text-sm text-foreground">{review.admin_reply}</p>
          {review.admin_reply_at && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(review.admin_reply_at), {
                addSuffix: true,
                locale: ru,
              })}
            </p>
          )}
        </div>
      )}

      {/* Status Badge (for pending reviews) */}
      {review.status === 'pending' && (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded text-xs font-medium">
          На модерации
        </div>
      )}

      {/* Edit time remaining */}
      {canEditNow && (
        <p className="text-xs text-muted-foreground">
          Можно редактировать до{' '}
          {new Date(review.can_edit_until).toLocaleString('ru-RU')}
        </p>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Фото отзыва"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  )
}
