/**
 * AuthSkeleton Component
 * 
 * Pixel-perfect skeleton for Login/Signup pages
 * Matches the layout of authentication forms exactly
 */

import { Skeleton } from '../DynamicSkeleton';

export default function AuthSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
      {/* Header */}
      <div className="text-center mb-8 space-y-3">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>

      {/* Google Button */}
      <Skeleton className="h-12 w-full rounded-xl mb-6" />

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-px flex-1" animate={false} />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-px flex-1" animate={false} />
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* Footer Links */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Submit Button */}
      <Skeleton className="h-12 w-full rounded-xl mb-6" />

      {/* Footer Text */}
      <div className="flex justify-center gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
