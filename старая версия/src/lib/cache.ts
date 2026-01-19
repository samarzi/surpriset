/**
 * Улучшенная система кэширования с LRU алгоритмом
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

class LRUCache {
  private cache = new Map<string, CacheItem<unknown>>()
  private accessOrder = new Map<string, number>() // Для отслеживания порядка доступа
  private maxSize = 100 // Максимальное количество элементов в кэше
  private accessCounter = 0

  /**
   * Получить данные из кэша
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // Проверяем, не истек ли TTL
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key)
      return null
    }

    // Обновляем статистику доступа
    item.accessCount++
    item.lastAccessed = Date.now()
    this.accessOrder.set(key, ++this.accessCounter)

    return item.data as T
  }

  /**
   * Сохранить данные в кэш
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Если кэш переполнен, удаляем наименее используемые элементы
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
      accessCount: 1,
      lastAccessed: now
    })
    
    this.accessOrder.set(key, ++this.accessCounter)
  }

  /**
   * Удалить наименее используемый элемент (LRU)
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestAccess = Infinity

    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  /**
   * Удалить элемент из кэша
   */
  delete(key: string): boolean {
    this.accessOrder.delete(key)
    return this.cache.delete(key)
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder.clear()
    this.accessCounter = 0
  }

  /**
   * Получить размер кэша
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Проверить, есть ли ключ в кэше
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    
    if (!item) {
      return false
    }

    // Проверяем TTL
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * Получить все ключи кэша
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Очистить истекшие элементы
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.delete(key))
  }

  /**
   * Получить статистику кэша
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    mostAccessed: Array<{ key: string; accessCount: number }>
  } {
    const items = Array.from(this.cache.entries())
    const totalAccess = items.reduce((sum, [, item]) => sum + item.accessCount, 0)
    const mostAccessed = items
      .map(([key, item]) => ({ key, accessCount: item.accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 5)

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalAccess > 0 ? items.length / totalAccess : 0,
      mostAccessed
    }
  }

  /**
   * Установить максимальный размер кэша
   */
  setMaxSize(size: number): void {
    this.maxSize = size
    
    // Если текущий размер больше нового максимума, удаляем лишние элементы
    while (this.cache.size > this.maxSize) {
      this.evictLRU()
    }
  }
}

// Создаем глобальный экземпляр кэша
export const cache = new LRUCache()

// Автоматическая очистка истекших элементов каждые 10 минут
setInterval(() => {
  cache.cleanup()
}, 10 * 60 * 1000)

/**
 * Хук для кэширования результатов функций
 */
export function useCachedFunction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  keyGenerator: (...args: TArgs) => string,
  ttl: number = 5 * 60 * 1000
) {
  return (...args: TArgs): TResult => {
    const key = keyGenerator(...args)
    
    // Проверяем кэш
    const cached = cache.get<TResult>(key)
    if (cached !== null) {
      return cached
    }

    // Выполняем функцию и кэшируем результат
    const result = fn(...args)
    cache.set(key, result, ttl)
    
    return result
  }
}

/**
 * Утилита для кэширования API запросов
 */
export async function cachedApiCall<T>(
  key: string,
  apiCall: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  // Проверяем кэш
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Выполняем API запрос
  const result = await apiCall()
  
  // Кэшируем результат
  cache.set(key, result, ttl)
  
  return result
}

/**
 * Генераторы ключей для различных типов данных
 */
export const cacheKeys = {
  products: (filters?: Record<string, unknown>) => 
    `products:${JSON.stringify(filters || {})}`,
  
  product: (id: string) => 
    `product:${id}`,
  
  banners: (activeOnly: boolean = false) => 
    `banners:${activeOnly}`,
  
  orders: (filters?: Record<string, unknown>) => 
    `orders:${JSON.stringify(filters || {})}`,
  
  user: (id: string) => 
    `user:${id}`,
  
  search: (query: string, filters?: Record<string, unknown>) => 
    `search:${query}:${JSON.stringify(filters || {})}`
}