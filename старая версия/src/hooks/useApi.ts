import { useState, useCallback, useRef, useEffect } from 'react'
import { logger, logUtils } from '@/lib/logger'
import { cache, cachedApiCall } from '@/lib/cache'
import { useErrorHandler } from './useErrorHandler'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface ApiOptions {
  cache?: boolean
  cacheTTL?: number
  retries?: number
  retryDelay?: number
  timeout?: number
}

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
  refresh: () => Promise<T | null>
}

/**
 * Универсальный хук для работы с API
 */
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: ApiOptions = {}
): UseApiResult<T> {
  const {
    cache: useCache = false,
    cacheTTL = 5 * 60 * 1000, // 5 минут
    retries = 0,
    retryDelay = 1000,
    timeout = 10000
  } = options

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const { handleError } = useErrorHandler()
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastArgsRef = useRef<any[]>([])

  // Функция для выполнения API запроса с повторными попытками
  const executeWithRetries = useCallback(async (
    fn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> => {
    try {
      return await fn()
    } catch (error: any) {
      if (attempt < retries) {
        // Экспоненциальный backoff с jitter
        const baseDelay = retryDelay * Math.pow(2, attempt)
        const jitter = Math.random() * 0.1 * baseDelay // 10% jitter
        const delay = baseDelay + jitter
        
        // Проверяем тип ошибки - некоторые ошибки не стоит повторять
        const shouldRetry = shouldRetryError(error)
        
        if (shouldRetry) {
          logger.warn(`API call failed, retrying (${attempt + 1}/${retries}) in ${Math.round(delay)}ms`, { 
            error: error.message,
            attempt: attempt + 1,
            delay: Math.round(delay)
          })
          
          await new Promise(resolve => setTimeout(resolve, delay))
          return executeWithRetries(fn, attempt + 1)
        }
      }
      throw error
    }
  }, [retries, retryDelay])

  // Определяем, стоит ли повторять запрос при данной ошибке
  const shouldRetryError = (error: any): boolean => {
    // Не повторяем для клиентских ошибок (4xx)
    if (error.status >= 400 && error.status < 500) {
      return false
    }
    
    // Не повторяем для ошибок отмены запроса
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      return false
    }
    
    // Повторяем для сетевых ошибок и серверных ошибок (5xx)
    return true
  }

  // Основная функция выполнения API запроса
  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    // Отменяем предыдущий запрос, если он выполняется
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Создаем новый AbortController
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    // Сохраняем аргументы для возможности повторного вызова
    lastArgsRef.current = args

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))

    try {
      let result: T

      if (useCache) {
        // Генерируем ключ кэша на основе имени функции и аргументов
        const cacheKey = `api:${apiFunction.name}:${JSON.stringify(args)}`
        
        result = await cachedApiCall(
          cacheKey,
          () => executeWithRetries(() => {
            // Создаем промис с таймаутом
            return Promise.race([
              apiFunction(...args),
              new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), timeout)
              })
            ])
          }),
          cacheTTL
        )
      } else {
        result = await executeWithRetries(() => {
          return Promise.race([
            apiFunction(...args),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Request timeout')), timeout)
            })
          ])
        })
      }

      // Проверяем, не был ли запрос отменен
      if (signal.aborted) {
        return null
      }

      setState({
        data: result,
        loading: false,
        error: null
      })

      logUtils.logApiResponse('SUCCESS', apiFunction.name, 200, result)
      return result

    } catch (error: any) {
      // Игнорируем ошибки отмененных запросов
      if (signal.aborted || error.name === 'AbortError') {
        return null
      }

      const errorMessage = handleError(error, { showToast: false })
      
      setState({
        data: null,
        loading: false,
        error: errorMessage
      })

      logUtils.logApiResponse('ERROR', apiFunction.name, 500, error)
      return null
    }
  }, [apiFunction, useCache, cacheTTL, timeout, executeWithRetries, handleError])

  // Функция для сброса состояния
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  // Функция для повторного выполнения последнего запроса
  const refresh = useCallback(async (): Promise<T | null> => {
    return execute(...lastArgsRef.current)
  }, [execute])

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
    refresh
  }
}

/**
 * Хук для автоматического выполнения API запроса при монтировании
 */
export function useApiAuto<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  args: any[] = [],
  options: ApiOptions & { enabled?: boolean } = {}
): UseApiResult<T> {
  const { enabled = true, ...apiOptions } = options
  const api = useApi(apiFunction, apiOptions)

  useEffect(() => {
    if (enabled) {
      api.execute(...args)
    }
  }, [enabled, ...args])

  return api
}

/**
 * Хук для пагинированных API запросов
 */
export function usePaginatedApi<T = any>(
  apiFunction: (page: number, limit: number, ...args: any[]) => Promise<{ data: T[]; total: number; hasMore: boolean }>,
  limit: number = 20,
  options: ApiOptions = {}
) {
  const [page, setPage] = useState(1)
  const [allData, setAllData] = useState<T[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  const api = useApi(apiFunction, options)

  const loadMore = useCallback(async (...args: any[]) => {
    const result = await api.execute(page, limit, ...args)
    
    if (result) {
      setAllData(prev => page === 1 ? result.data : [...prev, ...result.data])
      setHasMore(result.hasMore)
      setTotal(result.total)
      setPage(prev => prev + 1)
    }

    return result
  }, [api, page, limit])

  const reset = useCallback(() => {
    setPage(1)
    setAllData([])
    setHasMore(true)
    setTotal(0)
    api.reset()
  }, [api])

  const refresh = useCallback(async (...args: any[]) => {
    setPage(1)
    setAllData([])
    setHasMore(true)
    return loadMore(...args)
  }, [loadMore])

  return {
    data: allData,
    loading: api.loading,
    error: api.error,
    hasMore,
    total,
    page: page - 1, // Возвращаем текущую страницу (не следующую)
    loadMore,
    reset,
    refresh
  }
}

/**
 * Хук для мутаций (POST, PUT, DELETE запросы)
 */
export function useMutation<T = any, P = any>(
  mutationFunction: (params: P) => Promise<T>,
  options: {
    onSuccess?: (data: T, params: P) => void
    onError?: (error: string, params: P) => void
    invalidateCache?: string[]
  } = {}
) {
  const { onSuccess, onError, invalidateCache = [] } = options
  const api = useApi(mutationFunction)

  const mutate = useCallback(async (params: P): Promise<T | null> => {
    const result = await api.execute(params)

    if (result) {
      // Инвалидируем кэш
      invalidateCache.forEach(key => {
        cache.delete(key)
      })

      onSuccess?.(result, params)
    } else if (api.error) {
      onError?.(api.error, params)
    }

    return result
  }, [api, onSuccess, onError, invalidateCache])

  return {
    mutate,
    loading: api.loading,
    error: api.error,
    reset: api.reset
  }
}