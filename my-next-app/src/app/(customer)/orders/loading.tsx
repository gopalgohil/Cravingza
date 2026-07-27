export default function OrdersLoading() {
  return (
    <div className="w-full space-y-8 animate-pulse py-4">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-3">
          <div className="h-9 w-44 bg-outline-variant/30 rounded-lg"></div>
          <div className="h-4 w-72 bg-outline-variant/20 rounded-md"></div>
        </div>
        <div className="h-12 w-full md:w-80 bg-outline-variant/30 rounded-xl"></div>
      </div>

      {/* Filter Chips Skeleton */}
      <div className="flex flex-wrap gap-3 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 bg-outline-variant/30 rounded-full"></div>
        ))}
      </div>

      {/* Order Cards Skeleton */}
      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row gap-6"
          >
            {/* Image Skeleton */}
            <div className="w-full md:w-32 h-32 rounded-lg bg-outline-variant/30 flex-shrink-0"></div>

            {/* Content Skeleton */}
            <div className="flex-grow flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-48 bg-outline-variant/30 rounded"></div>
                  <div className="h-4 w-32 bg-outline-variant/20 rounded"></div>
                </div>
                <div className="h-7 w-24 bg-outline-variant/30 rounded-full"></div>
              </div>

              <div className="h-4 w-3/4 bg-outline-variant/20 rounded"></div>

              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                <div className="h-6 w-20 bg-outline-variant/30 rounded"></div>
                <div className="flex gap-3">
                  <div className="h-9 w-24 bg-outline-variant/30 rounded-lg"></div>
                  <div className="h-9 w-24 bg-outline-variant/30 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
