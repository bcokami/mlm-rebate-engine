"use client";

import { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { useInView } from 'react-intersection-observer';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  lowQualitySrc?: string;
  loadingColor?: string;
  threshold?: number;
}

/**
 * OptimizedImage component with lazy loading, progressive loading, and error handling
 * 
 * Features:
 * - Lazy loads images only when they enter the viewport
 * - Shows a low-quality placeholder while loading
 * - Provides a fallback image for errors
 * - Smooth transition when image loads
 * - Optimized for performance
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  fallbackSrc = '/images/placeholder.jpg',
  lowQualitySrc,
  loadingColor = '#f3f4f6',
  threshold = 0.1,
  className = '',
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
  });
  const imageRef = useRef<HTMLImageElement>(null);

  // Track when the image becomes visible
  useEffect(() => {
    if (inView) {
      setIsVisible(true);
    }
  }, [inView]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
  };

  // Determine which source to use
  const imageSrc = hasError ? fallbackSrc : src;

  // Combine classes for styling
  const imageClasses = `
    transition-opacity duration-300 ease-in-out
    ${isLoaded ? 'opacity-100' : 'opacity-0'}
    ${className}
  `;

  // Background style for loading state
  const bgStyle = {
    backgroundColor: loadingColor,
  };

  return (
    <div 
      ref={ref} 
      className="relative overflow-hidden"
      style={{ width, height }}
    >
      {/* Loading background */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 animate-pulse" 
          style={bgStyle}
        />
      )}
      
      {/* Low quality placeholder */}
      {!isLoaded && lowQualitySrc && isVisible && (
        <Image
          src={lowQualitySrc}
          alt={alt}
          fill
          className="object-cover blur-sm"
          priority={false}
        />
      )}
      
      {/* Main image - only load when in viewport */}
      {isVisible && (
        <Image
          {...props}
          ref={imageRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={imageClasses}
          onLoadingComplete={handleLoad}
          onError={handleError}
          priority={false}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
