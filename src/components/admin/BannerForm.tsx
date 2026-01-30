import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { bannerService } from '@/lib/database';
import { Banner } from '@/types';

interface BannerFormProps {
  banner?: Banner | null;
  onClose: () => void;
}

export function BannerForm({ banner, onClose }: BannerFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    link: '',
    is_active: true,
    order: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title,
        image: banner.image,
        link: banner.link || '',
        is_active: banner.is_active,
        order: banner.order
      });
    }
  }, [banner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const bannerData = {
        title: formData.title,
        image: formData.image,
        link: formData.link || null,
        is_active: formData.is_active,
        order: formData.order
      };

      if (banner) {
        await bannerService.update(banner.id, bannerData);
      } else {
        await bannerService.create(bannerData);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения баннера');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Block body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Restore body scroll
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 admin-modal">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity modal-backdrop"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-3xl max-h-[95vh] overflow-hidden bg-background/95 dark:bg-gray-900/95 backdrop-blur-md border-border/50 shadow-2xl modal-content">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-gradient-to-r from-background/80 to-muted/20 dark:from-gray-900/80 dark:to-gray-800/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-xl font-semibold text-foreground">
              {banner ? 'Редактировать баннер' : 'Добавить баннер'}
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
          <CardContent className="p-6 bg-background/50 dark:bg-gray-900/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center">
                    <X className="h-2 w-2 text-destructive" />
                  </div>
                  <p className="text-destructive font-medium text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="bg-muted/30 dark:bg-gray-800/30 rounded-xl p-6 border border-border/50">
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                    <ImageIcon className="h-3 w-3 text-primary" />
                  </div>
                  Информация о баннере
                </h3>
                <div className="space-y-4">
                  <div>
                <Label htmlFor="title">Заголовок *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Заголовок баннера"
                  required
                />
              </div>

              <div>
                <Label htmlFor="image">Изображение баннера *</Label>
                <ImageUpload
                  value={formData.image}
                  onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                  placeholder="Добавить изображение баннера"
                />
              </div>

              <div className="bg-muted/20 dark:bg-gray-800/40 border border-border/30 rounded-xl p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Рекомендации по размерам</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Используйте изображения без текста с разрешением не менее <strong>1440×450 px</strong> (соотношение <strong>16:5</strong>) для десктопа и <strong>1080×1440 px</strong> (соотношение <strong>3:4</strong>) для мобильных устройств. Баннеры автоматически центрируются и подрезаются, чтобы на телефонах оставаться одного размера.
                  </p>
                </div>
                <div className="banner-preview-grid">
                  <div className="banner-preview-card">
                    <div className="text-xs font-semibold text-foreground">Десктоп</div>
                    <div className="banner-preview-figure desktop">
                      {formData.image ? (
                        <img
                          src={formData.image}
                          alt="Десктоп-превью баннера"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>16:5</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Рекомендуем 1440×450 px</p>
                  </div>
                  <div className="banner-preview-card">
                    <div className="text-xs font-semibold text-foreground">Мобильный</div>
                    <div className="banner-preview-figure mobile">
                      {formData.image ? (
                        <img
                          src={formData.image}
                          alt="Мобильное превью баннера"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>3:4</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Рекомендуем 1080×1440 px</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="link">Ссылка (необязательно)</Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="/catalog или https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="order">Порядок отображения</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-3 p-3 bg-muted/20 dark:bg-gray-800/20 rounded-lg border border-border/30">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                />
                <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                  Активный баннер
                </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-border/50 bg-gradient-to-r from-background/50 to-muted/20 dark:from-gray-900/50 dark:to-gray-800/20 -mx-6 -mb-6 px-6 pb-6 mt-8">
              <Button 
                type="submit" 
                disabled={loading} 
                className="flex-1 h-11 bg-primary hover:bg-primary/90 text-black font-medium transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Сохранение...
                  </div>
                ) : (
                  banner ? 'Обновить баннер' : 'Создать баннер'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="px-8 h-11 border-border/50 hover:bg-muted/50 transition-all duration-200"
              >
                Отмена
              </Button>
            </div>
          </form>
          </CardContent>
        </div>
      </Card>
    </div>
  );

  return createPortal(modalContent, document.body);
}