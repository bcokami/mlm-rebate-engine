/**
 * Performance monitoring utilities
 * 
 * This module provides utilities for monitoring and improving application performance.
 */

/**
 * Measures the execution time of a function
 * 
 * @param fn The function to measure
 * @param name Optional name for logging
 * @returns The result of the function
 */
export function measurePerformance<T>(fn: () => T, name: string = 'Function'): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`);
  
  return result;
}

/**
 * Creates a debounced version of a function
 * 
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function(...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Creates a throttled version of a function
 * 
 * @param fn The function to throttle
 * @param limit The time limit in milliseconds
 * @returns A throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return function(...args: Parameters<T>) {
    const now = Date.now();
    
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Lazy loads an image
 * 
 * @param src The image source URL
 * @returns A promise that resolves when the image is loaded
 */
export function lazyLoadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Checks if the browser supports the Intersection Observer API
 * 
 * @returns True if the browser supports Intersection Observer
 */
export function supportsIntersectionObserver(): boolean {
  return 'IntersectionObserver' in window;
}

/**
 * Checks if the browser supports the ResizeObserver API
 * 
 * @returns True if the browser supports ResizeObserver
 */
export function supportsResizeObserver(): boolean {
  return 'ResizeObserver' in window;
}

/**
 * Checks if the browser supports the requestIdleCallback API
 * 
 * @returns True if the browser supports requestIdleCallback
 */
export function supportsRequestIdleCallback(): boolean {
  return 'requestIdleCallback' in window;
}

/**
 * Runs a function when the browser is idle
 * 
 * @param callback The function to run
 * @param timeout Optional timeout in milliseconds
 */
export function runWhenIdle(callback: () => void, timeout?: number): void {
  if (supportsRequestIdleCallback()) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Checks if the current device is a mobile device
 * 
 * @returns True if the current device is a mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Logs performance metrics to the console
 */
export function logPerformanceMetrics(): void {
  if ('performance' in window) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const domReadyTime = perfData.domComplete - perfData.domLoading;
    
    console.log('[Performance] Page load time:', pageLoadTime, 'ms');
    console.log('[Performance] DOM ready time:', domReadyTime, 'ms');
    
    if ('memory' in window.performance) {
      const memory = (window.performance as any).memory;
      console.log('[Performance] Used JS heap size:', Math.round(memory.usedJSHeapSize / (1024 * 1024)), 'MB');
      console.log('[Performance] Total JS heap size:', Math.round(memory.totalJSHeapSize / (1024 * 1024)), 'MB');
    }
  }
}
