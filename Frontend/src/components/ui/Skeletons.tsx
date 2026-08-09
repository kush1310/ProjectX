import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse border border-gray-100 h-full">
      <div className="w-full h-40 bg-gray-200 rounded-lg mb-4"></div>
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="flex justify-between items-center mt-auto">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-8 bg-gray-200 rounded-full w-8"></div>
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5 }) => {
  return (
    <div className="w-full animate-pulse">
      <div className="h-10 bg-gray-200 rounded-t-lg mb-1"></div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-4">
           <div className="h-3 bg-gray-200 rounded w-1/12"></div>
           <div className="h-3 bg-gray-200 rounded w-3/12"></div>
           <div className="h-3 bg-gray-200 rounded w-2/12"></div>
           <div className="h-3 bg-gray-200 rounded w-2/12"></div>
           <div className="h-8 bg-gray-200 rounded w-1/12 ml-auto"></div>
        </div>
      ))}
    </div>
  );
};

export const CardGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(count)].map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const MenuSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
    <CardGridSkeleton count={4} />
  </div>
);

export const AnalyticsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>
      ))}
    </div>
    <div className="h-64 bg-gray-200 rounded-2xl"></div>
  </div>
);

export const FullPagePreloader = () => (
  <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-white">
    <div className="relative w-16 h-16 mb-4">
      <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
    </div>
    <h2 className="text-xl font-bold tracking-wider">CHARUSAT Needs</h2>
    <p className="text-sm text-slate-400 mt-1">Loading campus dining platform...</p>
  </div>
);
