'use client';

import { useEffect } from 'react';

interface AsyncStyleLoaderProps {
  href: string;
  as?: string;
  onLoad?: () => void;
}

export default function AsyncStyleLoader({ href, as = 'style', onLoad }: AsyncStyleLoaderProps) {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.as = as;
    
    if (onLoad) {
      link.onload = onLoad;
    }
    
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [href, as, onLoad]);

  return null;
}