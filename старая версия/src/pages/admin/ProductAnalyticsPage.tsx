import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Heart, Star, Search, Loader2, TrendingUp } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface ProductAnalytics {
  id: string
  name: string
  price: number
  images: string[]
  likes_count: number
  reviews_count: number
  average_rating: number
  created_at: string
}

type SortBy = 'likes' | 'rating' | 'date'
type Period = 'week' | 'month' | 'half_year' | 'all_time'

export default function ProductAnalyticsPage() {
  const [products, setProducts] = useState<ProductAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('likes')
  const [period, setPeriod] = useState<Period>('all_time')

  useEffect(() => {
    fetchProducts()
  }, [sortBy, period])

  const fetchProducts = async () => {
    try {
      setLoading(true)

      // Calculate date filter based on period
      let dateFilter: string | null = null
      const now = new Date()
      
      switch (period) {
        case 'week':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          break
        case 'month':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          break
        case 'half_year':
          dateFilter = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString()
          break
        default:
          dateFilter = null
      }

      let query = supabase
        .from('products')
        .select('id, name, price, images, likes_count, reviews_count, average_rating, created_at')

      // Apply date filter
      if (dateFilter) {
        query = query.gte('created_at', dateFilter)
      }

      // Apply sorting
      switch (sortBy) {
        case 'likes':
          query = query.order('likes_count', { ascending: false })
          break
        case 'rating':
          query = query.order('average_rating', { ascending: false })
          break
        case 'date':
          query = query.order('created_at', { ascending: false })
          break
      }

      const { data, error } = await query

      if (error) throw error

      setProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalLikes = products.reduce((sum, p) => sum + p.likes_count, 0)
  const totalReviews = products.reduce((sum, p) => sum + p.reviews_count, 0)
  const avgRating = products.length > 0
    ? products.reduce((sum, p) => sum + p.average_rating, 0) / products.length
    : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Аналитика товаров</h1>
          <p className="text-muted-foreground">
            Статистика лайков и отзывов по товарам
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium text-muted-foreground">Всего лайков</p>
            </div>
            <p className="text-2xl font-bold">{totalLikes}</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <p className="text-sm font-medium text-muted-foreground">Всего отзывов</p>
            </div>
            <p className="text-2xl font-bold">{totalReviews}</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Средний рейтинг</p>
            </div>
            <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">За неделю</SelectItem>
              <SelectItem value="month">За месяц</SelectItem>
              <SelectItem value="half_year">За полгода</SelectItem>
              <SelectItem value="all_time">За все время</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="likes">По лайкам</SelectItem>
              <SelectItem value="rating">По рейтингу</SelectItem>
              <SelectItem value="date">По дате</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">
              {searchQuery ? 'Товары не найдены' : 'Нет товаров'}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium text-sm">Товар</th>
                    <th className="text-left p-3 font-medium text-sm">Цена</th>
                    <th className="text-center p-3 font-medium text-sm">
                      <Heart className="h-4 w-4 inline" />
                    </th>
                    <th className="text-center p-3 font-medium text-sm">
                      <Star className="h-4 w-4 inline" />
                    </th>
                    <th className="text-center p-3 font-medium text-sm">Рейтинг</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {product.images[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(product.created_at).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{formatPrice(product.price)}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 text-sm">
                          {product.likes_count}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 text-sm">
                          {product.reviews_count}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium">
                          {product.average_rating > 0 ? product.average_rating.toFixed(1) : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Count */}
        {!loading && filteredProducts.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            Показано товаров: {filteredProducts.length} из {products.length}
          </p>
        )}
      </div>
    </div>
  )
}
