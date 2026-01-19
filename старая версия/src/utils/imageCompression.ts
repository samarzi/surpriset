/**
 * Image compression utility
 * Compresses images before upload to reduce file size
 */

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  quality?: number
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 5, // 5 MB max
  maxWidthOrHeight: 1920, // Max dimension
  useWebWorker: false,
  quality: 0.8, // 80% quality
}

/**
 * Compress an image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img
          const maxDimension = opts.maxWidthOrHeight!
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension
              width = maxDimension
            } else {
              width = (width / height) * maxDimension
              height = maxDimension
            }
          }

          // Create canvas
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }

              // Check if compressed size is acceptable
              const sizeMB = blob.size / 1024 / 1024
              if (sizeMB > opts.maxSizeMB!) {
                // Try with lower quality
                canvas.toBlob(
                  (lowerQualityBlob) => {
                    if (!lowerQualityBlob) {
                      reject(new Error('Failed to compress image'))
                      return
                    }
                    
                    const compressedFile = new File(
                      [lowerQualityBlob],
                      file.name,
                      { type: file.type }
                    )
                    resolve(compressedFile)
                  },
                  file.type,
                  opts.quality! * 0.7 // Lower quality
                )
              } else {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                })
                resolve(compressedFile)
              }
            },
            file.type,
            opts.quality
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): {
  valid: boolean
  error?: string
} {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Неподдерживаемый формат. Разрешены: JPG, PNG, WEBP',
    }
  }

  // Check file size (10 MB max before compression)
  const maxSize = 10 * 1024 * 1024 // 10 MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Файл слишком большой. Максимум 10 МБ',
    }
  }

  return { valid: true }
}

/**
 * Compress multiple images
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const compressionPromises = files.map((file) =>
    compressImage(file, options)
  )
  return Promise.all(compressionPromises)
}

/**
 * Get image dimensions
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}
