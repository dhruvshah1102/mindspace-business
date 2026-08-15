import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-ds-base',
        'placeholder:text-muted-foreground/70 transition-shadow',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-deep/40 focus-visible:border-ds-mid',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[110px] w-full rounded-xl border border-border bg-card px-3.5 py-3 text-sm leading-relaxed text-ds-base',
        'placeholder:text-muted-foreground/70 transition-shadow resize-y',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-deep/40 focus-visible:border-ds-mid',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export { Input, Textarea };
