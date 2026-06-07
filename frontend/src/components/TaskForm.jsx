import { useEffect, useState } from 'react'
import {
  buildTaskPayload,
  toDateTimeLocalValue,
  validateTaskForm,
} from '../utils/taskHelpers'

const emptyForm = {
  title: '',
  description: '',
  priority: 'medium',
  deadline: '',
  reminder_time: '',
}

const priorityOptions = [
  { value: 'low', label: 'Low', tone: 'border-emerald-300 text-emerald-700' },
  { value: 'medium', label: 'Medium', tone: 'border-amber-300 text-amber-700' },
  { value: 'high', label: 'High', tone: 'border-rose-300 text-rose-700' },
]

export default function TaskForm({
  mode = 'create',
  initialTask = null,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const isEdit = mode === 'edit'

  useEffect(() => {
    if (isEdit && initialTask) {
      setForm({
        title: initialTask.title ?? '',
        description: initialTask.description ?? '',
        priority: initialTask.priority ?? 'medium',
        deadline: toDateTimeLocalValue(initialTask.deadline),
        reminder_time: toDateTimeLocalValue(initialTask.reminder_time),
      })
      setErrors({})
      setTouched({})
      return
    }

    if (!isEdit) {
      setForm(emptyForm)
      setErrors({})
      setTouched({})
    }
  }, [isEdit, initialTask])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setTouched((current) => ({ ...current, [name]: true }))
  }

  const handlePrioritySelect = (value) => {
    setForm((current) => ({ ...current, priority: value }))
    setTouched((current) => ({ ...current, priority: true }))
  }

  const handleBlur = (event) => {
    const { name } = event.target
    setTouched((current) => ({ ...current, [name]: true }))
    setErrors(validateTaskForm(form))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validation = validateTaskForm(form)
    setErrors(validation)
    setTouched({ title: true, deadline: true, reminder_time: true })

    if (Object.keys(validation).length > 0) return

    await onSubmit(buildTaskPayload(form))

    if (!isEdit) {
      setForm(emptyForm)
      setErrors({})
      setTouched({})
    }
  }

  const showError = (field) => touched[field] && errors[field]

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      noValidate
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          {isEdit ? 'Edit task' : 'Add a task'}
        </h2>
        {isEdit && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel edit
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Title *</span>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={255}
            placeholder="What needs to be done?"
            aria-invalid={Boolean(showError('title'))}
            aria-describedby={showError('title') ? 'title-error' : undefined}
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
              showError('title')
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
            }`}
          />
          {showError('title') ? (
            <p id="title-error" className="mt-1 text-xs text-rose-600">
              {errors.title}
            </p>
          ) : null}
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Optional details"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </label>

        <fieldset className="block sm:col-span-2">
          <legend className="text-sm font-medium text-slate-700">Priority</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {priorityOptions.map((option) => {
              const active = form.priority === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePrioritySelect(option.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? `${option.tone} bg-white ring-2 ring-indigo-200`
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  aria-pressed={active}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Deadline</span>
          <input
            type="datetime-local"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(showError('deadline'))}
            aria-describedby={showError('deadline') ? 'deadline-error' : undefined}
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 sm:max-w-sm ${
              showError('deadline')
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
            }`}
          />
          {showError('deadline') ? (
            <p id="deadline-error" className="mt-1 text-xs text-rose-600">
              {errors.deadline}
            </p>
          ) : null}
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Reminder time</span>
          <input
            type="datetime-local"
            name="reminder_time"
            value={form.reminder_time}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(showError('reminder_time'))}
            aria-describedby={showError('reminder_time') ? 'reminder-error' : undefined}
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 sm:max-w-sm ${
              showError('reminder_time')
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
            }`}
          />
          {showError('reminder_time') ? (
            <p id="reminder-error" className="mt-1 text-xs text-rose-600">
              {errors.reminder_time}
            </p>
          ) : null}
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create task'}
      </button>
    </form>
  )
}
