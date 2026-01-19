import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { bannerService } from '@/lib/database';
import { Banner } from '@/types';
import { BannerForm } from './BannerForm';

export function BannersManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await bannerService.getAll();
      setBanners(data.sort((a, b) => a.order - b.order));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки баннеров');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот баннер?')) return;
    
    try {
      await bannerService.delete(id);
      await loadBanners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления баннера');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await bannerService.update(banner.id, { is_active: !banner.is_active });
      await loadBanners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка изменения статуса баннера');
    }
  };

  const handleChangeOrder = async (banner: Banner, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b.id === banner.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    
    const targetBanner = banners[targetIndex];
    
    try {
      await Promise.all([
        bannerService.update(banner.id, { order: targetBanner.order }),
        bannerService.update(targetBanner.id, { order: banner.order })
      ]);
      await loadBanners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка изменения порядка баннеров');
    }
  };

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setShowForm(true);
  };

  const handleAdd = () => {
    setSelectedBanner(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedBanner(null);
    loadBanners();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Управление баннерами</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Управление баннерами</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Ошибка: {error}</p>
              <Button onClick={loadBanners} className="mt-4">
                Попробовать снова
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Управление баннерами</h1>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить баннер
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Баннеров пока нет</p>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить первый баннер
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <Card key={banner.id}>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Banner Preview */}
                  <div className="w-48 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x150?text=Banner';
                      }}
                    />
                  </div>

                  {/* Banner Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{banner.title}</h3>
                        {banner.link && (
                          <p className="text-sm text-muted-foreground">
                            Ссылка: {banner.link}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                          {banner.is_active ? 'Активен' : 'Неактивен'}
                        </Badge>
                        <Badge variant="outline">
                          Порядок: {banner.order}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(banner)}
                        className="gap-1"
                      >
                        {banner.is_active ? (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Скрыть
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            Показать
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeOrder(banner, 'up')}
                        disabled={index === 0}
                        className="gap-1"
                      >
                        <ArrowUp className="h-3 w-3" />
                        Выше
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeOrder(banner, 'down')}
                        disabled={index === banners.length - 1}
                        className="gap-1"
                      >
                        <ArrowDown className="h-3 w-3" />
                        Ниже
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(banner)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Изменить
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(banner.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Banner Form Modal */}
      {showForm && (
        <BannerForm
          banner={selectedBanner}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}