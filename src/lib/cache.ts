/**
 * Простая система кэширования для улучшения производительности
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class Cache {
  private cache = new Map<string, CacheItem<any>>()
  private maxSize = 100 // Максимальное количество элементов в кэше

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
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  /**
   * Сохранить данные в кэш
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Если кэш переполнен, удаляем самые старые элементы
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Удалить элемент из кэша
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    this.cache.clear()
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
      this.cache.delete(key)
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
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Создаем глобальный экземпляр кэша
export const cache = new Cache()

// Автоматическая очистка истекших элементов каждые 5 минут
setInterval(() => {
  cache.cleanup()
}, 5 * 60 * 1000)

/**
 * Хук для кэширования результатов функций
 */
export function useCachedFunction<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = 5 * 60 * 1000
) {
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator(...args)
    
    // Проверяем кэш
    const cached = cache.get<ReturnType<T>>(key)
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
  products: (filters?: Record<string, any>) => 
    `products:${JSON.stringify(filters || {})}`,
  
  product: (id: string) => 
    `product:${id}`,
  
  banners: (activeOnly: boolean = false) => 
    `banners:${activeOnly}`,
  
  orders: (filters?: Record<string, any>) => 
    `orders:${JSON.stringify(filters || {})}`,
  
  user: (id: string) => 
    `user:${id}`,
  
  search: (query: string, filters?: Record<string, any>) => 
    `search:${query}:${JSON.stringify(filters || {})}`
}