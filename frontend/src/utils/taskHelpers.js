const TITLE_MIN = 1
const TITLE_MAX = 255

export function isOverdue(task) {
  if (!task?.deadline || task.status === 'completed') return false
  const deadline = new Date(task.deadline)
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()
}

export function formatStatus(status) {
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function getPriorityClasses(priority) {
  const map = {
    low: {
      badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
      border: 'border-l-emerald-500',
    },
    medium: {
      badge: 'bg-amber-100 text-amber-800 ring-amber-200',
      border: 'border-l-amber-500',
    },
    high: {
      badge: 'bg-rose-100 text-rose-800 ring-rose-200',
      border: 'border-l-rose-500',
    },
  }
  return map[priority] ?? map.medium
}

export function formatRelativeTime(value) {
  if (!value) return 'No date'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Invalid date'

  const diffMs = date.getTime() - Date.now()
  const absSec = Math.abs(Math.round(diffMs / 1000))
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  if (absSec < 60) return rtf.format(Math.round(diffMs / 1000), 'second')
  if (absSec < 3600) return rtf.format(Math.round(diffMs / 60000), 'minute')
  if (absSec < 86400) return rtf.format(Math.round(diffMs / 3600000), 'hour')
  return rtf.format(Math.round(diffMs / 86400000), 'day')
}

export function filterTasksByTitle(tasks, search = '') {
  const query = search.trim().toLowerCase()
  if (!query) return tasks
  return tasks.filter((task) => task.title.toLowerCase().includes(query))
}

export function sortTasksClient(tasks, sortBy, order = 'desc') {
  const copy = [...tasks]
  const direction = order === 'asc' ? 1 : -1

  copy.sort((a, b) => {
    const left = a[sortBy]
    const right = b[sortBy]

    if (left == null && right == null) return 0
    if (left == null) return 1
    if (right == null) return -1

    if (typeof left === 'string') {
      return left.localeCompare(right) * direction
    }

    return (new Date(left) - new Date(right)) * direction
  })

  return copy
}

export function computeTaskStats(tasks = []) {
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    highPriority: tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length,
    overdue: tasks.filter((t) => isOverdue(t)).length,
  }
}

export function validateTaskForm(form) {
  const errors = {}
  const title = form.title?.trim() ?? ''

  if (!title) {
    errors.title = 'Title is required'
  } else if (title.length < TITLE_MIN) {
    errors.title = `Title must be at least ${TITLE_MIN} character`
  } else if (title.length > TITLE_MAX) {
    errors.title = `Title must be at most ${TITLE_MAX} characters`
  }

  let deadline = null
  if (form.deadline) {
    deadline = new Date(form.deadline)
    if (Number.isNaN(deadline.getTime())) {
      errors.deadline = 'Deadline is invalid'
    }
  }

  if (form.reminder_time) {
    const reminderTime = new Date(form.reminder_time)
    if (Number.isNaN(reminderTime.getTime())) {
      errors.reminder_time = 'Reminder time is invalid'
    } else if (reminderTime < new Date()) {
      errors.reminder_time = 'Reminder cannot be in the past'
    } else if (deadline && reminderTime >= deadline) {
      errors.reminder_time = 'Reminder must be before the deadline'
    }
  }

  return errors
}

export function toDateTimeLocalValue(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function buildTaskPayload(form) {
  return {
    title: form.title.trim(),
    priority: form.priority,
    description: form.description?.trim() || null,
    deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    reminder_time: form.reminder_time ? new Date(form.reminder_time).toISOString() : null,
  }
}
