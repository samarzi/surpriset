import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  placeholder?: string;
  className?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  onRemove, 
  className = ""
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите изображение",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Ошибка",
        description: "Размер файла не должен превышать 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Convert to base64 for preview (in real app, upload to storage)
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        toast({
          title: "Успешно",
          description: "Изображение загружено"
        });
      };
      reader.readAsDataURL(file);
    } catch {
      toast({
        title: "Ошибка",
        description: "Ошибка загрузки изображения",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (onRemove) onRemove();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Image Preview */}
      {value && (
        <div className="relative group">
          <div className="relative overflow-hidden rounded-xl border-2 border-border/50 bg-muted/20 dark:bg-gray-800/20">
            <img
              src={value}
              alt="Preview"
              className="w-full h-48 object-cover transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Error';
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-3 right-3 h-8 w-8 p-0 bg-destructive/90 hover:bg-destructive backdrop-blur-sm shadow-lg transition-all duration-200"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Upload Options */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileSelect}
          disabled={uploading}
          className="flex-1 h-11 gap-2 border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
        >
          <Upload className="h-4 w-4" />
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              Загрузка...
            </div>
          ) : (
            'Загрузить с устройства'
          )}
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}