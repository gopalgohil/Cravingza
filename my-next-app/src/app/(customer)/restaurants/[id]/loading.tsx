export default function RestaurantLoading() {
  return (
    <div className="space-y-xl max-w-max-width mx-auto py-6 pb-24 md:pb-12 animate-pulse">
      {/* Back Button Skeleton */}
      <div className="h-6 w-36 bg-outline-variant/30 rounded-md"></div>

      {/* Hero Banner Skeleton */}
      <div className="relative aspect-[21/9] md:aspect-[3/1] rounded-2xl bg-outline-variant/30 overflow-hidden shadow-md flex items-end p-lg md:p-xl">
        <div className="space-y-3 w-full">
          <div className="h-8 w-64 bg-white/40 rounded-lg"></div>
          <div className="h-4 w-48 bg-white/30 rounded-md"></div>
          <div className="h-6 w-56 bg-white/30 rounded-lg"></div>
        </div>
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl items-start">
        <div className="lg:col-span-2 space-y-lg">
          {/* Filter Tabs & Search Skeleton */}
          <div className="flex flex-col sm:flex-row gap-md justify-between items-stretch sm:items-center py-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-24 bg-outline-variant/30 rounded-xl"></div>
              ))}
            </div>
            <div className="h-10 w-full sm:w-64 bg-outline-variant/30 rounded-xl"></div>
          </div>

          {/* Menu Items Skeleton */}
          <div className="space-y-md">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface rounded-2xl p-lg border border-outline-variant/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md"
              >
                <div className="flex gap-md items-start sm:items-center w-full sm:w-auto flex-1">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-outline-variant/30 flex-shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-44 bg-outline-variant/30 rounded"></div>
                    <div className="h-4 w-full max-w-sm bg-outline-variant/20 rounded"></div>
                    <div className="h-5 w-20 bg-outline-variant/30 rounded"></div>
                  </div>
                </div>
                <div className="w-24 h-10 bg-outline-variant/30 rounded-xl flex-shrink-0"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Sidebar Skeleton */}
        <div className="hidden lg:block bg-surface rounded-2xl border border-outline-variant p-lg space-y-lg">
          <div className="h-6 w-32 bg-outline-variant/30 rounded border-b border-outline-variant pb-md"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 w-28 bg-outline-variant/20 rounded"></div>
                <div className="h-4 w-16 bg-outline-variant/30 rounded"></div>
              </div>
            ))}
          </div>
          <div className="h-12 w-full bg-outline-variant/40 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
