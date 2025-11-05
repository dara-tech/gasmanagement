import React from 'react';

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
    <div className="flex items-center justify-center p-4 md:p-6">
      <div className="flex flex-col items-center justify-center space-y-3">
        {/* Faster Spinner */}
        <div 
          className={`${sizeClasses[size]} border-4 border-primary/20 border-t-primary rounded-full animate-spin`}
          style={{ animationDuration: '0.5s' }}
        />
        
        {/* Loading message */}
        {message && (
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </div>
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
      <div 
        className="h-4 w-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" 
        style={{ animationDuration: '0.4s' }}
      />
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
        <div 
          className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" 
          style={{ animationDuration: '0.3s' }}
        />
        <p className="text-lg font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};
