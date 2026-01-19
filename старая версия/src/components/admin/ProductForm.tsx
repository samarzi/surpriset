import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { CategoryManager } from './CategoryManager';
import { productService } from '@/lib/database';
import { Product, ProductStatus, ProductType } from '@/types';

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    composition: '',
    price: '',
    original_price: '',
    images: [] as string[],
    tags: [] as string[],
    category_id: null as string | null,
    status: 'in_stock' as ProductStatus,
    type: 'product' as ProductType,
    is_featured: false,
    specifications: {} as Record<string, string>
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        name: product.name,
        description: product.description,
        composition: product.composition || '',
        price: product.price.toString(),
        original_price: product.original_price?.toString() || '',
        images: product.images,
        tags: product.tags,
        category_id: product.category_id || null,
        status: product.status,
        type: product.type,
        is_featured: product.is_featured,
        specifications: product.specifications || {}
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const productData = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        composition: formData.composition || null,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        images: formData.images,
        tags: formData.tags,
        category_id: formData.category_id,
        status: formData.status,
        type: formData.type,
        is_featured: formData.is_featured,
        specifications: Object.keys(formData.specifications).length > 0 ? formData.specifications : null
      };

      if (product) {
        await productService.update(product.id, productData);
      } else {
        await productService.create(productData);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения товара');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 3) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const removeImage = (imageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageToRemove)
    }));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const images = [...prev.images];
      if (toIndex < 0 || toIndex >= images.length) {
        return prev;
      }
      const [moved] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, moved);
      return {
        ...prev,
        images,
      };
    });
  };

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey.trim()]: specValue.trim()
        }
      }));
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (keyToRemove: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[keyToRemove];
      return {
        ...prev,
        specifications: newSpecs
      };
    });
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
      <Card className="relative w-full max-w-5xl max-h-[95vh] overflow-hidden bg-background/95 dark:bg-gray-900/95 backdrop-blur-md border-border/50 shadow-2xl modal-content">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-gradient-to-r from-background/80 to-muted/20 dark:from-gray-900/80 dark:to-gray-800/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-xl font-semibold text-foreground">
              {product ? 'Редактировать товар' : 'Добавить товар'}
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

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Basic Info */}
                <div className="space-y-6">
                  <div className="bg-muted/30 dark:bg-gray-800/30 rounded-xl p-4 border border-border/50">
                    <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                        <Package className="h-3 w-3 text-primary" />
                      </div>
                      Основная информация
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                          placeholder="PROD-001"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="name">Название *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Название товара"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="price">Цена *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="1000.00"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="original_price">Первоначальная цена</Label>
                        <Input
                          id="original_price"
                          type="number"
                          step="0.01"
                          value={formData.original_price}
                          onChange={(e) => setFormData(prev => ({ ...prev, original_price: e.target.value }))}
                          placeholder="1200.00"
                        />
                      </div>

                      <div>
                        <CategoryManager
                          selectedCategoryId={formData.category_id}
                          onCategorySelect={(categoryId) => setFormData(prev => ({ ...prev, category_id: categoryId }))}
                          showSelector={true}
                        />
                      </div>

                      <div>
                        <Label htmlFor="status">Статус</Label>
                        <Select value={formData.status} onValueChange={(value: 'in_stock' | 'coming_soon' | 'out_of_stock') => setFormData(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in_stock">В наличии</SelectItem>
                            <SelectItem value="coming_soon">Скоро</SelectItem>
                            <SelectItem value="out_of_stock">Закончилось</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="type">Тип</Label>
                        <Select value={formData.type} onValueChange={(value: 'product' | 'bundle') => setFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product">Товар</SelectItem>
                            <SelectItem value="bundle">Набор</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-muted/20 dark:bg-gray-800/20 rounded-lg border border-border/30">
                        <input
                          type="checkbox"
                          id="is_featured"
                          checked={formData.is_featured}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                        />
                        <Label htmlFor="is_featured" className="text-sm font-medium cursor-pointer">
                          Рекомендуемый товар
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description and Details */}
                <div className="space-y-6">
                  <div className="bg-muted/30 dark:bg-gray-800/30 rounded-xl p-4 border border-border/50">
                    <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
                        <span className="text-xs text-blue-600 dark:text-blue-400">📝</span>
                      </div>
                      Описание и детали
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="description">Описание *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Описание товара"
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="composition">Состав/Комплектация</Label>
                        <Textarea
                          id="composition"
                          value={formData.composition}
                          onChange={(e) => setFormData(prev => ({ ...prev, composition: e.target.value }))}
                          placeholder="Что входит в комплект"
                          rows={3}
                        />
                      </div>

                      {/* Tags */}
                      <div>
                        <Label>Теги (максимум 3)</Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Добавить тег"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            disabled={formData.tags.length >= 3}
                          />
                          <Button
                            type="button"
                            onClick={addTag}
                            disabled={formData.tags.length >= 3}
                            size="sm"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="bg-muted/30 dark:bg-gray-800/30 rounded-xl p-6 border border-border/50">
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center">
                    <span className="text-xs text-green-600 dark:text-green-400">🖼️</span>
                  </div>
                  Изображения товара (до 10 фото)
                </h3>
                <div className="space-y-4">
                  {formData.images.map((image, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Изображение {index + 1}</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => moveImage(index, index - 1)}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => moveImage(index, index + 1)}
                            disabled={index === formData.images.length - 1}
                          >
                            ↓
                          </Button>
                        </div>
                      </div>
                      <ImageUpload
                        value={image}
                        onChange={(url) => {
                          const newImages = [...formData.images];
                          newImages[index] = url;
                          setFormData(prev => ({ ...prev, images: newImages }));
                        }}
                        onRemove={() => removeImage(image)}
                      />
                    </div>
                  ))}
                  
                  {/* Add new image */}
                  {formData.images.length < 10 && (
                    <div>
                      <Label>Добавить ещё изображение ({formData.images.length}/10)</Label>
                      <ImageUpload
                        value=""
                        onChange={(url) => {
                          if (url && !formData.images.includes(url) && formData.images.length < 10) {
                            setFormData(prev => ({
                              ...prev,
                              images: [...prev.images, url]
                            }));
                          }
                        }}
                      />
                    </div>
                  )}
                  
                  {formData.images.length >= 10 && (
                    <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      Достигнуто максимальное количество изображений (10)
                    </div>
                  )}
                </div>
              </div>

              {/* Specifications */}
              <div className="bg-muted/30 dark:bg-gray-800/30 rounded-xl p-6 border border-border/50">
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                    <span className="text-xs text-primary">⚙️</span>
                  </div>
                  Характеристики
                </h3>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    placeholder="Название характеристики"
                  />
                  <Input
                    value={specValue}
                    onChange={(e) => setSpecValue(e.target.value)}
                    placeholder="Значение"
                  />
                  <Button type="button" onClick={addSpecification} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(formData.specifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between bg-background/50 dark:bg-gray-900/50 p-3 rounded-lg border border-border/30">
                      <span className="text-sm"><strong className="text-foreground">{key}:</strong> <span className="text-muted-foreground">{value}</span></span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSpecification(key)}
                        className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-border/50 bg-gradient-to-r from-background/50 to-muted/20 dark:from-gray-900/50 dark:to-gray-800/20 -mx-6 -mb-6 px-6 pb-6 mt-8">
                <Button 
                  type="submit" 
                  disabled={loading}
                  loading={loading}
                  className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200"
                >
                  {product ? 'Обновить товар' : 'Создать товар'}
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