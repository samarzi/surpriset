import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ImageUploadCompactProps {
  onChange: (url: string) => void;
  className?: string;
}

export function ImageUploadCompact({ 
  onChange, 
  className = ""
}: ImageUploadCompactProps) {
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

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <button
        type="button"
        onClick={triggerFileSelect}
        disabled={uploading}
        className="w-full h-full aspect-square rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 transition-all bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-1 sm:gap-2 group"
      >
        {uploading ? (
          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          <>
            <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium">
              Добавить
            </span>
          </>
        )}
      </button>

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
