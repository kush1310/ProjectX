/**
 * Dynamic Skeleton Loading Component
 * 
 * Features:
 * - Hybrid timing logic (Fixed min + Network delay)
 * - Premium shimmer animation
 */

import { useEffect, useState, ReactNode } from 'react';

interface DynamicSkeletonProps {
  children: ReactNode;
  className?: string;
  minDuration?: number; // minimum ms to show skeleton
}

// Detect network speed and return appropriate delay
function getNetworkDelay(): number {
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number } }).connection;
  
  if (!connection) return 500; // default overhead
  
  const type = connection.effectiveType;
  switch (type) {
    case 'slow-2g':
    case '2g':
      return 2500;
    case '3g':
      return 1500;
    case '4g':
      return 300;
    default:
      return 500;
  }
}

export function useDynamicLoading(minDuration = 800) {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Logic: Wait fixed minDuration (e.g. 1.3s) THEN add network delay
    // This ensures a minimum consistent loading experience + adjustment for slow networks
    const networkDelay = getNetworkDelay();
    const totalDelay = minDuration + (networkDelay > 500 ? networkDelay : 0);
    
    const timer = setTimeout(() => setIsLoading(false), totalDelay);
    return () => clearTimeout(timer);
  }, [minDuration]);
  
  return isLoading;
}

// Skeleton shimmer effect
export function Skeleton({ className = '', animate = true }: { className?: string; animate?: boolean }) {
  return (
    <div 
      className={`
        bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100
        ${animate ? 'animate-shimmer' : ''}
        rounded-xl
        ${className}
      `}
      style={{
        backgroundSize: '200% 100%',
        animation: animate ? 'shimmer 1.5s ease-in-out infinite' : undefined,
      }}
    >
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
  );
}

// Card skeleton for order cards
export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100/50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      
      {/* Items */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
}

// Menu item skeleton
export function MenuItemSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100/50 overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Sidebar stats skeleton
export function StatsSkeleton() {
  return (
    <div className="flex gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3 bg-white/50 rounded-xl border border-gray-100/50">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Wrapper component that shows skeleton then content
export default function DynamicSkeleton({ 
  children, 
  className = '',
  minDuration = 800 
}: DynamicSkeletonProps) {
  const isLoading = useDynamicLoading(minDuration);
  
  if (isLoading) {
    return <Skeleton className={className} />;
  }
  
  return <>{children}</>;
}
