import { useState, useEffect } from 'react';
import { Gift, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { AdditionalService, ServiceCategory } from '@/types';
import { additionalServiceService, serviceCategoryService } from '@/lib/database';
import { toast } from 'sonner';

interface AdditionalServicesSelectionProps {
  selectedServiceIds: string[];
  onSelectionChange: (serviceIds: string[], services: AdditionalService[]) => void;
}

export default function AdditionalServicesSelection({
  selectedServiceIds,
  onSelectionChange,
}: AdditionalServicesSelectionProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<AdditionalService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, servicesData] = await Promise.all([
        serviceCategoryService.getAll(),
        additionalServiceService.getAll(true),
      ]);
      setCategories(categoriesData);
      setServices(servicesData);
    } catch (error) {
      console.error('Failed to load services:', error);
      toast.error('Ошибка загрузки дополнительных услуг');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleService = (serviceId: string) => {
    const newSelectedIds = selectedServiceIds.includes(serviceId)
      ? selectedServiceIds.filter(id => id !== serviceId)
      : [...selectedServiceIds, serviceId];
    
    const selectedServices = services.filter(s => newSelectedIds.includes(s.id));
    onSelectionChange(newSelectedIds, selectedServices);
  };

  const getServicesByCategory = (categoryId: string) => {
    return services.filter(s => s.category_id === categoryId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Нет доступных дополнительных услуг</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {categories.map((category) => {
        const categoryServices = getServicesByCategory(category.id);
        if (categoryServices.length === 0) return null;

        return (
          <div key={category.id} className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {category.name}
            </h4>
            <div className="space-y-2">
              {categoryServices.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    className={`group flex items-center gap-3 rounded-2xl border p-2.5 text-left transition-all checkout-card ${
                      isSelected
                        ? 'border-primary/60 bg-primary/5 shadow-md'
                        : 'border-border/50 bg-background hover:border-primary/40 hover:bg-muted/30'
                    }`}
                    onClick={() => handleToggleService(service.id)}
                    type="button"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-muted checkout-card-image">
                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          alt={service.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Gift className="h-6 w-6" />
                        </div>
                      )}
                      {isSelected && (
                        <span className="absolute right-1 top-1 rounded-full bg-primary p-1 text-white shadow">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <h5 className="text-xs sm:text-sm font-semibold leading-tight line-clamp-2 checkout-card-title">
                        {service.name}
                      </h5>
                      {service.description && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 checkout-card-meta">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">Цена</span>
                      <span className="text-sm font-bold text-primary checkout-price">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
