import { describe, expect, it, afterEach } from 'vitest';
import { cn, formatPrice, getDiscountPercent, getImageUrl, formatDate } from '../src/lib/utils';

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('a', 'b', null, undefined, false)).toBe('a b');
  });
});

describe('formatPrice', () => {
  it('formats numbers as currency without decimals', () => {
    expect(formatPrice(24500)).toBe('$24,500');
    expect(formatPrice('10250')).toBe('$10,250');
  });

  it('supports custom currency', () => {
    expect(formatPrice(1000, 'CHF').replace(/\u00A0/g, ' ')).toBe('CHF 1,000');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    expect(formatDate('2026-08-07T10:00:00Z')).toBe('August 7, 2026');
  });
});

describe('getDiscountPercent', () => {
  it('returns null without a discount price', () => {
    expect(getDiscountPercent('1000', null)).toBeNull();
  });

  it('computes the discount percentage', () => {
    expect(getDiscountPercent('1000', '750')).toBe(25);
  });
});

describe('getImageUrl', () => {
  const original = import.meta.env.VITE_API_URL;
  afterEach(() => {
    import.meta.env.VITE_API_URL = original;
  });

  it('falls back for empty paths', () => {
    expect(getImageUrl('')).toBe('/images/watch-detail.avif');
  });

  it('passes through absolute URLs', () => {
    expect(getImageUrl('https://cdn.example.com/w.png')).toBe('https://cdn.example.com/w.png');
  });

  it('prefixes relative media paths with the API origin', () => {
    import.meta.env.VITE_API_URL = 'http://api.test';
    expect(getImageUrl('/media/watches/x.png')).toBe('http://api.test/media/watches/x.png');
  });
});
