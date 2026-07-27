export default function CartLoading() {
  return (
    <div className="max-w-max-width mx-auto py-6 space-y-lg animate-pulse">
      {/* Title Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-40 bg-outline-variant/30 rounded-lg"></div>
        <div className="h-4 w-60 bg-outline-variant/20 rounded-md"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl items-start">
        {/* Left Side: Items List Skeleton */}
        <div className="lg:col-span-2 space-y-md">
          <div className="bg-surface rounded-2xl border border-outline-variant divide-y divide-outline-variant/60 shadow-sm overflow-hidden">
            {[1, 2].map((i) => (
              <div key={i} className="p-lg flex gap-md items-center">
                {/* Image Skeleton */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-outline-variant/30 flex-shrink-0"></div>

                {/* Details Skeleton */}
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-44 bg-outline-variant/30 rounded"></div>
                  <div className="h-4 w-24 bg-outline-variant/20 rounded"></div>
                </div>

                {/* Stepper Skeleton */}
                <div className="flex items-center gap-md">
                  <div className="h-8 w-24 bg-outline-variant/30 rounded-xl"></div>
                  <div className="h-8 w-8 bg-outline-variant/20 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center px-xs">
            <div className="h-5 w-32 bg-outline-variant/20 rounded"></div>
            <div className="h-5 w-24 bg-outline-variant/20 rounded"></div>
          </div>
        </div>

        {/* Right Side: Order Summary Skeleton */}
        <div className="space-y-md">
          <div className="bg-surface rounded-2xl border border-outline-variant p-lg shadow-sm space-y-lg">
            <div className="h-6 w-36 bg-outline-variant/30 rounded border-b border-outline-variant pb-md"></div>

            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-outline-variant/20 rounded"></div>
                  <div className="h-4 w-16 bg-outline-variant/30 rounded"></div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-outline-variant/40">
                <div className="h-6 w-16 bg-outline-variant/30 rounded"></div>
                <div className="h-6 w-20 bg-outline-variant/30 rounded"></div>
              </div>
            </div>

            <div className="h-10 w-full bg-outline-variant/30 rounded-xl"></div>
            <div className="h-12 w-full bg-outline-variant/40 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
