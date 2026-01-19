import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Что-то пошло не так
              </h1>
              <p className="text-muted-foreground">
                Произошла неожиданная ошибка. Попробуйте обновить страницу.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-muted p-4 rounded-lg text-sm font-mono">
                <p className="text-destructive font-bold mb-2">Ошибка разработки:</p>
                <p className="text-muted-foreground">{this.state.error.message}</p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleRetry} variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Попробовать снова
              </Button>
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline"
              >
                На главную
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook для использования в функциональных компонентах
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by hook:', error, errorInfo)
    // Здесь можно добавить отправку ошибки в сервис мониторинга
  }
}