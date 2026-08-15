import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-ds-tint text-ds-base',
        outline: 'border-border text-ds-base',
        low: 'border-transparent text-white',
        moderate: 'border-transparent text-white',
        high: 'border-transparent text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  const bandStyle =
    variant === 'low'
      ? { backgroundColor: 'var(--viz-low)' }
      : variant === 'moderate'
        ? { backgroundColor: 'var(--viz-moderate)' }
        : variant === 'high'
          ? { backgroundColor: 'var(--viz-high)' }
          : undefined;
  return <div className={cn(badgeVariants({ variant, className }))} style={{ ...bandStyle, ...style }} {...props} />;
}

export { Badge, badgeVariants };
