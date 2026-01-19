import { supabase } from './supabase'
import { telegramSupabase } from './telegramSupabase'
import { logger } from './logger'
import type { Database } from './supabase'

const ARCHIVE_TAG = '__archive__'
const ARCHIVE_TAG_FILTER = `{${ARCHIVE_TAG}}`

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

type Order = Database['public']['Tables']['orders']['Row']
type OrderInsert = Database['public']['Tables']['orders']['Insert']

type Banner = Database['public']['Tables']['banners']['Row']
type BannerInsert = Database['public']['Tables']['banners']['Insert']
type BannerUpdate = Database['public']['Tables']['banners']['Update']

type ProductLike = Database['public']['Tables']['product_likes']['Row']
type Admin = Database['public']['Tables']['admins']['Row']
type SiteSettingsRow = Database['public']['Tables']['site_settings']['Row']
type SiteSettingsInsert = Database['public']['Tables']['site_settings']['Insert']

// Site settings operations
export const settingsService = {
  async get(): Promise<SiteSettingsRow | null> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data as SiteSettingsRow | null
  },

  async upsert(payload: Omit<SiteSettingsInsert, 'id'> & { id?: string }): Promise<SiteSettingsRow> {
    const { data, error } = await supabase
      .from('site_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error
    return data as SiteSettingsRow
  }
}

// Product operations
export const productService = {
  // Get all products with optional filtering
  async getAll(filters?: {
    search?: string
    tags?: string[]
    status?: string
    type?: string
    featured?: boolean
  }) {
    // Для каталога без фильтров или с базовыми фильтрами используем мобильно-оптимизированный метод
    const isBasicCatalogRequest = !filters || (
      (!filters.search || filters.search.trim() === '') && 
      !filters.status && 
      !filters.type && 
      filters.featured === undefined &&
      (!filters.tags || filters.tags.length <= 1)
    );

    if (isBasicCatalogRequest) {
      try {
        logger.info('Using mobile-optimized product loading for catalog', { 
          filters, 
          isBasicCatalogRequest,
          isMobile: typeof window !== 'undefined' && (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()) || !!(window as any).Telegram?.WebApp)
        });
        const products = await telegramSupabase.getProducts();
        
        // Применяем фильтры если они есть
        if (filters?.tags && filters.tags.length > 0) {
          const filtered = products.filter(product => 
            filters.tags!.some(tag => product.tags.includes(tag))
          );
          logger.info('Applied tag filters', { originalCount: products.length, filteredCount: filtered.length, tags: filters.tags });
          return filtered;
        }
        
        logger.info('Returning all mobile-optimized products', { count: products.length });
        return products;
      } catch (error) {
        logger.warn('Mobile-optimized loading failed, falling back to standard method', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        // Fallback to standard method
      }
    }

    // Стандартный метод для сложных фильтров или как fallback
    logger.info('Using standard Supabase method', { filters, isBasicCatalogRequest });
    let query = supabase.from('products').select('*')

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.featured !== undefined) {
      query = query.eq('is_featured', filters.featured)
    }

    // Для публичных страниц (когда переданы фильтры) скрываем товары,
    // помеченные специальным тегом архива '__archive__'.
    // Админ-панель вызывает getAll() без filters и видит все товары.
    if (filters) {
      query = query.not('tags', 'cs', ARCHIVE_TAG_FILTER)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      logger.error('Standard Supabase method failed', { error: error.message, filters });
      throw error;
    }
    
    logger.info('Standard Supabase method completed', { count: data?.length || 0, filters });
    return data as Product[]
  },

  // Get product by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Product
  },

  // Get product by SKU
  async getBySku(sku: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('sku', sku)
      .single()

    if (error) throw error
    return data as Product
  },

  // Create new product
  async create(product: ProductInsert) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) throw error
    return data as Product
  },

  // Update product
  async update(id: string, updates: ProductUpdate) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Product
  },

  // Delete product
  async delete(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Search products
  async search(query: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .eq('status', 'in_stock')

    if (error) throw error
    return data as Product[]
  }
}

// Order operations
export const orderService = {
  // Get all orders
  async getAll(filters?: {
    status?: string
    type?: string
    customer_email?: string
    date_from?: string
    date_to?: string
  }) {
    let query = supabase.from('orders').select('*')

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.customer_email) {
      query = query.eq('customer_email', filters.customer_email)
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data as Order[]
  },

  // Get order by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Order
  },

  // Create new order
  async create(order: OrderInsert) {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single()

    if (error) throw error
    return data as Order
  },

  // Update order status
  async updateStatus(id: string, status: Order['status']) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Order
  },

  // Get orders by customer email
  async getByCustomerEmail(email: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Order[]
  }
}

