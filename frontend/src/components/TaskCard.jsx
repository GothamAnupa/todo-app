import { formatDate } from '../utils/formatDate'
import { formatRelativeTime, isOverdue } from '../utils/taskHelpers'

export default function TaskCard({ task, onComplete, onDelete, onEdit, disabled = false }) {
  // Guard — if task is undefined/null, render nothing
  if (!task) return null

  const overdue   = isOverdue(task)
  const completed = task.status === 'completed'
  const hasReminder = Boolean(task.reminder_time && !task.is_reminded && !completed)

  const priorityConfig = {
    low:    { border: 'border-l-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
    medium: { border: 'border-l-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'       },
    high:   { border: 'border-l-red-400',     badge: 'bg-red-50 text-red-700 ring-1 ring-red-200'             },
  }
  // Fallback to medium if priority is missing or unrecognised
  const priority = priorityConfig[task.priority] ?? priorityConfig.medium
  const priorityLabel = task.priority
    ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
    : 'Medium'

  return (
    <article
      className={[
        'group relative flex flex-col rounded-2xl border border-[#E5E7EB] bg-white',
        'border-l-4 shadow-sm transition-all duration-200 ease-out',
        'hover:-translate-y-0.5 hover:shadow-md hover:border-[#D1D5DB]',
        priority.border,
        completed ? 'opacity-60' : '',
        overdue   ? 'ring-1 ring-red-200' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="flex flex-1 flex-col gap-3 p-4">

        {/* Row 1 — Title + Priority badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className={[
            'flex-1 text-sm font-semibold leading-snug',
            completed ? 'text-[#9CA3AF] line-through' : 'text-[#111827]',
          ].join(' ')}>
            {task.title}
          </h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${priority.badge}`}>
            {priorityLabel}
          </span>
        </div>

        {/* Description */}
        {task.description && (
          <p className={[
            '-mt-1 line-clamp-2 text-xs leading-relaxed',
            completed ? 'text-[#D1D5DB]' : 'text-[#6B7280]',
          ].join(' ')}>
            {task.description}
          </p>
        )}

        {/* Status + Overdue + Reminder chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className={[
            'rounded-full px-2 py-0.5 text-[11px] font-medium',
            completed
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              : 'bg-[#F3F4F6] text-[#6B7280]',
          ].join(' ')}>
            {completed ? '✓ Done' : 'Pending'}
          </span>

          {overdue && (
            <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-red-200">
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Overdue
            </span>
          )}

          {hasReminder && (
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200">
              <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Reminder
            </span>
          )}
        </div>

        {/* Meta — deadline + reminder time */}
        {(task.deadline || (task.reminder_time && !completed)) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#9CA3AF]">
            {task.deadline && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(task.deadline)}
              </span>
            )}
            {task.reminder_time && !completed && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatRelativeTime(task.reminder_time)}
              </span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-[#F3F4F6]" />

        {/* Action buttons — always visible on mobile, hover-reveal on desktop */}
        <div className="flex items-center gap-2">

          {!completed && (
            <button
              type="button"
              onClick={() => onComplete?.(task.id)}
              disabled={disabled}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#5B5BD6] py-2 text-xs font-medium text-white transition-all active:scale-95 hover:bg-[#4F4FCC] disabled:opacity-50 sm:flex-none sm:px-3"
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="sm:hidden">Complete</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit?.(task)}
            disabled={disabled}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white py-2 text-xs font-medium text-[#374151] transition-all active:scale-95 hover:bg-[#F9FAFB] disabled:opacity-50 sm:flex-none sm:px-3"
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="sm:hidden">Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(task)}
            disabled={disabled}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#FEE2E2] bg-white py-2 text-xs font-medium text-red-600 transition-all active:scale-95 hover:bg-[#FEF2F2] disabled:opacity-50 sm:flex-none sm:px-3"
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="sm:hidden">Delete</span>
          </button>

        </div>
      </div>
    </article>
  )
}