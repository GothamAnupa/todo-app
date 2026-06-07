import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { taskService } from '../services/taskService'
import { filterTasksByTitle } from '../utils/taskHelpers'
import { useDebounce } from './useDebounce'
import { useToast } from './useToast'

const DEFAULT_FILTERS = {
  status: '',
  priority: '',
  search: '',
  sort_by: 'created_at',
  order: 'desc',
  offset: 0,
  limit: 50,
}

const POLL_INTERVAL = 60 * 1000

export function useTasks() {
  const toast = useToast()
  const [tasks, setTasks]               = useState([])
  const [total, setTotal]               = useState(0)
  const [filters, setFilters]           = useState(DEFAULT_FILTERS)
  const [loading, setLoading]           = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError]               = useState(null)
  const [retryToken, setRetryToken]     = useState(0)
  const notifiedRef                     = useRef(new Set())

  // Keep a ref to toast so fetchTasks doesn't need it as a dep
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast }, [toast])

  // Keep a ref to filters so fetchTasks can read latest value without
  // being recreated every time filters change
  const filtersRef = useRef(filters)
  useEffect(() => { filtersRef.current = filters }, [filters])

  const debouncedSearch = useDebounce(filters.search, 400)

  // ── Reminder helpers ──────────────────────────────────────────────
  const showNotification = useCallback(async (task) => {
    const title = `Reminder: ${task.title}`
    const body  = task.description || (task.deadline ? `Due ${new Date(task.deadline).toLocaleString()}` : '')
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body })
        } else if (Notification.permission === 'default') {
          const perm = await Notification.requestPermission()
          if (perm === 'granted') new Notification(title, { body })
          else toastRef.current.info(title)
        } else {
          toastRef.current.info(title)
        }
      } else {
        toastRef.current.info(title)
      }
    } catch {
      toastRef.current.info(title)
    }
  }, [])

  const processReminders = useCallback(async (taskList) => {
    const now = Date.now()
    const due = taskList.filter((t) => {
      if (!t || t.status === 'completed' || !t.reminder_time || t.is_reminded) return false
      const rt = new Date(t.reminder_time).getTime()
      return !Number.isNaN(rt) && rt <= now
    })
    for (const task of due) {
      if (notifiedRef.current.has(task.id)) continue
      try {
        await showNotification(task)
        await taskService.markReminded(task.id)
        notifiedRef.current.add(task.id)
        setTasks((cur) => cur.map((c) => c.id === task.id ? { ...c, is_reminded: true } : c))
      } catch (err) {
        console.warn('Failed to notify/mark task', task.id, err)
      }
    }
  }, [showNotification])

  // ── Core fetch ────────────────────────────────────────────────────
  // FIX: fetchTasks reads filters from filtersRef (stable ref) instead
  // of depending on filters/buildParams directly — breaks the infinite loop
  const fetchTasks = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError(null)

    // Build params from the ref so this callback stays stable
    const f = filtersRef.current
    const params = {
      sort_by: f.sort_by,
      order:   f.order,
      offset:  f.offset,
      limit:   f.limit,
      ...(f.status   ? { status:   f.status   } : {}),
      ...(f.priority ? { priority: f.priority } : {}),
    }

    try {
      const data = await taskService.getTasks(params)
      setTasks(data.tasks ?? [])
      setTotal(data.total ?? 0)
      try {
        const incoming = data.tasks ?? []
        if (incoming.length) processReminders(incoming)
      } catch (err) {
        console.warn('Reminder processing failed', err)
      }
    } catch (err) {
      const message = err?.message ?? 'Failed to load tasks'
      setError(message)
      if (!silent) toastRef.current.error(message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [processReminders]) // no filters/toast dep → stable reference

  // ── Effects ───────────────────────────────────────────────────────
  // Re-fetch when filter fields that require a server round-trip change
  useEffect(() => {
    fetchTasks()
  }, [
    filters.status,
    filters.priority,
    filters.sort_by,
    filters.order,
    filters.offset,
    filters.limit,
    retryToken,
    fetchTasks,
  ])

  // Polling
  useEffect(() => {
    const id = setInterval(() => fetchTasks({ silent: true }), POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchTasks])

  // ── Client-side search filter ─────────────────────────────────────
  const displayedTasks = useMemo(
    () => filterTasksByTitle(tasks, debouncedSearch),
    [tasks, debouncedSearch],
  )

  // ── Actions ───────────────────────────────────────────────────────
  const retry = useCallback(() => setRetryToken((v) => v + 1), [])

  const updateFilters = useCallback((patch) => {
    setFilters((cur) => ({ ...cur, ...patch }))
  }, [])

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  const createTask = useCallback(async (payload) => {
    setActionLoading(true)
    setError(null)
    try {
      const created = await taskService.createTask(payload)
      await fetchTasks({ silent: true })
      toastRef.current.success('Task created successfully')
      return created
    } catch (err) {
      setError(err.message)
      toastRef.current.error(err.message)
      throw err
    } finally {
      setActionLoading(false)
    }
  }, [fetchTasks])

  const updateTask = useCallback(async (taskId, payload) => {
    setActionLoading(true)
    setError(null)
    try {
      const updated = await taskService.updateTask(taskId, payload)
      await fetchTasks({ silent: true })
      toastRef.current.success('Task updated successfully')
      return updated
    } catch (err) {
      setError(err.message)
      toastRef.current.error(err.message)
      throw err
    } finally {
      setActionLoading(false)
    }
  }, [fetchTasks])

  const completeTask = useCallback(async (taskId) => {
    const snapshot = tasks
    setTasks((cur) => cur.map((t) => t.id === taskId ? { ...t, status: 'completed' } : t))
    try {
      await taskService.completeTask(taskId)
      await fetchTasks({ silent: true })
      toastRef.current.success('Task marked as completed')
    } catch (err) {
      setTasks(snapshot)
      setError(err.message)
      toastRef.current.error(err.message)
      throw err
    }
  }, [tasks, fetchTasks])

  const deleteTask = useCallback(async (taskId) => {
    const snapshot = tasks
    setTasks((cur) => cur.filter((t) => t.id !== taskId))
    setTotal((v) => Math.max(0, v - 1))
    try {
      await taskService.deleteTask(taskId)
      await fetchTasks({ silent: true })
      toastRef.current.success('Task deleted')
    } catch (err) {
      setTasks(snapshot)
      await fetchTasks({ silent: true })
      setError(err.message)
      toastRef.current.error(err.message)
      throw err
    }
  }, [tasks, fetchTasks])

  return {
    tasks,
    displayedTasks,
    total,
    filters,
    loading,
    actionLoading,
    error,
    setError,
    updateFilters,
    clearFilters,
    fetchTasks,
    retry,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
  }
}