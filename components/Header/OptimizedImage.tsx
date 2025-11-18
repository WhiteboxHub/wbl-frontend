'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends ImageProps {
  fallback?: string;
}

export default function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height,
  fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==',
  ...props 
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div 
      style={{ 
        position: 'relative',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: width && height ? `${width} / ${height}` : undefined,
      }}
    >
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        {...props}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => setImgSrc(fallback)}
        style={{
          ...props.style,
          objectFit: props.style?.objectFit || 'cover',
        }}
        placeholder="blur"
        blurDataURL={fallback}
      />
      {isLoading && (
        <div 
          className="loading-skeleton absolute inset-0"
          aria-hidden="true"
        />
      )}
    </div>
  );
}