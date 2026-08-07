import * as React from 'react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className }: TooltipProps) {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="group relative inline-block">
      {children}
      <div
        className={cn(
          'pointer-events-none absolute z-50 opacity-0 transition-opacity group-hover:opacity-100',
          positions[position],
          className
        )}
      >
        <div className="whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-xs text-white shadow-md font-space tracking-wider">
          {content}
        </div>
      </div>
    </div>
  );
}
