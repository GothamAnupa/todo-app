import { useEffect, useRef, useState } from 'react'
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
  { value: 'low',    label: 'Low',    activeClass: 'bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]' },
  { value: 'medium', label: 'Medium', activeClass: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]' },
  { value: 'high',   label: 'High',   activeClass: 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]' },
]

export default function TaskFormModal({
  mode = 'create',
  initialTask = null,
  open = false,
  onClose,
  onSubmit,
  loading = false,
}) {
  const [form, setForm]       = useState(emptyForm)
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})
  const [visible, setVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const titleInputRef = useRef(null)
  const isEdit = mode === 'edit'

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Animate in/out
  useEffect(() => {
    if (open) {
      setTimeout(() => setVisible(true), 10)
    } else {
      setVisible(false)
    }
  }, [open])

  // Populate form
  useEffect(() => {
    if (!open) return
    if (isEdit && initialTask) {
      setForm({
        title:         initialTask.title         ?? '',
        description:   initialTask.description   ?? '',
        priority:      initialTask.priority      ?? 'medium',
        deadline:      toDateTimeLocalValue(initialTask.deadline),
        reminder_time: toDateTimeLocalValue(initialTask.reminder_time),
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
    setTouched({})
    setTimeout(() => titleInputRef.current?.focus(), 150)
  }, [isEdit, initialTask, open])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((c) => ({ ...c, [name]: value }))
    setTouched((c) => ({ ...c, [name]: true }))
  }

  const handlePrioritySelect = (value) => {
    setForm((c) => ({ ...c, priority: value }))
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((c) => ({ ...c, [name]: true }))
    setErrors(validateTaskForm(form))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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
    onClose()
  }

  const showError = (field) => touched[field] && errors[field]

  if (!open) return null

  // ── Inline styles split cleanly by device ──
  const mobileStyle = {
    transform:  visible ? 'translateY(0)'   : 'translateY(100%)',
    transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
    maxHeight:  '92dvh',
    display:    'flex',
    flexDirection: 'column',
  }

  const desktopStyle = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.95)',
    transition: 'opacity 200ms ease, transform 200ms ease',
    maxHeight:  '92dvh',
    display:    'flex',
    flexDirection: 'column',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
      />

      {/* Sheet / Modal */}
      <div
        style={isMobile ? mobileStyle : desktopStyle}
        className={
          isMobile
            ? 'fixed bottom-0 left-0 right-0 z-50 w-full rounded-t-[22px] bg-white shadow-2xl'
            : 'fixed left-1/2 top-1/2 z-50 w-full max-w-[460px] rounded-2xl bg-white shadow-2xl'
        }
      >
        {/* Drag handle — mobile only */}
        {isMobile && (
          <div className="flex justify-center pb-1 pt-3">
            <div className="h-1 w-10 rounded-full bg-[#D1D5DB]" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-2 sm:px-6 sm:pt-5">
          <h2 className="text-base font-semibold text-[#111827]">
            {isEdit ? 'Edit task' : 'New task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#9CA3AF] transition hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="h-px bg-[#F3F4F6]" />

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-4 px-5 py-4 sm:px-6">

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                ref={titleInputRef}
                name="title"
                value={form.title}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={255}
                placeholder="What needs to be done?"
                autoComplete="off"
                className={[
                  'w-full rounded-xl border bg-[#F9FAFB] px-3.5 py-2.5 text-sm text-[#111827]',
                  'outline-none placeholder:text-[#9CA3AF] transition focus:bg-white focus:ring-2',
                  showError('title')
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-[#E5E7EB] focus:border-[#5B5BD6] focus:ring-[#5B5BD6]/10',
                ].join(' ')}
              />
              {showError('title') && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Add details (optional)"
                className="w-full resize-y rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2.5 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] transition focus:border-[#5B5BD6] focus:bg-white focus:ring-2 focus:ring-[#5B5BD6]/10"
              />
            </div>

            {/* Priority */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-[#374151]">Priority</p>
              <div className="grid grid-cols-3 gap-2">
                {priorityOptions.map((opt) => {
                  const active = form.priority === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handlePrioritySelect(opt.value)}
                      className={[
                        'rounded-xl border py-2 text-sm font-medium transition',
                        active
                          ? `${opt.activeClass} ring-2 ring-offset-1 ring-[#5B5BD6]`
                          : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280] hover:bg-[#F3F4F6]',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#374151]">
                <svg className="h-4 w-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Deadline
              </label>
              <input
                type="datetime-local"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                onBlur={handleBlur}
                className={[
                  'w-full rounded-xl border bg-[#F9FAFB] px-3.5 py-2.5 text-sm text-[#111827]',
                  'outline-none transition focus:bg-white focus:ring-2',
                  showError('deadline')
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-[#E5E7EB] focus:border-[#5B5BD6] focus:ring-[#5B5BD6]/10',
                ].join(' ')}
              />
              {showError('deadline') && (
                <p className="mt-1 text-xs text-red-600">{errors.deadline}</p>
              )}
            </div>

            {/* Reminder */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#374151]">
                <svg className="h-4 w-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Reminder
              </label>
              <input
                type="datetime-local"
                name="reminder_time"
                value={form.reminder_time}
                onChange={handleChange}
                onBlur={handleBlur}
                className={[
                  'w-full rounded-xl border bg-[#F9FAFB] px-3.5 py-2.5 text-sm text-[#111827]',
                  'outline-none transition focus:bg-white focus:ring-2',
                  showError('reminder_time')
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-[#E5E7EB] focus:border-[#5B5BD6] focus:ring-[#5B5BD6]/10',
                ].join(' ')}
              />
              {showError('reminder_time') && (
                <p className="mt-1 text-xs text-red-600">{errors.reminder_time}</p>
              )}
            </div>
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 border-t border-[#F3F4F6] bg-white px-5 py-4 sm:px-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#E5E7EB] bg-white py-2.5 text-sm font-medium text-[#374151] transition hover:bg-[#F9FAFB] active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-[#5B5BD6] py-2.5 text-sm font-medium text-white transition hover:bg-[#4F4FCC] active:scale-95 disabled:opacity-60"
              >
                {loading ? 'Saving…' : isEdit ? 'Update task' : 'Create task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}