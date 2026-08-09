import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: string | number, currency = 'USD'): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '/images/watch-detail.avif';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/media')) return `${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://127.0.0.1:8000')}${path}`;
  return path;
}

export function getDiscountPercent(price: string, discountPrice: string | null): number | null {
  if (!discountPrice) return null;
  const original = parseFloat(price);
  const discounted = parseFloat(discountPrice);
  return Math.round(((original - discounted) / original) * 100);
}
