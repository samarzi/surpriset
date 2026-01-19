import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
  className?: string
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showNumber = false,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value)
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((value) => {
        const isFilled = value <= rating
        const isHalf = value - 0.5 === rating

        return (
          <button
            key={value}
            type="button"
            onClick={() => handleClick(value)}
            disabled={readonly}
            className={cn(
              'transition-all duration-200',
              !readonly && 'cursor-pointer',
              readonly && 'cursor-default'
            )}
            aria-label={`${value} звезд${value === 1 ? 'а' : value < 5 ? 'ы' : ''}`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors duration-200',
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : isHalf
                  ? 'fill-yellow-400/50 text-yellow-400'
                  : 'fill-none text-muted-foreground',
                !readonly && 'hover:text-yellow-400'
              )}
            />
          </button>
        )
      })}
      
      {showNumber && (
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// Компонент для отображения среднего рейтинга с количеством отзывов
interface AverageRatingProps {
  rating: number
  reviewsCount: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AverageRating({
  rating,
  reviewsCount,
  size = 'md',
  className,
}: AverageRatingProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <StarRating rating={rating} readonly size={size} />
      <span className="text-sm text-muted-foreground">
        {rating.toFixed(1)} ({reviewsCount} {reviewsCount === 1 ? 'отзыв' : reviewsCount < 5 ? 'отзыва' : 'отзывов'})
      </span>
    </div>
  )
}
