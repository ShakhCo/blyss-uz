export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 animate-pulse">
      {/* Header skeleton */}
      <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg z-30 border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div>
            <div className="h-5 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-1.5" />
            <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Calendar section skeleton */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="h-7 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="flex gap-1">
            <div className="w-11 h-11 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="w-11 h-11 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
        {/* Date pills */}
        <div className="flex gap-2 py-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-[4.5rem] h-[4.5rem] rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Time slots skeleton */}
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="h-7 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-3" />
        <div className="grid grid-cols-4 gap-2 py-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  )
}
