import * as React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-semibold tracking-widest uppercase transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 font-space';
    
    const variants = {
      primary: 'bg-gold text-black hover:brightness-110 hover:scale-[1.02]',
      ghost: 'text-white hover:bg-white/10 hover:text-gold',
      outline: 'border border-white/20 text-white bg-transparent hover:bg-white/5 hover:border-white/40',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      link: 'text-gold underline-offset-4 hover:underline px-0 py-0',
    };

    const sizes = {
      sm: 'h-9 px-4 text-xs',
      md: 'h-11 px-8',
      lg: 'h-14 px-10 text-base',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(baseStyles, variants[variant], variant !== 'link' && sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
