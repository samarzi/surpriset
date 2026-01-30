import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploadCompact } from '@/components/ui/image-upload-compact';
import { packagingService } from '@/lib/database';
import { Packaging } from '@/types';

interface PackagingFormProps {
  packaging?: Packaging | null;
  onClose: () => void;
}

export function PackagingForm({ packaging, onClose }: PackagingFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    width: '',
    height: '',
    depth: '',
    image_url: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (packaging) {
      setFormData({
        name: packaging.name,
        price: packaging.price.toString(),
        width: packaging.width?.toString() || '',
        height: packaging.height?.toString() || '',
        depth: packaging.depth?.toString() || '',
        image_url: packaging.image_url || '',
        is_active: packaging.is_active
      });
    }
  }, [packaging]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        name: formData.name,
        price: parseFloat(formData.price),
        width: formData.width ? parseFloat(formData.width) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        depth: formData.depth ? parseFloat(formData.depth) : undefined,
        image_url: formData.image_url || undefined,
        is_active: formData.is_active
      };

      if (packaging) {
        await packagingService.update(packaging.id, data);
      } else {
        await packagingService.create(data);
      }

      onClose();
    } catch (err) {
      console.error('Error saving packaging:', err);
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 admin-modal">
      <div 
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <Card className="relative w-full max-w-2xl max-h-[95vh] overflow-hidden bg-background/95 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Package className="h-4 w-4 text-purple-600" />
            </div>
            <CardTitle>
              {packaging ? 'Редактировать упаковку' : 'Добавить упаковку'}
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Коробка средняя"
                  required
                />
              </div>

              <div>
                <Label htmlFor="price">Цена (₽) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="100"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="width">Ширина (см)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.width}
                    onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                    placeholder="20"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Высота (см)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="depth">Глубина (см)</Label>
                  <Input
                    id="depth"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.depth}
                    onChange={(e) => setFormData(prev => ({ ...prev, depth: e.target.value }))}
                    placeholder="15"
                  />
                </div>
              </div>

              <div>
                <Label>Изображение</Label>
                <div className="mt-2">
                  {formData.image_url ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={formData.image_url}
                        alt="Упаковка"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <ImageUploadCompact
                      onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-primary bg-background border-border rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Активна (доступна для выбора)
                </Label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90 text-black font-medium transition-all duration-200">
                  {packaging ? 'Обновить' : 'Создать'}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
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
