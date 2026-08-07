import { cn } from '../../lib/utils';
import * as React from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export const Container = React.forwardRef<HTMLElement, ContainerProps>(
  ({ className, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn('container-luxury', className)}
        {...props}
      />
    );
  }
);
Container.displayName = 'Container';
