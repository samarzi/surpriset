export interface Review {
  id: string
  product_id: string
  user_id: string
  user_name: string | null
  rating: number
  comment: string | null
  photos: string[]
  status: 'pending' | 'approved' | 'rejected'
  admin_reply: string | null
  admin_reply_at: string | null
  created_at: string
  updated_at: string
  moderated_by: string | null
  moderated_at: string | null
  can_edit_until: string
}

export interface ReviewFormData {
  rating: number
  comment: string
  photos: File[]
}

export interface ReviewStats {
  average_rating: number
  reviews_count: number
  rating_distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}
