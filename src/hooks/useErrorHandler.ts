import { useCallback } from 'react'
import { toast } from 'sonner'

interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  fallbackMessage?: string
}

export function useErrorHandler() {
  const handleError = useCallback((
    error: unknown, 
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = 'Произошла неожиданная ошибка'
    } = options

    let errorMessage = fallbackMessage

    // Обработка различных типов ошибок
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    }

    // Логирование ошибки
    if (logError) {
      console.error('Error handled:', error)
    }

    // Показ уведомления пользователю
    if (showToast) {
      toast.error(errorMessage, {
        duration: 5000,
        action: {
          label: 'Закрыть',
          onClick: () => {}
        }
      })
    }

    return errorMessage
  }, [])

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn()
    } catch (error) {
      handleError(error, options)
      return null
    }
  }, [handleError])

  return {
    handleError,
    handleAsyncError
  }
}