# Performance Optimization Guide

This document provides guidelines and best practices for optimizing the performance of the MLM Rebate Engine application.

## Table of Contents

1. [React Optimization Techniques](#react-optimization-techniques)
2. [API and Data Fetching](#api-and-data-fetching)
3. [Database Optimization](#database-optimization)
4. [Image Optimization](#image-optimization)
5. [Bundle Size Optimization](#bundle-size-optimization)
6. [Performance Monitoring](#performance-monitoring)
7. [Mobile Optimization](#mobile-optimization)

## React Optimization Techniques

### Use Memoization

Use React's memoization features to prevent unnecessary re-renders:

```jsx
// Memoize expensive calculations
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// Memoize callback functions
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// Memoize components
const MemoizedComponent = React.memo(MyComponent);
```

### Virtualize Long Lists

For long lists, use virtualization to only render visible items:

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedList({ items }) {
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Use Code Splitting

Split your code into smaller chunks that load on demand:

```jsx
import { lazy, Suspense } from 'react';

// Lazy load components
const LazyComponent = lazy(() => import('./LazyComponent'));

function MyComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

## API and Data Fetching

### Use React Query

React Query provides caching, deduplication, and background updates:

```jsx
import { useQuery } from '@tanstack/react-query';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data.map(todo => <div key={todo.id}>{todo.title}</div>)}</div>;
}
```

### Aggregate API Endpoints

Combine multiple API calls into a single endpoint to reduce network requests:

```typescript
// Instead of separate endpoints for user, wallet, and rebates
// Create a combined endpoint
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  
  const [user, wallet, rebates] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.rebate.findMany({ where: { userId } })
  ]);
  
  return NextResponse.json({ user, wallet, rebates });
}
```

### Implement Pagination

Use pagination for large data sets:

```typescript
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    prisma.item.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.item.count()
  ]);
  
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}
```

## Database Optimization

### Add Proper Indexes

Add indexes to frequently queried fields:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  uplineId  Int?
  upline    User?    @relation("Downlines", fields: [uplineId], references: [id])
  downlines User[]   @relation("Downlines")
  
  // Add indexes to frequently queried fields
  @@index([uplineId])
}
```

### Use Select to Limit Fields

Only select the fields you need:

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    // Only select needed fields
  }
});
```

### Optimize Joins

Use include instead of multiple queries:

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    wallet: true,
    downlines: {
      select: {
        id: true,
        name: true
      }
    }
  }
});
```

## Image Optimization

### Use Next.js Image Component

The Next.js Image component automatically optimizes images:

```jsx
import Image from 'next/image';

function MyComponent() {
  return (
    <Image
      src="/profile.jpg"
      alt="Profile"
      width={500}
      height={500}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

### Lazy Load Images

Lazy load images that are not in the viewport:

```jsx
import { useEffect, useRef, useState } from 'react';

function LazyImage({ src, alt }) {
  const imgRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return (
    <div ref={imgRef}>
      {isVisible ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="placeholder" />
      )}
    </div>
  );
}
```

## Bundle Size Optimization

### Analyze Bundle Size

Use tools to analyze your bundle size:

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your next config
});

# Run analysis
ANALYZE=true npm run build
```

### Tree Shaking

Import only what you need:

```jsx
// Bad
import * as React from 'react';

// Good
import { useState, useEffect } from 'react';
```

### Use Dynamic Imports

Load components only when needed:

```jsx
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(() => import('./DynamicComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // Disable server-side rendering if not needed
});
```

## Performance Monitoring

### Use the Performance Utility

Use the performance utility to measure function execution time:

```jsx
import { measurePerformance } from '@/utils/performance';

function MyComponent() {
  const data = measurePerformance(() => {
    // Expensive calculation
    return calculateData();
  }, 'Data Calculation');
  
  return <div>{data}</div>;
}
```

### Monitor Real User Metrics

Implement real user monitoring:

```jsx
useEffect(() => {
  // Log performance metrics when the component mounts
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const { loadEventEnd, navigationStart } = performance.timing;
        const pageLoadTime = loadEventEnd - navigationStart;
        console.log(`Page load time: ${pageLoadTime}ms`);
        
        // Send to analytics
        // analytics.track('Page Load Time', { value: pageLoadTime });
      }, 0);
    });
  }
}, []);
```

## Mobile Optimization

### Responsive Design

Use responsive design principles:

```css
/* Use responsive units */
.container {
  width: 100%;
  max-width: 1200px;
  padding: 1rem;
}

/* Use media queries */
@media (max-width: 768px) {
  .container {
    padding: 0.5rem;
  }
}
```

### Touch-Friendly UI

Make UI elements touch-friendly:

```css
/* Minimum touch target size */
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

/* Add appropriate spacing */
.nav-items {
  display: flex;
  gap: 16px;
}
```

### Reduce Network Requests

Combine CSS and JS files, use sprites for icons, and implement caching:

```jsx
// Use icon components instead of loading individual SVGs
import { FaUser, FaShoppingCart, FaHeart } from 'react-icons/fa';

function Icons() {
  return (
    <div>
      <FaUser />
      <FaShoppingCart />
      <FaHeart />
    </div>
  );
}
```
