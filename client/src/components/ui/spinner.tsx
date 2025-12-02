'use client';

import * as React from 'react';
import { Loader2, LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends LucideProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2
      className={cn('animate-spin', sizeClasses[size], className)}
      {...props}
    />
  );
}
