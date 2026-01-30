import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Gift, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { serviceCategoryService, additionalServiceService } from '@/lib/database';
import { ServiceCategory, AdditionalService } from '@/types';
import { ServiceForm } from './ServiceForm';
import { CategoryForm } from './CategoryForm';

export function ServicesManager() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<AdditionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<AdditionalService | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, servicesData] = await Promise.all([
        serviceCategoryService.getAll(),
        additionalServiceService.getAll()
      ]);
      setCategories(categoriesData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Удалить эту услугу?')) return;

    try {
      await additionalServiceService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Ошибка при удалении услуги');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const hasServices = services.some(s => s.category_id === id);
    if (hasServices) {
      alert('Нельзя удалить категорию с услугами. Сначала удалите все услуги в этой категории.');
      return;
    }

    if (!confirm('Удалить эту категорию?')) return;

    try {
      await serviceCategoryService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Ошибка при удалении категории');
    }
  };

  const handleEditService = (service: AdditionalService) => {
    setSelectedService(service);
    setShowServiceForm(true);
  };

  const handleAddService = () => {
    setSelectedService(null);
    setShowServiceForm(true);
  };

  const handleEditCategory = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setShowCategoryForm(true);
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setShowCategoryForm(true);
  };

  const handleFormClose = () => {
    setShowServiceForm(false);
    setShowCategoryForm(false);
    setSelectedService(null);
    setSelectedCategory(null);
    loadData();
  };

  const getServicesByCategory = (categoryId: string) => {
    return services.filter(s => s.category_id === categoryId);
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
            <Gift className="h-5 w-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Дополнительные услуги</h2>
            <p className="text-sm text-muted-foreground">Управление услугами и категориями</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddCategory} variant="outline" className="gap-2">
            <FolderPlus className="h-4 w-4" />
            Категория
          </Button>
          <Button onClick={handleAddService} className="gap-2">
            <Plus className="h-4 w-4" />
            Услуга
          </Button>
        </div>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList>
          <TabsTrigger value="services">Услуги</TabsTrigger>
          <TabsTrigger value="categories">Категории</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          {categories.map((category) => {
            const categoryServices = getServicesByCategory(category.id);
            
            return (
              <div key={category.id} className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                
                {categoryServices.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryServices.map((service) => (
                      <Card key={service.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{service.name}</CardTitle>
                            <Badge variant={service.is_active ? 'default' : 'secondary'}>
                              {service.is_active ? 'Активна' : 'Неактивна'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {service.image_url && (
                            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                              <img
                                src={service.image_url}
                                alt={service.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          {service.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {service.description}
                            </p>
                          )}
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Цена:</span>
                            <span className="font-medium">{service.price}₽</span>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditService(service)}
                              className="flex-1"
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Изменить
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground text-sm">
                        Нет услуг в этой категории
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}

          {categories.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Нет категорий услуг</p>
                <Button onClick={handleAddCategory}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Создать первую категорию
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const serviceCount = getServicesByCategory(category.id).length;
              
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Услуг: {serviceCount}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="flex-1"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Изменить
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={serviceCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {categories.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Нет категорий</p>
                <Button onClick={handleAddCategory}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Добавить категорию
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {showServiceForm && (
        <ServiceForm
          service={selectedService}
          categories={categories}
          onClose={handleFormClose}
        />
      )}

      {showCategoryForm && (
        <CategoryForm
          category={selectedCategory}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
