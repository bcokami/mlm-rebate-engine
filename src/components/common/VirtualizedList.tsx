"use client";

import React, { useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps<T> {
  items: T[];
  height?: number | string;
  width?: number | string;
  itemHeight?: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  className?: string;
  itemClassName?: string;
  emptyComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  isLoading?: boolean;
}

/**
 * A virtualized list component that efficiently renders large lists
 * by only rendering items that are visible in the viewport
 */
function VirtualizedList<T>({
  items,
  height = 400,
  width = '100%',
  itemHeight = 50,
  overscan = 5,
  renderItem,
  keyExtractor,
  onEndReached,
  onEndReachedThreshold = 0.5,
  className = '',
  itemClassName = '',
  emptyComponent,
  loadingComponent,
  isLoading = false,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [hasCalledOnEndReached, setHasCalledOnEndReached] = useState(false);

  // Create the virtualizer
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  // Handle scroll to detect when we're near the end of the list
  const handleScroll = useCallback(() => {
    if (!onEndReached || hasCalledOnEndReached) return;

    const { scrollHeight, scrollTop, clientHeight } = parentRef.current!;
    const scrollPosition = scrollTop + clientHeight;
    const scrollThreshold = scrollHeight * onEndReachedThreshold;

    if (scrollPosition >= scrollThreshold) {
      setHasCalledOnEndReached(true);
      onEndReached();
      
      // Reset after a delay to prevent multiple calls
      setTimeout(() => {
        setHasCalledOnEndReached(false);
      }, 1000);
    }
  }, [onEndReached, hasCalledOnEndReached, onEndReachedThreshold]);

  // Show loading component if loading
  if (isLoading && loadingComponent) {
    return <div style={{ height, width }}>{loadingComponent}</div>;
  }

  // Show empty component if no items
  if (items.length === 0 && emptyComponent) {
    return <div style={{ height, width }}>{emptyComponent}</div>;
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height, width }}
      onScroll={onEndReached ? handleScroll : undefined}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];
          const key = keyExtractor(item, virtualItem.index);

          return (
            <div
              key={key}
              className={`absolute top-0 left-0 w-full ${itemClassName}`}
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualizedList;
