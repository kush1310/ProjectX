/**
 * SkeletonLoader — Pulse-animation skeleton components for loading states.
 */
import React from 'react';

const Pulse: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} style={style} />
);

/** Skeleton matching OfferTrackingCard layout */
export const OfferCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
                <Pulse className="h-5 w-48" />
                <Pulse className="h-3 w-32" />
            </div>
            <Pulse className="h-6 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Pulse className="h-3 w-20" />
                    <Pulse className="h-5 w-16" />
                </div>
            ))}
        </div>
        <Pulse className="h-px w-full" />
        <div className="flex gap-3">
            <Pulse className="h-8 w-20 rounded-lg" />
            <Pulse className="h-8 w-20 rounded-lg" />
            <Pulse className="h-8 w-20 rounded-lg" />
        </div>
    </div>
);

/** Skeleton for Create Offers preset cards */
export const PresetCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 min-w-[200px]">
        <Pulse className="h-10 w-10 rounded-lg" />
        <Pulse className="h-4 w-24" />
        <Pulse className="h-3 w-32" />
        <Pulse className="h-8 w-full rounded-lg" />
    </div>
);

/** Full-page loading overlay */
export const PageLoader: React.FC = () => (
    <div className="fixed inset-0 z-50 bg-white/90 flex flex-col items-center justify-center gap-4">
        <div className="relative">
            <div className="w-14 h-14 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-b-red-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <p className="text-sm font-medium text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
            Loading Campaign...
        </p>
    </div>
);

/** Track offers tab skeleton */
export const TrackOffersSkeleton: React.FC = () => (
    <div className="space-y-4">
        {/* Filter pills skeleton */}
        <div className="flex gap-3 mb-6">
            {[80, 90, 100, 60].map((w, i) => (
                <Pulse key={i} className="h-9 rounded-lg" style={{ width: w }} />
            ))}
            <div className="ml-auto">
                <Pulse className="h-9 w-48 rounded-lg" />
            </div>
        </div>
        {/* Cards skeleton */}
        {Array.from({ length: 3 }).map((_, i) => (
            <OfferCardSkeleton key={i} />
        ))}
    </div>
);

/** Create offers tab skeleton */
export const CreateOffersSkeleton: React.FC = () => (
    <div className="space-y-6">
        <Pulse className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <PresetCardSkeleton key={i} />
            ))}
        </div>
        <Pulse className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Pulse key={i} className="h-24 rounded-xl" />
            ))}
        </div>
    </div>
);

export default {
    OfferCardSkeleton,
    PresetCardSkeleton,
    PageLoader,
    TrackOffersSkeleton,
    CreateOffersSkeleton,
};
