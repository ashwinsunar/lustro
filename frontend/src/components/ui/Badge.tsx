import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'new' | 'sale' | 'limited' | 'sold_out' | 'featured' | 'trending';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-zinc-800 text-white',
    new: 'border border-gold text-gold bg-transparent',
    sale: 'bg-destructive text-destructive-foreground',
    limited: 'bg-purple-900 text-purple-100',
    sold_out: 'bg-zinc-800 text-zinc-400',
    featured: 'bg-gold text-black',
    trending: 'bg-amber-600 text-white',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase font-space transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
