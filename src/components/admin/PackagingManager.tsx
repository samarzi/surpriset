import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { packagingService } from '@/lib/database';
import { Packaging } from '@/types';
import { PackagingForm } from './PackagingForm';

export function PackagingManager() {
  const [packaging, setPackaging] = useState<Packaging[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackaging, setSelectedPackaging] = useState<Packaging | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadPackaging();
  }, []);

  const loadPackaging = async () => {
    try {
      setLoading(true);
      const data = await packagingService.getAll();
      setPackaging(data);
    } catch (error) {
      console.error('Error loading packaging:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту упаковку?')) return;

    try {
      await packagingService.delete(id);
      await loadPackaging();
    } catch (error) {
      console.error('Error deleting packaging:', error);
      alert('Ошибка при удалении упаковки');
    }
  };

  const handleEdit = (pkg: Packaging) => {
    setSelectedPackaging(pkg);
    setShowForm(true);
  };

  const handleAdd = () => {
    setSelectedPackaging(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedPackaging(null);
    loadPackaging();
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Упаковки</h2>
            <p className="text-sm text-muted-foreground">Управление вариантами упаковки</p>
          </div>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить упаковку
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packaging.map((pkg) => (
          <Card key={pkg.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                  {pkg.is_active ? 'Активна' : 'Неактивна'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pkg.image_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={pkg.image_url}
                    alt={pkg.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Цена:</span>
                  <span className="font-medium">{pkg.price}₽</span>
                </div>
                
                {(pkg.width || pkg.height || pkg.depth) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Размеры:</span>
                    <span className="font-medium">
                      {pkg.width || '?'} × {pkg.height || '?'} × {pkg.depth || '?'} см
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(pkg)}
                  className="flex-1"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Изменить
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(pkg.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {packaging.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Нет упаковок</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить первую упаковку
            </Button>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <PackagingForm
          packaging={selectedPackaging}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
