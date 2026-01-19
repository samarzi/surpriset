import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class MobileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: error.stack || null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Mobile error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Что-то пошло не так
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Произошла ошибка при загрузке страницы. Попробуйте обновить приложение или проверьте подключение к интернету.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full h-12 text-base font-semibold"
              >
                🔄 Попробовать снова
              </Button>
              
              <Button
                variant="outline"
                onClick={this.handleReload}
                className="w-full h-12 text-base font-semibold"
              >
                🔄 Перезагрузить страницу
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  Детали ошибки (для разработчиков)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto max-h-32">
                  {this.state.error.message}
                  {this.state.errorInfo && `\n\n${this.state.errorInfo}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useMobileErrorHandler() {
  const handleError = (error: Error, errorInfo?: string) => {
    logger.error('Mobile error handler', {
      error: error.message,
      stack: error.stack,
      info: errorInfo,
    });
  };

  return { handleError };
}