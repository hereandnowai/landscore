import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency (USD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format area in acres
 */
export function formatAcres(acres: number): string {
  if (acres < 1) {
    return `${(acres * 43560).toLocaleString()} sq ft`;
  }
  return `${acres.toFixed(2)} acres`;
}

/**
 * Format area in square feet
 */
export function formatSqft(sqft: number): string {
  return `${sqft.toLocaleString()} sq ft`;
}

/**
 * Format date
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get zoning color
 */
export function getZoningColor(zoning: string): string {
  const colors: Record<string, string> = {
    AGRICULTURAL: '#22c55e',
    RESIDENTIAL: '#3b82f6',
    COMMERCIAL: '#f59e0b',
    INDUSTRIAL: '#8b5cf6',
    MIXED_USE: '#ec4899',
  };
  return colors[zoning] || '#6b7280';
}

/**
 * Get soil quality label
 */
export function getSoilQualityLabel(quality: number): string {
  if (quality >= 8) return 'Excellent';
  if (quality >= 6) return 'Good';
  if (quality >= 4) return 'Fair';
  return 'Poor';
}
