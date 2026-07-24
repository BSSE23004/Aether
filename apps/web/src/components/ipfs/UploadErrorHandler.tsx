'use client';

import React from 'react';
import { AlertCircle, X, RefreshCw, Info, AlertTriangle } from 'lucide-react';

export interface UploadError {
  file: File;
  error: string;
  code?: string;
  retryable?: boolean;
}

interface UploadErrorHandlerProps {
  errors: UploadError[];
  onClear?: () => void;
  onClearError?: (error: UploadError) => void;
  onRetry?: (error: UploadError) => void;
  className?: string;
  showDetails?: boolean;
}

export const UploadErrorHandler: React.FC<UploadErrorHandlerProps> = ({
  errors,
  onClear,
  onClearError,
  onRetry,
  className = '',
  showDetails = false
}) => {
  if (errors.length === 0) return null;

  const getErrorIcon = (error: UploadError) => {
    if (error.code === 'VALIDATION_ERROR') {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    if (error.code === 'NETWORK_ERROR') {
      return <RefreshCw className="h-5 w-5 text-blue-500" />;
    }
    if (error.code === 'AUTH_ERROR') {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  const getErrorSeverity = (error: UploadError): 'error' | 'warning' | 'info' => {
    if (error.code === 'VALIDATION_ERROR') return 'warning';
    if (error.code === 'NETWORK_ERROR') return 'info';
    return 'error';
  };

  const getSeverityClass = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getSeverityTextClass = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h3 className="text-sm font-medium text-gray-700">
            {errors.length} error{errors.length !== 1 ? 's' : ''} occurred
          </h3>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Error List */}
      <div className="space-y-2">
        {errors.map((error, index) => {
          const severity = getErrorSeverity(error);
          return (
            <div
              key={`${error.file.name}-${index}`}
              className={`border rounded-lg p-3 ${getSeverityClass(severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {getErrorIcon(error)}

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${getSeverityTextClass(severity)} truncate`}>
                      {error.file.name}
                    </p>
                    <p className={`text-xs ${getSeverityTextClass(severity)} mt-1`}>
                      {error.error}
                    </p>

                    {showDetails && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <span>Size:</span>
                          <span>{(error.file.size / 1024).toFixed(2)} KB</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <span>Type:</span>
                          <span>{error.file.type || 'Unknown'}</span>
                        </div>
                        {error.code && (
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <span>Code:</span>
                            <span className="font-mono">{error.code}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-2">
                  {error.retryable && onRetry && (
                    <button
                      onClick={() => onRetry(error)}
                      className="p-1.5 hover:bg-white rounded transition-colors"
                      title="Retry"
                    >
                      <RefreshCw className="h-4 w-4 text-gray-600" />
                    </button>
                  )}
                  {onClearError && (
                    <button
                      onClick={() => onClearError(error)}
                      className="p-1.5 hover:bg-white rounded transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Inline error banner for single error
interface ErrorBannerProps {
  error: UploadError;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onDismiss,
  onRetry,
  className = ''
}) => {
  const severity = error.code === 'VALIDATION_ERROR' ? 'warning' : 'error';
  const bgColor = severity === 'error' ? 'bg-red-50' : 'bg-yellow-50';
  const borderColor = severity === 'error' ? 'border-red-200' : 'border-yellow-200';
  const textColor = severity === 'error' ? 'text-red-700' : 'text-yellow-700';

  return (
    <div className={`flex items-center justify-between p-3 border rounded-lg ${bgColor} ${borderColor} ${className}`}>
      <div className="flex items-center space-x-3">
        {severity === 'error' ? (
          <AlertCircle className="h-5 w-5 text-red-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        )}
        <div>
          <p className={`text-sm font-medium ${textColor}`}>{error.file.name}</p>
          <p className={`text-xs ${textColor}`}>{error.error}</p>
        </div>
      </div>

      <div className="flex items-center space-x-1">
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="p-1.5 hover:bg-white rounded transition-colors"
            title="Retry"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 hover:bg-white rounded transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
};

// Toast notification for errors
interface ErrorToastProps {
  error: UploadError;
  onDismiss?: () => void;
  onRetry?: () => void;
  duration?: number;
  className?: string;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onDismiss,
  onRetry,
  duration = 5000,
  className = ''
}) => {
  React.useEffect(() => {
    if (duration > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <div className={`flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          Upload failed: {error.file.name}
        </p>
        <p className="text-xs text-gray-600 truncate">{error.error}</p>
      </div>
      <div className="flex items-center space-x-1">
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Retry"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
};