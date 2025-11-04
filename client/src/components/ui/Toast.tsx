// Toast component using Radix UI
import * as ToastPrimitive from '@radix-ui/react-toast';
import React from 'react';
import { cn } from '../../lib/utils';

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = ToastPrimitive.Viewport;

export interface ToastProps extends ToastPrimitive.ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, title, description, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-gray-800',
      success: 'bg-green-50 dark:bg-green-900',
      error: 'bg-red-50 dark:bg-red-900',
      warning: 'bg-yellow-50 dark:bg-yellow-900',
    };

    return (
      <ToastPrimitive.Root
        ref={ref}
        className={cn(
          'rounded-md shadow-lg p-4 border',
          variants[variant],
          className
        )}
        {...props}
      >
        {title && (
          <ToastPrimitive.Title className="font-semibold text-sm">
            {title}
          </ToastPrimitive.Title>
        )}
        {description && (
          <ToastPrimitive.Description className="text-sm mt-1">
            {description}
          </ToastPrimitive.Description>
        )}
        <ToastPrimitive.Close className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          ×
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    );
  }
);

Toast.displayName = 'Toast';

