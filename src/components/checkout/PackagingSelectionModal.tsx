import { useState, useEffect } from 'react';
import { X, Package, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Packaging } from '@/types';
import { packagingService } from '@/lib/database';
import { toast } from 'sonner';

interface PackagingSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (packaging: Packaging) => void;
}

export default function PackagingSelectionModal({
  isOpen,
  onClose,
  onSelect,
}: PackagingSelectionModalProps) {
  const [packagingOptions, setPackagingOptions] = useState<Packaging[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadPackaging();
    }
  }, [isOpen]);

  const loadPackaging = async () => {
    try {
      setLoading(true);
      const options = await packagingService.getAll(true);
      setPackagingOptions(options);
      if (options.length === 0) {
        toast.error('Нет доступных вариантов упаковки');
      }
    } catch (error) {
      console.error('Failed to load packaging:', error);
      toast.error('Ошибка загрузки вариантов упаковки');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    const selected = packagingOptions.find(p => p.id === selectedId);
    if (selected) {
      onSelect(selected);
    } else {
      toast.error('Выберите упаковку');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading">Выберите упаковку</h2>
            <p className="text-sm text-muted-foreground mt-1">Обязательный шаг для оформления заказа</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : packagingOptions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет доступных вариантов упаковки</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {packagingOptions.map((packaging) => (
                <Card
                  key={packaging.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedId === packaging.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'border-border'
                  }`}
                  onClick={() => setSelectedId(packaging.id)}
                >
                  <div className="p-4">
                    {packaging.image_url && (
                      <div className="relative aspect-video mb-3 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={packaging.image_url}
                          alt={packaging.name}
                          className="w-full h-full object-cover"
                        />
                        {selectedId === packaging.id && (
                          <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    )}
                    <h3 className="font-semibold text-base mb-2">{packaging.name}</h3>
                    {(packaging.width || packaging.height || packaging.depth) && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Размеры: {packaging.width || '?'} × {packaging.height || '?'} × {packaging.depth || '?'} см
                      </p>
                    )}
                    <p className="text-lg font-bold text-primary">{formatPrice(packaging.price)}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4 sm:p-6 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button onClick={handleSelect} disabled={!selectedId} className="flex-1">
            Продолжить
          </Button>
        </div>
      </Card>
    </div>
  );
}
