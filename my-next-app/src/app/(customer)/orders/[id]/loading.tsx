export default function SingleOrderLoading() {
  return (
    <div className="w-full space-y-8 animate-pulse py-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-outline-variant/30 rounded-md"></div>
        <div className="h-8 w-28 bg-outline-variant/30 rounded-full"></div>
      </div>

      {/* Card 1: Order status card skeleton */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-outline-variant/30 rounded"></div>
            <div className="h-4 w-36 bg-outline-variant/20 rounded"></div>
          </div>
          <div className="h-6 w-24 bg-outline-variant/30 rounded-full"></div>
        </div>
        <div className="h-16 w-full bg-outline-variant/20 rounded-xl"></div>
      </div>

      {/* Card 2: Items skeleton */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 space-y-4">
        <div className="h-6 w-36 bg-outline-variant/30 rounded"></div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <div className="h-5 w-40 bg-outline-variant/20 rounded"></div>
              <div className="h-5 w-16 bg-outline-variant/30 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
