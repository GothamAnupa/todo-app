/**
 * Format ISO datetime strings for display in the UI.
 */
export function formatDate(value) {
  if (!value) return 'No deadline'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
