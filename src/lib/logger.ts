/**
 * Система логирования для приложения
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  data?: any
  source?: string
  userId?: string
  sessionId?: string
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private currentLevel = LogLevel.INFO
  private sessionId = this.generateSessionId()

  constructor() {
    // В продакшене устанавливаем более высокий уровень логирования
    if (import.meta.env.PROD) {
      this.currentLevel = LogLevel.WARN
    }
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel
  }

  private addLog(level: LogLevel, message: string, data?: any, source?: string): void {
    if (!this.shouldLog(level)) return

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      source,
      sessionId: this.sessionId
    }

    // Добавляем в массив логов
    this.logs.push(logEntry)

    // Ограничиваем количество логов в памяти
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Выводим в консоль
    this.logToConsole(logEntry)

    // В продакшене можно отправлять критические ошибки на сервер
    if (import.meta.env.PROD && level === LogLevel.ERROR) {
      this.sendToServer(logEntry)
    }
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString()
    const levelName = LogLevel[entry.level]
    const prefix = `[${timestamp}] [${levelName}]${entry.source ? ` [${entry.source}]` : ''}`

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data)
        break
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data)
        break
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data)
        break
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.data)
        break
    }
  }

  private async sendToServer(_entry: LogEntry): Promise<void> {
    try {
      // Здесь можно отправлять логи на сервер мониторинга (например, Sentry)
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // })
    } catch (error) {
      console.error('Failed to send log to server:', error)
    }
  }

  /**
   * Логирование отладочной информации
   */
  debug(message: string, data?: any, source?: string): void {
    this.addLog(LogLevel.DEBUG, message, data, source)
  }

  /**
   * Логирование информационных сообщений
   */
  info(message: string, data?: any, source?: string): void {
    this.addLog(LogLevel.INFO, message, data, source)
  }

  /**
   * Логирование предупреждений
   */
  warn(message: string, data?: any, source?: string): void {
    this.addLog(LogLevel.WARN, message, data, source)
  }

  /**
   * Логирование ошибок
   */
  error(message: string, data?: any, source?: string): void {
    this.addLog(LogLevel.ERROR, message, data, source)
  }

  /**
   * Установка уровня логирования
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level
  }

  /**
   * Получение всех логов
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * Получение логов по уровню
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  /**
   * Очистка логов
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Экспорт логов в JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Логирование производительности
   */
  time(label: string): void {
    console.time(label)
  }

  timeEnd(label: string): void {
    console.timeEnd(label)
  }

  /**
   * Группировка логов
   */
  group(label: string): void {
    console.group(label)
  }

  groupEnd(): void {
    console.groupEnd()
  }
}

// Создаем глобальный экземпляр логгера
export const logger = new Logger()

/**
 * Декоратор для логирования вызовов методов
 */
export function logMethod(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value

  descriptor.value = function (...args: any[]) {
    const className = target.constructor.name
    const methodName = propertyName
    
    logger.debug(`Calling ${className}.${methodName}`, { args }, className)
    
    try {
      const result = method.apply(this, args)
      
      if (result instanceof Promise) {
        return result
          .then((res) => {
            logger.debug(`${className}.${methodName} completed successfully`, { result: res }, className)
            return res
          })
          .catch((error) => {
            logger.error(`${className}.${methodName} failed`, { error, args }, className)
            throw error
          })
      } else {
        logger.debug(`${className}.${methodName} completed successfully`, { result }, className)
        return result
      }
    } catch (error) {
      logger.error(`${className}.${methodName} failed`, { error, args }, className)
      throw error
    }
  }

  return descriptor
}

/**
 * Утилиты для логирования
 */
export const logUtils = {
  /**
   * Логирование API запросов
   */
  logApiRequest(method: string, url: string, data?: any): void {
    logger.info(`API Request: ${method} ${url}`, { data }, 'API')
  },

  /**
   * Логирование API ответов
   */
  logApiResponse(method: string, url: string, status: number, data?: any): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO
    const message = `API Response: ${method} ${url} - ${status}`
    
    if (level === LogLevel.ERROR) {
      logger.error(message, { status, data }, 'API')
    } else {
      logger.info(message, { status, data }, 'API')
    }
  },

  /**
   * Логирование пользовательских действий
   */
  logUserAction(action: string, data?: any): void {
    logger.info(`User Action: ${action}`, data, 'USER')
  },

  /**
   * Логирование ошибок компонентов
   */
  logComponentError(componentName: string, error: Error, props?: any): void {
    logger.error(`Component Error: ${componentName}`, {
      error: {
        message: error.message,
        stack: error.stack
      },
      props
    }, 'COMPONENT')
  },

  /**
   * Логирование навигации
   */
  logNavigation(from: string, to: string): void {
    logger.info(`Navigation: ${from} -> ${to}`, null, 'ROUTER')
  },

  /**
   * Логирование производительности
   */
  logPerformance(metric: string, value: number, unit: string = 'ms'): void {
    logger.info(`Performance: ${metric}`, { value, unit }, 'PERFORMANCE')
  }
}

// Глобальная обработка необработанных ошибок
window.addEventListener('error', (event) => {
  logger.error('Unhandled Error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  }, 'GLOBAL')
})

// Глобальная обработка необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection', {
    reason: event.reason
  }, 'GLOBAL')
})