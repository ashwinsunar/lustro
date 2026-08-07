import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, ...props }, ref) => {
    return (
      <label className="block">
        {label && (
          <span className="block mb-2 text-xs font-space tracking-widest uppercase text-white/60">
            {label}
          </span>
        )}
        <input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-sm border bg-zinc-900 px-4 py-2 text-sm text-white transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-gold/50 disabled:cursor-not-allowed disabled:opacity-50 font-space',
            error ? 'border-destructive focus-visible:border-destructive' : 'border-white/10',
            className
          )}
          ref={ref}
          {...props}
        />
      </label>
    );
  }
);
Input.displayName = 'Input';

export { Input };
