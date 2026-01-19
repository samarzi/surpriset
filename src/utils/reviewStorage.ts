/**
 * Supabase Storage utility for review photos
 */

import { supabase } from '@/lib/supabase'
import { compressImage, validateImageFile } from './imageCompression'

const BUCKET_NAME = 'review-photos'
const MAX_PHOTOS = 3

/**
 * Upload review photo to Supabase Storage
 */
export async function uploadReviewPhoto(
  file: File,
  reviewId: string
): Promise<{ url: string; path: string }> {
  // Validate file
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Compress image
  const compressedFile = await compressImage(file, {
    maxSizeMB: 5,
    maxWidthOrHeight: 1920,
    quality: 0.8,
  })

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(7)
  const extension = file.name.split('.').pop()
  const filename = `${reviewId}/${timestamp}-${randomString}.${extension}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, compressedFile, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error('Не удалось загрузить фото')
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)

  return {
    url: publicUrl,
    path: data.path,
  }
}

/**
 * Upload multiple review photos
 */
export async function uploadReviewPhotos(
  files: File[],
  reviewId: string
): Promise<string[]> {
  if (files.length > MAX_PHOTOS) {
    throw new Error(`Максимум ${MAX_PHOTOS} фото`)
  }

  const uploadPromises = files.map((file) =>
    uploadReviewPhoto(file, reviewId)
  )
  
  const results = await Promise.all(uploadPromises)
  return results.map((result) => result.url)
}

/**
 * Delete review photo from Supabase Storage
 */
export async function deleteReviewPhoto(photoUrl: string): Promise<void> {
  try {
    // Extract path from URL
    const url = new URL(photoUrl)
    const pathParts = url.pathname.split(`/${BUCKET_NAME}/`)
    if (pathParts.length < 2) {
      throw new Error('Invalid photo URL')
    }
    
    const path = pathParts[1]

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      throw new Error('Не удалось удалить фото')
    }
  } catch (error) {
    console.error('Error deleting photo:', error)
    throw error
  }
}

/**
 * Delete multiple review photos
 */
export async function deleteReviewPhotos(photoUrls: string[]): Promise<void> {
  const deletePromises = photoUrls.map((url) => deleteReviewPhoto(url))
  await Promise.all(deletePromises)
}

/**
 * Create storage bucket if it doesn't exist
 * This should be run once during setup
 */
export async function ensureReviewPhotoBucket(): Promise<void> {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME)

    if (!bucketExists) {
      // Create bucket
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10 MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      })

      if (error) {
        console.error('Error creating bucket:', error)
        throw error
      }

      console.log('Review photos bucket created successfully')
    }
  } catch (error) {
    console.error('Error ensuring bucket:', error)
    throw error
  }
}

/**
 * Get photo URL from path
 */
export function getPhotoUrl(path: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
  return publicUrl
}
