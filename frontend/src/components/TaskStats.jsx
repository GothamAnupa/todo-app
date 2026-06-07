export default function TaskStats({ stats }) {
  // Guard — wait for stats to load
  if (!stats) return null

  const items = [
    {
      label: 'Total',
      // Support both camelCase and snake_case keys from backend
      value: stats.total ?? 0,
      border: 'border-l-gray-400',
      iconWrap: 'bg-gray-100 text-gray-500',
      valueColor: 'text-gray-800',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Completed',
      value: stats.completed ?? 0,
      border: 'border-l-emerald-500',
      iconWrap: 'bg-emerald-50 text-emerald-600',
      valueColor: 'text-emerald-700',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Pending',
      value: stats.pending ?? 0,
      border: 'border-l-amber-500',
      iconWrap: 'bg-amber-50 text-amber-600',
      valueColor: 'text-amber-700',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'High Priority',
      // Handles both camelCase (frontend) and snake_case (Python backend)
      value: stats.highPriority ?? stats.high_priority ?? 0,
      border: 'border-l-red-500',
      iconWrap: 'bg-red-50 text-red-600',
      valueColor: 'text-red-700',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      label: 'Overdue',
      value: stats.overdue ?? 0,
      border: 'border-l-orange-500',
      iconWrap: 'bg-orange-50 text-orange-600',
      valueColor: 'text-orange-700',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <section
      aria-label="Task statistics"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-3"
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={[
            'flex items-center gap-2.5 rounded-2xl border border-[#F3F4F6] border-l-4 bg-white px-3 py-2.5',
            'shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
            item.border,
            // On a 2-col grid the 5th card spans full width; on sm+ it resets to 1 col
            i === 4 ? 'col-span-2 sm:col-span-1' : '',
          ].filter(Boolean).join(' ')}
        >
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.iconWrap}`}>
            {item.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">
              {item.label}
            </p>
            <p className={`text-xl font-bold leading-tight ${item.valueColor}`}>
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </section>
  )
}