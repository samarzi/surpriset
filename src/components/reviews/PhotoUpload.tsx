import { useState, useRef } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { validateImageFile } from '@/utils/imageCompression'

interface PhotoUploadProps {
  photos: File[]
  onPhotosChange: (photos: File[]) => void
  maxPhotos?: number
  className?: string
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 3,
  className,
}: PhotoUploadProps) {
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setError('')

    if (photos.length + files.length > maxPhotos) {
      setError(`Максимум ${maxPhotos} фото`)
      return
    }

    // Validate each file
    for (const file of files) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        setError(validation.error || 'Ошибка валидации файла')
        return
      }
    }

    // Create previews
    const newPreviews: string[] = []
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        if (newPreviews.length === files.length) {
          setPreviews([...previews, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    }

    onPhotosChange([...photos, ...files])
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    
    onPhotosChange(newPhotos)
    setPreviews(newPreviews)
    setError('')
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const canAddMore = photos.length < maxPhotos

  return (
    <div className={cn('space-y-3', className)}>
      {/* Photo Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
            >
              <img
                src={preview}
                alt={`Фото ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Удалить фото"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          onClick={handleUploadClick}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {photos.length === 0
            ? 'Добавить фото'
            : `Добавить еще (${photos.length}/${maxPhotos})`}
        </Button>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <ImageIcon className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* Info */}
      {photos.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Максимум {maxPhotos} фото. Форматы: JPG, PNG, WEBP. До 10 МБ каждое.
        </p>
      )}
    </div>
  )
}
