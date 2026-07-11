import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'glass';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
          {
            'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40': variant === 'default',
            'border border-white/5 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm': variant === 'outline',
            'hover:bg-white/5 text-neutral-400 hover:text-white': variant === 'ghost',
            'bg-white/10 border border-white/10 backdrop-blur-xl hover:bg-white/20 text-white shadow-2xl': variant === 'glass',
            'h-11 px-6': size === 'default',
            'h-9 rounded-lg px-4 text-[10px]': size === 'sm',
            'h-14 rounded-2xl px-10 text-base': size === 'lg',
            'h-11 w-11 p-0': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
