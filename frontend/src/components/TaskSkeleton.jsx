export default function TaskSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-lg border border-[#E5E7EB] bg-white p-5"
        >
          {/* Title */}
          <div className="h-5 w-3/4 rounded bg-[#E5E7EB]" />
          
          {/* Description */}
          <div className="mt-3 space-y-2">
            <div className="h-4 w-full rounded bg-[#F0F0F0]" />
            <div className="h-4 w-5/6 rounded bg-[#F0F0F0]" />
          </div>

          {/* Badges */}
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-20 rounded-full bg-[#E5E7EB]" />
            <div className="h-6 w-16 rounded-full bg-[#F0F0F0]" />
          </div>

          {/* Meta */}
          <div className="mt-4 h-3 w-2/3 rounded bg-[#F0F0F0]" />
        </div>
      ))}
    </div>
  )
}
