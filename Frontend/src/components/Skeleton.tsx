/**
 * Skeleton Loading Component
 * 
 * Features:
 * - Multiple variants (default, circle, rounded, square)
 * - Pulse and wave animations
 * - Shimmer effect option
 * - Multiple skeleton items support
 */

import * as React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circle" | "rounded" | "square";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
  shimmer?: boolean;
  count?: number;
}

function Skeleton({
  className = "",
  variant = "default",
  width,
  height,
  animation = "pulse",
  shimmer = false,
  count = 1,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    default: "rounded-md",
    circle: "rounded-full",
    rounded: "rounded-xl",
    square: "rounded-none"
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "",
    none: ""
  };

  const style: React.CSSProperties = {
    width: width !== undefined ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === "number" ? `${height}px` : height) : undefined,
    ...props.style
  };

  const baseClasses = `bg-gray-200 relative overflow-hidden ${variantClasses[variant]} ${animationClasses[animation]} ${shimmer ? "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent" : ""} ${className}`;

  if (count > 1) {
    return (
      <div className="flex flex-col gap-2" {...props}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={baseClasses} style={style} />
        ))}
      </div>
    );
  }

  return <div className={baseClasses} style={style} {...props} />;
}

// Auth Form Skeleton - for Login/Signup pages
function AuthFormSkeleton() {
  return (
    <div className="w-full max-w-md p-6 sm:p-8 space-y-6 animate-pulse">
      {/* Logo placeholder */}
      <div className="flex justify-center mb-6">
        <Skeleton variant="rounded" width={200} height={48} shimmer />
      </div>
      
      {/* Title */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-48 mx-auto" shimmer />
        <Skeleton className="h-4 w-36 mx-auto" shimmer />
      </div>
      
      {/* Google Button */}
      <Skeleton className="h-12 w-full rounded-xl" shimmer />
      
      {/* Divider */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-px flex-1" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-px flex-1" />
      </div>
      
      {/* Form fields */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" shimmer />
        <Skeleton className="h-12 w-full rounded-xl" shimmer />
      </div>
      
      {/* Submit button */}
      <Skeleton className="h-12 w-full rounded-xl" shimmer />
      
      {/* Footer text */}
      <Skeleton className="h-4 w-48 mx-auto" shimmer />
    </div>
  );
}

// Dashboard Card Skeleton
function DashboardCardSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-5 sm:p-6 space-y-4 animate-pulse">
      <Skeleton variant="rounded" width={48} height={48} shimmer />
      <Skeleton className="h-6 w-32" shimmer />
      <Skeleton className="h-4 w-full" shimmer />
      <Skeleton className="h-4 w-3/4" shimmer />
      <Skeleton className="h-10 w-full rounded-lg" shimmer />
    </div>
  );
}

export { Skeleton, AuthFormSkeleton, DashboardCardSkeleton };