// Banner operations
export const bannerService = {
  // Get all banners
  async getAll(activeOnly = false) {
    let query = supabase.from('banners').select('*')

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query.order('order', { ascending: true })

    if (error) throw error
    return data as Banner[]
  },

  // Get banner by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Banner
  },

  // Create new banner
  async create(banner: BannerInsert) {
    const { data, error } = await supabase
      .from('banners')
      .insert(banner)
      .select()
      .single()

    if (error) throw error
    return data as Banner
  },

  // Update banner
  async update(id: string, updates: BannerUpdate) {
    const { data, error } = await supabase
      .from('banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Banner
  },

  // Delete banner
  async delete(id: string) {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Update banner order
  async updateOrder(id: string, order: number) {
    const { data, error } = await supabase
      .from('banners')
      .update({ order })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Banner
  },

  // Toggle banner active status
  async toggleActive(id: string) {
    const banner = await this.getById(id)
    const { data, error } = await supabase
      .from('banners')
      .update({ is_active: !banner.is_active })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Banner
  }
}

// Admin operations
export const adminService = {
  async getAll(): Promise<Admin[]> {
    const { data, error } = await supabase.from('admins').select('*').order('created_at', { ascending: true })
    if (error) throw error
    return data as Admin[]
  },
  async isAdminByUsername(username: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('username', username)
      .maybeSingle()
    if (error) throw error
    return !!data
  },
  async isAdminByTelegram(telegramId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('telegram_id', telegramId)
      .maybeSingle()
    if (error) throw error
    return !!data
  },
  async addAdmin(username: string, telegramId?: number | null, firstName?: string | null): Promise<Admin> {
    const { data, error } = await supabase
      .from('admins')
      .upsert({ username, telegram_id: telegramId ?? null, first_name: firstName ?? null })
      .select()
      .single()
    if (error) throw error
    return data as Admin
  },
  async removeAdmin(username: string): Promise<void> {
    const { error } = await supabase.from('admins').delete().eq('username', username)
    if (error) throw error
  },
}

// Analytics operations
export const analyticsService = {
  // Get sales metrics
  async getSalesMetrics(dateFrom?: string, dateTo?: string) {
    let query = supabase.from('orders').select('total, created_at, status')

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data, error } = await query

    if (error) throw error

    const totalSales = data.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = data.length
    const completedOrders = data.filter(order => order.status === 'delivered').length
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    return {
      totalSales,
      totalOrders,
      completedOrders,
      averageOrderValue,
      conversionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
    }
  },

  // Get popular products
  async getPopularProducts(limit = 10) {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('items')

    if (error) throw error

    // Count product occurrences in orders
    const productCounts: Record<string, { count: number; name: string; total_revenue: number }> = {}

    orders.forEach(order => {
      order.items.forEach((item: { product_id: string; name: string; price: number; quantity: number }) => {
        if (!productCounts[item.product_id]) {
          productCounts[item.product_id] = {
            count: 0,
            name: item.name,
            total_revenue: 0
          }
        }
        productCounts[item.product_id].count += item.quantity
        productCounts[item.product_id].total_revenue += item.price * item.quantity
      })
    })

    // Sort by count and return top products
    return Object.entries(productCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([productId, data]) => ({
        product_id: productId,
        ...data
      }))
  }
}

// Utility functions
export const dbUtils = {
  // Test database connection
  async testConnection() {
    try {
      const { error } = await supabase.from('products').select('count').limit(1)
      if (error) throw error
      return true
    } catch (error) {
      console.error('Database connection failed:', error)
      return false
    }
  },

  // Run migration (for development)
  async runMigration(sql: string) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql })
      if (error) throw error
      return true
    } catch (error) {
      console.error('Migration failed:', error)
      return false
    }
  }
}

// Likes operations
export const likesService = {
  // Add like
  async addLike(productId: string, userSession: string) {
    const { data, error } = await supabase
      .from('product_likes')
      .insert({ product_id: productId, user_session: userSession })
      .select()
      .single()

    if (error) throw error

    // Update likes count in products table
    await this.updateProductLikesCount(productId)
    
    return data as ProductLike
  },

  // Remove like
  async removeLike(productId: string, userSession: string) {
    const { error } = await supabase
      .from('product_likes')
      .delete()
      .eq('product_id', productId)
      .eq('user_session', userSession)

    if (error) throw error

    // Update likes count in products table
    await this.updateProductLikesCount(productId)
  },

  // Update product likes count
  async updateProductLikesCount(productId: string) {
    const { count, error: countError } = await supabase
      .from('product_likes')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)

    if (countError) throw countError

    const { error: updateError } = await supabase
      .from('products')
      .update({ likes_count: count || 0 })
      .eq('id', productId)

    if (updateError) throw updateError
  },

  // Check if user liked product
  async isLiked(productId: string, userSession: string) {
    const { data, error } = await supabase
      .from('product_likes')
      .select('id')
      .eq('product_id', productId)
      .eq('user_session', userSession)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  },

  // Get user's liked products
  async getUserLikes(userSession: string) {
    const { data, error } = await supabase
      .from('product_likes')
      .select('product_id')
      .eq('user_session', userSession)

    if (error) throw error
    return data.map(like => like.product_id)
  },

  // Get product likes count
  async getProductLikesCount(productId: string) {
    const { count, error } = await supabase
      .from('product_likes')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)

    if (error) throw error
    return count || 0
  },

  // Get top liked products
  async getTopLikedProducts(limit = 10) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .gt('likes_count', 0)
      .order('likes_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as Product[]
  }
}