'use client';

import type { ReactNode } from 'react';

interface HorizontalScrollTabsProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  /** Sağdaki gradient rengi */
  fade?: 'white' | 'stone';
}

const FADE_CLASS = {
  white: 'from-white via-white/90',
  stone: 'from-stone via-stone/90',
};

export default function HorizontalScrollTabs({
  children,
  className = '',
  innerClassName = '',
  fade = 'white',
}: HorizontalScrollTabsProps) {
  return (
    <div className={`relative w-full min-w-0 ${className}`}>
      <div
        className={`pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l to-transparent ${FADE_CLASS[fade]}`}
        aria-hidden
      />
      <div className="category-tabs-scroll">
        <div className={`inline-flex w-max max-w-none flex-nowrap items-center ${innerClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
