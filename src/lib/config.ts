/**
 * Конфигурация приложения
 */

// Типы для конфигурации
interface AppConfig {
  app: {
    name: string
    version: string
    description: string
    url: string
  }
  api: {
    baseUrl: string
    timeout: number
    retries: number
  }
  cache: {
    defaultTTL: number
    maxSize: number
  }
  ui: {
    theme: {
      defaultTheme: 'light' | 'dark' | 'system'
      storageKey: string
    }
    animations: {
      enabled: boolean
      duration: number
    }
    pagination: {
      defaultPageSize: number
      maxPageSize: number
    }
  }
  features: {
    enableAnalytics: boolean
    enablePWA: boolean
    enableOfflineMode: boolean
    enableNotifications: boolean
  }
  supabase: {
    url: string
    anonKey: string
  }
  telegram: {
    botToken?: string
    webAppUrl?: string
  }
  sentry: {
    dsn?: string
    environment: string
  }
}

// Получение переменных окружения с валидацией
function getEnvVar(name: string, defaultValue?: string): string {
  const value = import.meta.env[name] || defaultValue
  
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  
  return value
}

function getOptionalEnvVar(name: string, defaultValue?: string): string | undefined {
  return import.meta.env[name] || defaultValue
}

function getBooleanEnvVar(name: string, defaultValue: boolean = false): boolean {
  const value = import.meta.env[name]
  
  if (value === undefined) {
    return defaultValue
  }
  
  return value === 'true' || value === '1'
}

function getNumberEnvVar(name: string, defaultValue: number): number {
  const value = import.meta.env[name]
  
  if (value === undefined) {
    return defaultValue
  }
  
  const parsed = parseInt(value, 10)
  
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got: ${value}`)
  }
  
  return parsed
}

// Основная конфигурация
export const config: AppConfig = {
  app: {
    name: 'SurpriSet',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    description: 'Современный интернет-магазин подарков',
    url: getOptionalEnvVar('VITE_APP_URL', 'https://surpriset.ru') || 'https://surpriset.ru'
  },

  api: {
    baseUrl: getOptionalEnvVar('VITE_API_BASE_URL', '/api') || '/api',
    timeout: getNumberEnvVar('VITE_API_TIMEOUT', 10000),
    retries: getNumberEnvVar('VITE_API_RETRIES', 3)
  },

  cache: {
    defaultTTL: getNumberEnvVar('VITE_CACHE_TTL', 5 * 60 * 1000), // 5 минут
    maxSize: getNumberEnvVar('VITE_CACHE_MAX_SIZE', 100)
  },

  ui: {
    theme: {
      defaultTheme: (getOptionalEnvVar('VITE_DEFAULT_THEME', 'system') as 'light' | 'dark' | 'system') || 'system',
      storageKey: 'surpriset-ui-theme'
    },
    animations: {
      enabled: getBooleanEnvVar('VITE_ANIMATIONS_ENABLED', true),
      duration: getNumberEnvVar('VITE_ANIMATION_DURATION', 300)
    },
    pagination: {
      defaultPageSize: getNumberEnvVar('VITE_DEFAULT_PAGE_SIZE', 20),
      maxPageSize: getNumberEnvVar('VITE_MAX_PAGE_SIZE', 100)
    }
  },

  features: {
    enableAnalytics: getBooleanEnvVar('VITE_ENABLE_ANALYTICS', false),
    enablePWA: getBooleanEnvVar('VITE_ENABLE_PWA', false),
    enableOfflineMode: getBooleanEnvVar('VITE_ENABLE_OFFLINE', false),
    enableNotifications: getBooleanEnvVar('VITE_ENABLE_NOTIFICATIONS', true)
  },

  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY')
  },

  telegram: {
    botToken: getOptionalEnvVar('VITE_TELEGRAM_BOT_TOKEN'),
    webAppUrl: getOptionalEnvVar('VITE_TELEGRAM_WEB_APP_URL')
  },

  sentry: {
    dsn: getOptionalEnvVar('VITE_SENTRY_DSN'),
    environment: getOptionalEnvVar('VITE_SENTRY_ENVIRONMENT', import.meta.env.MODE) || import.meta.env.MODE
  }
}

// Константы приложения
export const constants = {
  // Лимиты
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGES_PER_PRODUCT: 10,
  MAX_CART_ITEMS: 100,
  MAX_BUNDLE_ITEMS: 20,
  MIN_BUNDLE_ITEMS: 5,

  // Форматы файлов
  ALLOWED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_FORMATS: ['application/pdf', 'text/plain'],

  // Статусы
  PRODUCT_STATUSES: ['in_stock', 'coming_soon', 'out_of_stock'] as const,
  ORDER_STATUSES: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const,
  PRODUCT_TYPES: ['product', 'bundle'] as const,

  // Валюта
  CURRENCY: 'RUB',
  CURRENCY_SYMBOL: '₽',

  // Локализация
  LOCALE: 'ru-RU',
  TIMEZONE: 'Europe/Moscow',

  // Социальные сети
  SOCIAL_LINKS: {
    telegram: 'https://t.me/surpriset_support',
    instagram: 'https://instagram.com/surpriset',
    vk: 'https://vk.com/surpriset'
  },

  // Контакты
  CONTACT_INFO: {
    email: 'hello@surpriset.ru',
    phone: '+7 (999) 123-45-67',
    address: 'Москва, Россия'
  },

  // SEO
  SEO: {
    defaultTitle: 'SurpriSet - Интернет-магазин подарков',
    defaultDescription: 'Современный интернет-магазин подарков с возможностью создания индивидуальных наборов',
    defaultKeywords: 'подарки, наборы, интернет-магазин, доставка'
  }
}

// Утилиты для работы с конфигурацией
export const configUtils = {
  /**
   * Проверка, включена ли функция
   */
  isFeatureEnabled(feature: keyof typeof config.features): boolean {
    return config.features[feature]
  },

  /**
   * Получение URL API
   */
  getApiUrl(endpoint: string): string {
    return `${config.api.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
  },

  /**
   * Проверка, является ли среда продакшеном
   */
  isProduction(): boolean {
    return import.meta.env.PROD
  },

  /**
   * Проверка, является ли среда разработкой
   */
  isDevelopment(): boolean {
    return import.meta.env.DEV
  },

  /**
   * Получение версии приложения
   */
  getVersion(): string {
    return config.app.version
  },

  /**
   * Получение полного URL приложения
   */
  getAppUrl(path: string = ''): string {
    return `${config.app.url}${path.startsWith('/') ? '' : '/'}${path}`
  },

  /**
   * Проверка валидности конфигурации
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Проверяем обязательные поля
    if (!config.supabase.url) {
      errors.push('VITE_SUPABASE_URL is required')
    }

    if (!config.supabase.anonKey) {
      errors.push('VITE_SUPABASE_ANON_KEY is required')
    }

    // Проверяем валидность URL
    try {
      new URL(config.supabase.url)
    } catch {
      errors.push('VITE_SUPABASE_URL must be a valid URL')
    }

    // Проверяем числовые значения
    if (config.api.timeout <= 0) {
      errors.push('API timeout must be greater than 0')
    }

    if (config.cache.defaultTTL <= 0) {
      errors.push('Cache TTL must be greater than 0')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Валидируем конфигурацию при загрузке
const validation = configUtils.validateConfig()
if (!validation.isValid) {
  console.error('Configuration validation failed:', validation.errors)
  
  if (configUtils.isProduction()) {
    throw new Error('Invalid configuration in production environment')
  }
}

// Экспортируем для удобства
export default config