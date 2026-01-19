import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { bannerService } from '@/lib/database';
import { Banner } from '@/types';
import { BannerForm } from './BannerForm';

export function BannersManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      toast.error('Не удалось загрузить баннеры');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = (banner: Banner) => {
    setDeleteCandidate(banner);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;

    try {
      setDeleting(true);
      await bannerService.delete(deleteCandidate.id);
      await loadBanners();
      toast.success('Баннер удалён');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления баннера');
      toast.error('Не удалось удалить баннер');
    } finally {
      setDeleting(false);
      setDeleteCandidate(null);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await bannerService.update(banner.id, { is_active: !banner.is_active });
      await loadBanners();
      toast.success(banner.is_active ? 'Баннер скрыт' : 'Баннер показан');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка изменения статуса баннера');
      toast.error('Не удалось изменить статус баннера');
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
      toast.success('Порядок баннеров обновлён');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка изменения порядка баннеров');
      toast.error('Не удалось изменить порядок баннеров');
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
          <h1 className="text-xl sm:text-3xl font-bold">Баннеры</h1>
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
          <h1 className="text-xl sm:text-3xl font-bold">Баннеры</h1>
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-3xl font-bold">Управление баннерами</h1>
        <Button onClick={handleAdd} size="responsive" className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить баннер
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">Баннеров пока нет</p>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить первый баннер
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {banners.map((banner, index) => (
            <Card key={banner.id} className="overflow-hidden border border-border/60 bg-card/80 backdrop-blur hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Banner Preview - improved */}
                  <div className="w-full sm:w-56 h-32 sm:h-28 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden flex-shrink-0 border border-border/40 relative group">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Banner';
                      }}
                    />
                    {/* Order badge overlay */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-background/90">
                        #{banner.order}
                      </Badge>
                    </div>
                  </div>

                  {/* Banner Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base sm:text-lg leading-tight">{banner.title}</h3>
                        {banner.link && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                            🔗 {banner.link}
                          </p>
                        )}
                      </div>
                      <Badge variant={banner.is_active ? 'default' : 'secondary'} className="flex-shrink-0">
                        {banner.is_active ? '✓ Активен' : '✕ Скрыт'}
                      </Badge>
                    </div>

                    {/* Actions - improved grid layout */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(banner)}
                        className="gap-1.5 h-9"
                      >
                        {banner.is_active ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            <span className="text-xs">Скрыть</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            <span className="text-xs">Показать</span>
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeOrder(banner, 'up')}
                        disabled={index === 0}
                        className="gap-1.5 h-9"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                        <span className="text-xs">Выше</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeOrder(banner, 'down')}
                        disabled={index === banners.length - 1}
                        className="gap-1.5 h-9"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                        <span className="text-xs">Ниже</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(banner)}
                        className="gap-1.5 h-9"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span className="text-xs">Изменить</span>
                      </Button>
                    </div>

                    {/* Delete button - separate row for emphasis */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRequest(banner)}
                      className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1.5 h-9"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="text-xs">Удалить баннер</span>
                    </Button>
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

    <ConfirmDialog
      open={!!deleteCandidate}
      onOpenChange={(open) => {
        if (!open) setDeleteCandidate(null)
      }}
      title="Удалить баннер?"
      description={deleteCandidate ? `Баннер: ${deleteCandidate.title}` : undefined}
      confirmText="Удалить"
      cancelText="Отмена"
      confirmVariant="destructive"
      loading={deleting}
      onConfirm={handleDeleteConfirm}
    />
    </div>
  );
}