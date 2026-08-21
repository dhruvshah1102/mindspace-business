import type { FC } from 'react';
import { cn } from '@/lib/utils';

interface AccentureLogoProps {
  variant?: 'badge' | 'dark' | 'light' | 'co-branded';
  className?: string;
  badgeClassName?: string;
  showCoBrand?: boolean;
}

export const AccentureLogo: FC<AccentureLogoProps> = ({
  variant = 'badge',
  className,
  badgeClassName,
  showCoBrand = false,
}) => {
  // SVG vector representation matching the uploaded image
  const svgLogo = (isWhite: boolean) => (
    <svg
      viewBox="0 0 240 76"
      className={cn('h-6 w-auto object-contain transition-transform', className)}
      aria-label="Accenture"
      role="img"
    >
      {/* Signature Accenture Purple Chevron (positioned above the 't') */}
      <path
        d="M123 10 L141 21 L123 32 L117 27 L129 21 L117 15 Z"
        fill="#A100FF"
      />
      {/* 'accenture' wordmark */}
      <text
        x="10"
        y="58"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
        fontSize="44"
        fontWeight="800"
        letterSpacing="-1.5px"
        fill={isWhite ? '#FFFFFF' : '#111827'}
      >
        accenture
      </text>
    </svg>
  );

  if (variant === 'badge') {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center bg-black px-3.5 py-1.5 rounded-lg shadow-sm border border-neutral-800 transition-all hover:border-purple-500/50',
          badgeClassName
        )}
      >
        {svgLogo(true)}
      </div>
    );
  }

  if (variant === 'light') {
    return svgLogo(false);
  }

  if (variant === 'dark') {
    return svgLogo(true);
  }

  // Co-branded badge
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 rounded-xl bg-black/90 px-3 py-1.5 text-white backdrop-blur-md border border-neutral-800 shadow-xs',
        badgeClassName
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#405445] text-[10px] font-bold text-white shadow-xs">
          M
        </div>
        <span className="font-serif text-sm font-semibold tracking-tight text-white">MindSpace</span>
      </div>
      <span className="text-neutral-500 font-light text-xs">×</span>
      <div className="flex items-center">
        {svgLogo(true)}
      </div>
    </div>
  );
};

export default AccentureLogo;
