import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

interface ErrorBoundaryProps {
  children: ReactNode;
  errorFallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component for catching and handling errors in lazy loaded components
 * Provides a user-friendly error UI with retry functionality
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
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
      const { error } = this.state;

      // Use custom error fallback if provided
      if (this.props.errorFallback && error) {
        return <>{this.props.errorFallback(error, this.handleRetry)}</>;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4 md:p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                {/* @ts-ignore */}
                <FiAlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-lg md:text-xl">មានកំហុសកើតឡើង</CardTitle>
              </div>
              <CardDescription className="text-sm md:text-base">
                មានកំហុសក្នុងការផ្ទុកកម្មវិធី
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && error && (
                <div className="p-3 bg-destructive/10 rounded-md">
                  <p className="text-xs font-mono text-destructive break-all">
                    {error.message}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-muted-foreground">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-32 text-muted-foreground">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  {/* @ts-ignore */}
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  សាកល្បងម្តងទៀត
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="outline"
                >
                  ផ្ទុកទំព័រឡើងវិញ
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                ប្រសិនបើបញ្ហានៅតែមាន សូមទាក់ទងជាមួយអ្នកគ្រប់គ្រង
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

