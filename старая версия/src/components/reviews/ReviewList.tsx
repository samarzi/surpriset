import { useState } from 'react'
import { Review } from '@/types/review'
import { ReviewCard } from './ReviewCard'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ReviewListProps {
  reviews: Review[]
  currentUserId?: string
  onEdit?: (review: Review) => void
  onDelete?: (reviewId: string) => void
  onSortChange?: (sort: 'date' | 'rating' | 'photos') => void
}

const REVIEWS_PER_PAGE = 10

export function ReviewList({
  reviews,
  currentUserId,
  onEdit,
  onDelete,
  onSortChange,
}: ReviewListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'photos'>('date')

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE)
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE
  const endIndex = startIndex + REVIEWS_PER_PAGE
  const currentReviews = reviews.slice(startIndex, endIndex)

  const handleSortChange = (value: string) => {
    const newSort = value as 'date' | 'rating' | 'photos'
    setSortBy(newSort)
    setCurrentPage(1)
    onSortChange?.(newSort)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Пока нет отзывов</p>
        <p className="text-sm text-muted-foreground mt-1">
          Будьте первым, кто оставит отзыв!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Всего отзывов: {reviews.length}
        </p>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">По дате</SelectItem>
              <SelectItem value="rating">По рейтингу</SelectItem>
              <SelectItem value="photos">С фотографиями</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-3">
        {currentReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            canEdit={review.user_id === currentUserId}
            canDelete={review.user_id === currentUserId}
            onEdit={() => onEdit?.(review)}
            onDelete={() => onDelete?.(review.id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first, last, current, and adjacent pages
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-9"
                  >
                    {page}
                  </Button>
                )
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2 text-muted-foreground">
                    ...
                  </span>
                )
              }
              return null
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
