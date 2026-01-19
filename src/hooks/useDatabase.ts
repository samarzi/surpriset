import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { productService, orderService, bannerService } from '../lib/database'
import { eventBus, EVENTS } from '../lib/eventBus'
import type { Database } from '../lib/supabase'

type Product = Database['public']['Tables']['products']['Row']
type Order = Database['public']['Tables']['orders']['Row']
type Banner = Database['public']['Tables']['banners']['Row']

const productsCache = new Map<string, Product[]>()
const bannersCache = new Map<string, Banner[]>()

// Hook for products
export function useProducts(filters?: {
  search?: string
  tags?: string[]
  status?: string
  type?: string
  featured?: boolean
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])
  const normalizedFilters = useMemo(() => {
    if (!filters) return undefined

    const nextFilters = { ...filters }

    if (nextFilters.tags) {
      nextFilters.tags = Array.from(new Set(nextFilters.tags)).sort()
    }

    return nextFilters
  }, [filtersKey])

  const fetchIdRef = useRef(0)

  const fetchProducts = useCallback(
    async ({ skipCache = false }: { skipCache?: boolean } = {}) => {
      const fetchId = ++fetchIdRef.current

      if (!skipCache) {
        const cached = productsCache.get(filtersKey)
        if (cached) {
          setProducts(cached)
          setLoading(false)
        }
      }

      try {
        setLoading((prev) => (skipCache || !productsCache.has(filtersKey) ? true : prev))
        setError(null)
        const data = await productService.getAll(normalizedFilters)

        if (fetchId !== fetchIdRef.current) {
          return
        }

        productsCache.set(filtersKey, data)
        setProducts(data)
      } catch (err) {
        if (fetchId !== fetchIdRef.current) {
          return
        }

        setError(err instanceof Error ? err.message : 'Failed to fetch products')
      } finally {
        if (fetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    },
    [filtersKey, normalizedFilters],
  )

  useEffect(() => {
    void fetchProducts({ skipCache: !productsCache.has(filtersKey) })

    return () => {
      fetchIdRef.current += 1
    }
  }, [fetchProducts, filtersKey])

  // Listen for product refresh events using eventBus
  useEffect(() => {
    const handleProductsRefresh = () => {
      console.log('🔄 Products refresh event received')
      void fetchProducts({ skipCache: true })
    }

    const handleProductUpdate = () => {
      console.log('📦 Product update event received')
      void fetchProducts({ skipCache: true })
    }

    const handleAdminDataChange = () => {
      console.log('👨‍💼 Admin data change event received')
      void fetchProducts({ skipCache: true })
    }

    // Subscribe to events
    eventBus.on(EVENTS.PRODUCTS_REFRESH, handleProductsRefresh)
    eventBus.on(EVENTS.PRODUCT_UPDATED, handleProductUpdate)
    eventBus.on(EVENTS.ADMIN_DATA_CHANGED, handleAdminDataChange)

    // Also listen to DOM events for compatibility
    window.addEventListener('products-refresh', handleProductsRefresh)
    window.addEventListener('product-updated', handleProductUpdate)

    return () => {
      // Cleanup
      eventBus.off(EVENTS.PRODUCTS_REFRESH, handleProductsRefresh)
      eventBus.off(EVENTS.PRODUCT_UPDATED, handleProductUpdate)
      eventBus.off(EVENTS.ADMIN_DATA_CHANGED, handleAdminDataChange)
      window.removeEventListener('products-refresh', handleProductsRefresh)
      window.removeEventListener('product-updated', handleProductUpdate)
    }
  }, [fetchProducts])

  const refetch = useCallback(() => fetchProducts({ skipCache: true }), [fetchProducts])

  return { products, loading, error, refetch }
}

// Hook for single product
export function useProduct(id: string | null) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setProduct(null)
      setLoading(false)
      return
    }

    async function fetchProduct() {
      try {
        setLoading(true)
        setError(null)
        const data = await productService.getById(id!)
        setProduct(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  return { product, loading, error }
}

// Hook for orders
export function useOrders(filters?: {
  status?: string
  type?: string
  customer_email?: string
  date_from?: string
  date_to?: string
}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await orderService.getAll(filters)
      setOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return { orders, loading, error, refetch: fetchOrders }
}

// Hook for banners
export function useBanners(activeOnly = false) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = activeOnly ? 'active' : 'all'
  const fetchIdRef = useRef(0)

  const fetchBanners = useCallback(async () => {
    const fetchId = ++fetchIdRef.current

    const cached = bannersCache.get(cacheKey)
    if (cached) {
      setBanners(cached)
      setLoading(false)
    }

    try {
      setLoading((prev) => (cached ? prev : true))
      setError(null)
      const data = await bannerService.getAll(activeOnly)

      if (fetchId !== fetchIdRef.current) {
        return
      }

      bannersCache.set(cacheKey, data)
      setBanners(data)
    } catch (err) {
      if (fetchId !== fetchIdRef.current) {
        return
      }

      setError(err instanceof Error ? err.message : 'Failed to fetch banners')
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [activeOnly, cacheKey])

  useEffect(() => {
    void fetchBanners()

    return () => {
      fetchIdRef.current += 1
    }
  }, [fetchBanners])

  return { banners, loading, error, refetch: fetchBanners }
}

// Hook for product search
export function useProductSearch(query: string, debounceMs = 300) {
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await productService.search(query)
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [query, debounceMs])

  return { results, loading, error }
}

// Hook for creating orders
export function useCreateOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createOrder = async (orderData: Database['public']['Tables']['orders']['Insert']) => {
    try {
      setLoading(true)
      setError(null)
      const order = await orderService.create(orderData)
      return order
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return { createOrder, loading, error }
}