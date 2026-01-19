import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, X, Check, FolderOpen } from 'lucide-react';
import type { ProductCategory } from '@/types';
import { supabase } from '@/lib/supabase';

interface CategoryManagerProps {
  selectedCategoryId?: string | null;
  onCategorySelect?: (categoryId: string | null) => void;
  showSelector?: boolean;
}

export function CategoryManager({ 
  selectedCategoryId, 
  onCategorySelect, 
  showSelector = false 
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Введите название категории');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('product_categories')
        .insert([{
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsAdding(false);
      toast.success('Категория добавлена');
    } catch (error: any) {
      console.error('Error adding category:', error);
      if (error.code === '23505') {
        toast.error('Категория с таким названием уже существует');
      } else {
        toast.error('Не удалось добавить категорию');
      }
    }
  };

  const handleEditCategory = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Введите название категории');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('product_categories')
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => 
        prev.map(cat => cat.id === id ? data : cat)
           .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      toast.success('Категория обновлена');
    } catch (error: any) {
      console.error('Error updating category:', error);
      if (error.code === '23505') {
        toast.error('Категория с таким названием уже существует');
      } else {
        toast.error('Не удалось обновить категорию');
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию? Товары в этой категории останутся без категории.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== id));
      if (selectedCategoryId === id && onCategorySelect) {
        onCategorySelect(null);
      }
      toast.success('Категория удалена');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Не удалось удалить категорию');
    }
  };

  const startEdit = (category: ProductCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showSelector) {
    return (
      <div className="space-y-2">
        <Label>Категория</Label>
        <select
          value={selectedCategoryId || ''}
          onChange={(e) => onCategorySelect?.(e.target.value || null)}
          className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
        >
          <option value="">Без категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-500" />
            Управление категориями
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            size="sm"
            className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="h-4 w-4" />
            Добавить
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Форма добавления новой категории */}
        {isAdding && (
          <Card className="border-dashed border-blue-200 bg-blue-50/50">
            <CardContent className="p-4 space-y-3">
              <div>
                <Label htmlFor="new-category-name">Название категории</Label>
                <Input
                  id="new-category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Введите название категории"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new-category-description">Описание (необязательно)</Label>
                <Input
                  id="new-category-description"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Введите описание категории"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddCategory} size="sm" className="gap-2 bg-green-500 hover:bg-green-600 text-white">
                  <Check className="h-4 w-4" />
                  Сохранить
                </Button>
                <Button 
                  onClick={() => {
                    setIsAdding(false);
                    setNewCategoryName('');
                    setNewCategoryDescription('');
                  }} 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Список категорий */}
        <div className="space-y-2">
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-muted-foreground">Категории не найдены</p>
              <p className="text-sm text-muted-foreground mt-1">Создайте первую категорию для организации товаров</p>
            </div>
          ) : (
            categories.map((category) => (
              <Card key={category.id} className="border hover:border-blue-200 transition-colors">
                <CardContent className="p-4">
                  {editingId === category.id ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Название категории</Label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Описание</Label>
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleEditCategory(category.id)} 
                          size="sm"
                          className="gap-2 bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Check className="h-4 w-4" />
                          Сохранить
                        </Button>
                        <Button onClick={cancelEdit} variant="outline" size="sm" className="gap-2">
                          <X className="h-4 w-4" />
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-blue-700">{category.name}</h3>
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-600">
                            ID: {category.id.slice(0, 8)}
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Создана: {new Date(category.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button
                          onClick={() => startEdit(category)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteCategory(category.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}