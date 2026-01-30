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
    <div className="w-full">
      <div className="space-y-4 w-full md:pt-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Управление баннерами</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Всего баннеров: {banners.length}</p>
        </div>
        <Button 
          onClick={handleAdd} 
          size="sm"
          className="gap-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-black shadow-md h-8 text-xs px-3"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Добавить</span>
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center">
            <Image className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Баннеров пока нет</p>
            <Button 
              onClick={handleAdd} 
              className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-black shadow-md text-sm"
            >
              <Plus className="h-4 w-4" />
              Добавить первый баннер
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {banners.map((banner, index) => (
            <Card key={banner.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <CardContent className="!p-4">
                <div className="flex gap-3">
                  {/* Banner Preview - Компактный */}
                  <div className="w-24 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x150?text=Banner';
                      }}
                    />
                  </div>

                  {/* Banner Info - Компактный */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{banner.title}</h3>
                        {banner.link && (
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            🔗 {banner.link}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge 
                          variant={banner.is_active ? 'default' : 'secondary'}
                          className={`text-[9px] h-5 px-1.5 ${banner.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0' : ''}`}
                        >
                          {banner.is_active ? 'Активен' : 'Неактивен'}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] h-5 px-1.5">
                          #{banner.order}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions - Компактные кнопки */}
                    <div className="flex gap-0.5 pt-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(banner)}
                        className="h-7 px-2 text-[10px] hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600"
                      >
                        {banner.is_active ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-0.5" />
                            <span className="hidden sm:inline">Скрыть</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-0.5" />
                            <span className="hidden sm:inline">Показать</span>
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleChangeOrder(banner, 'up')}
                        disabled={index === 0}
                        className="h-7 px-2 text-[10px] hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleChangeOrder(banner, 'down')}
                        disabled={index === banners.length - 1}
                        className="h-7 px-2 text-[10px] hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(banner)}
                        className="h-7 px-2 text-[10px] hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600"
                      >
                        <Edit className="h-3 w-3 mr-0.5" />
                        <span className="hidden sm:inline">Изменить</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(banner.id)}
                        className="h-7 px-2 text-[10px] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
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
    </div>
  );
}