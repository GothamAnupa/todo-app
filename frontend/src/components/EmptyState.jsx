export default function EmptyState({
  title = 'No tasks yet',
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF2FF]">
        <svg className="h-8 w-8 text-[#5B5BD6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </div>
      <h3 className="text-lg font-600 text-[#111827]">{title}</h3>
      {message && <p className="mt-2 text-sm text-[#6B7280]">{message}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-lg bg-[#5B5BD6] px-4 py-2.5 text-sm font-500 text-white hover:bg-[#4F4FCC] transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
