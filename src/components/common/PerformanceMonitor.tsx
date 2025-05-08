"use client";

import { useState, useEffect, useRef } from 'react';
import { logPerformanceMetrics } from '@/utils/performance';

interface PerformanceMetrics {
  fps: number;
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null;
  timing: {
    pageLoadTime: number;
    domReadyTime: number;
    networkLatency: number;
  };
  resourceCount: number;
  renderCount: number;
}

interface PerformanceMonitorProps {
  showInProduction?: boolean;
}

/**
 * Performance monitoring component that displays real-time performance metrics
 * Only shown in development mode by default
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  showInProduction = false 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memory: null,
    timing: {
      pageLoadTime: 0,
      domReadyTime: 0,
      networkLatency: 0,
    },
    resourceCount: 0,
    renderCount: 0,
  });
  
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const renderCountRef = useRef(0);
  
  // Increment render count on each render
  renderCountRef.current += 1;
  
  // Check if we should show the monitor
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    setIsVisible(isDev || showInProduction);
    
    // Log performance metrics to console
    if (isDev) {
      logPerformanceMetrics();
    }
  }, [showInProduction]);
  
  // Calculate FPS
  useEffect(() => {
    if (!isVisible) return;
    
    let animationFrameId: number;
    
    const measureFPS = (timestamp: number) => {
      frameCountRef.current += 1;
      
      // Update FPS every second
      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        
        setMetrics(prev => ({
          ...prev,
          fps,
          renderCount: renderCountRef.current,
        }));
        
        frameCountRef.current = 0;
        lastFrameTimeRef.current = timestamp;
      }
      
      animationFrameId = requestAnimationFrame(measureFPS);
    };
    
    animationFrameId = requestAnimationFrame(measureFPS);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);
  
  // Measure memory usage
  useEffect(() => {
    if (!isVisible) return;
    
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory;
        
        setMetrics(prev => ({
          ...prev,
          memory: {
            usedJSHeapSize: memoryInfo.usedJSHeapSize,
            totalJSHeapSize: memoryInfo.totalJSHeapSize,
            jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
          },
        }));
      }
    }, 2000);
    
    return () => {
      clearInterval(memoryInterval);
    };
  }, [isVisible]);
  
  // Measure page load metrics
  useEffect(() => {
    if (!isVisible || !window.performance || !window.performance.timing) return;
    
    const timing = window.performance.timing;
    
    // These metrics are only available after the page has fully loaded
    const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    const domReadyTime = timing.domComplete - timing.domLoading;
    const networkLatency = timing.responseEnd - timing.requestStart;
    
    setMetrics(prev => ({
      ...prev,
      timing: {
        pageLoadTime,
        domReadyTime,
        networkLatency,
      },
      resourceCount: performance.getEntriesByType('resource').length,
    }));
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  // Format bytes to human-readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  return (
    <div 
      className={`fixed bottom-0 right-0 z-50 bg-black bg-opacity-80 text-white p-2 text-xs font-mono rounded-tl-md transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-auto'
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs hover:text-blue-300 focus:outline-none"
        >
          {isExpanded ? 'Performance ▼' : 'Perf ▶'}
        </button>
        
        <div className="flex items-center">
          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
            metrics.fps > 50 ? 'bg-green-500' : 
            metrics.fps > 30 ? 'bg-yellow-500' : 'bg-red-500'
          }`}></span>
          <span>{metrics.fps} FPS</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="space-y-1 text-xs">
          <div className="grid grid-cols-2 gap-1">
            <span className="text-gray-400">Renders:</span>
            <span>{metrics.renderCount}</span>
            
            <span className="text-gray-400">Resources:</span>
            <span>{metrics.resourceCount}</span>
            
            <span className="text-gray-400">Page Load:</span>
            <span>{metrics.timing.pageLoadTime} ms</span>
            
            <span className="text-gray-400">DOM Ready:</span>
            <span>{metrics.timing.domReadyTime} ms</span>
            
            <span className="text-gray-400">Network:</span>
            <span>{metrics.timing.networkLatency} ms</span>
            
            {metrics.memory && (
              <>
                <span className="text-gray-400">Memory:</span>
                <span>{formatBytes(metrics.memory.usedJSHeapSize)} / {formatBytes(metrics.memory.totalJSHeapSize)}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
