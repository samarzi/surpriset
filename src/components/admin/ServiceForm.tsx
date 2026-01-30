import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploadCompact } from '@/components/ui/image-upload-compact';
import { additionalServiceService } from '@/lib/database';
import { AdditionalService, ServiceCategory } from '@/types';

interface ServiceFormProps {
  service?: AdditionalService | null;
  categories: ServiceCategory[];
  onClose: () => void;
}

export function ServiceForm({ service, categories, onClose }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (service) {
      setFormData({
        category_id: service.category_id,
        name: service.name,
        description: service.description || '',
        price: service.price.toString(),
        image_url: service.image_url || '',
        is_active: service.is_active
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        category_id: formData.category_id,
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        image_url: formData.image_url || undefined,
        is_active: formData.is_active
      };

      if (service) {
        await additionalServiceService.update(service.id, data);
      } else {
        await additionalServiceService.create(data);
      }

      onClose();
    } catch (err) {
      console.error('Error saving service:', err);
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
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Gift className="h-4 w-4 text-pink-600" />
            </div>
            <CardTitle>
              {service ? 'Редактировать услугу' : 'Добавить услугу'}
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
                <Label htmlFor="category_id">Категория *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Сначала создайте категорию
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Поздравительная открытка"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Красивая открытка с вашим поздравлением"
                  rows={3}
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
                  placeholder="50"
                  required
                />
              </div>

              <div>
                <Label>Изображение</Label>
                <div className="mt-2">
                  {formData.image_url ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={formData.image_url}
                        alt="Услуга"
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
                <Button type="submit" disabled={loading || categories.length === 0} className="flex-1 bg-primary hover:bg-primary/90 text-black font-medium transition-all duration-200">
                  {service ? 'Обновить' : 'Создать'}
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
