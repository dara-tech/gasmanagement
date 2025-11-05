import React from 'react';
import { Card, CardContent } from './ui/card';

interface LoadingFallbackProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Loading fallback component for lazy loaded components
 * Provides a consistent loading experience across the application
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = 'កំពុងផ្ទុក...',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 md:p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          {/* Spinner */}
          <div className="relative">
            <div 
              className={`${sizeClasses[size]} border-4 border-primary/20 border-t-primary rounded-full animate-spin`}
            />
          </div>
          
          {/* Loading message */}
          <p className="text-sm md:text-base text-muted-foreground font-medium">
            {message}
          </p>
          
          {/* Loading dots animation */}
          <div className="flex space-x-1">
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Inline loading component for smaller loading states
 */
export const InlineLoading: React.FC<{ message?: string }> = ({ 
  message = 'កំពុងផ្ទុក...' 
}) => {
  return (
    <div className="flex items-center justify-center p-4 space-x-2">
      <div className="h-4 w-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
};

/**
 * Full page loading component
 */
export const FullPageLoading: React.FC<{ message?: string }> = ({ 
  message = 'កំពុងផ្ទុក...' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-lg font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

