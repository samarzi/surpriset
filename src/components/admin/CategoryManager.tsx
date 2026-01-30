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
    <div className="w-full">
      <div className="w-full md:pt-24">
      <Card className="border-0 shadow-md w-full">
        <CardHeader className="border-b border-gray-200 dark:border-gray-800 p-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Управление категориями</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">Организация товаров</p>
            </div>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-black shadow-md h-8 text-xs px-3"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Добавить</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="!p-4 pt-4 space-y-2">
        {/* Форма добавления новой категории */}
        {isAdding && (
          <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10">
            <CardContent className="!p-4 space-y-2">
              <div>
                <Label htmlFor="new-category-name" className="text-xs font-medium">Название категории</Label>
                <Input
                  id="new-category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Введите название"
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="new-category-description" className="text-xs font-medium">Описание (необязательно)</Label>
                <Input
                  id="new-category-description"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Введите описание"
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div className="flex gap-1.5 pt-0.5">
                <Button 
                  onClick={handleAddCategory} 
                  size="sm" 
                  className="gap-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black h-8 text-xs px-3"
                >
                  <Check className="h-3.5 w-3.5" />
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
                  className="gap-1.5 h-8 text-xs px-3"
                >
                  <X className="h-3.5 w-3.5" />
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Список категорий */}
        <div className="space-y-1.5 mt-2">
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">Категории не найдены</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">Создайте первую категорию</p>
            </div>
          ) : (
            categories.map((category) => (
              <Card key={category.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
                <CardContent className="!p-4 flex items-center">
                  {editingId === category.id ? (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs font-medium">Название категории</Label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Описание</Label>
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <Button 
                          onClick={() => handleEditCategory(category.id)} 
                          size="sm"
                          className="gap-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black h-8 text-xs px-3"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Сохранить
                        </Button>
                        <Button onClick={cancelEdit} variant="outline" size="sm" className="gap-1.5 h-8 text-xs px-3">
                          <X className="h-3.5 w-3.5" />
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                            <FolderOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h3 className="font-semibold text-xs text-gray-900 dark:text-white truncate">{category.name}</h3>
                          <Badge variant="secondary" className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 h-4 px-1.5">
                            {category.id.slice(0, 8)}
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="text-[10px] text-gray-600 dark:text-gray-400 ml-6 truncate">{category.description}</p>
                        )}
                        <p className="text-[9px] text-gray-500 dark:text-gray-500 mt-0.5 ml-6">
                          {new Date(category.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <Button
                          onClick={() => startEdit(category)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteCategory(category.id)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
      </div>
    </div>
  );
}