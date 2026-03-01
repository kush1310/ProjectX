

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
