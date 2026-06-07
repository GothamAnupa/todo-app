import { useMemo, useState } from 'react'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'
import TaskCard from '../components/TaskCard'
import TaskFilters from '../components/TaskFilters'
import TaskFormModal from '../components/TaskFormModal'
import TaskSkeleton from '../components/TaskSkeleton'
import TaskStats from '../components/TaskStats'
import { useTasks } from '../hooks/useTasks'
import { computeTaskStats } from '../utils/taskHelpers'

export default function TaskListPage() {
  const {
    tasks,
    displayedTasks,
    total,
    filters,
    loading,
    actionLoading,
    error,
    updateFilters,
    clearFilters,
    retry,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
  } = useTasks()

  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const stats = useMemo(() => computeTaskStats(tasks), [tasks])

  const hasActiveFilters = Boolean(
    filters.status || filters.priority || filters.search || filters.order !== 'desc',
  )

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    updateFilters({ [name]: value })
  }

  const handleOpenCreateModal = () => {
    setEditingTask(null)
    setFormModalOpen(true)
  }

  const handleOpenEditModal = (task) => {
    setEditingTask(task)
    setFormModalOpen(true)
  }

  const handleCreate = async (payload) => {
    await createTask(payload)
  }

  const handleUpdate = async (payload) => {
    if (!editingTask) return
    await updateTask(editingTask.id, payload)
    setEditingTask(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteTask(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCloseModal = () => {
    setFormModalOpen(false)
    setEditingTask(null)
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Stats */}
      <TaskStats stats={stats} />

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
        loading={loading}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Tasks Section */}
      <section className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-600 text-[#111827]">Your tasks</h2>
          <p className="text-sm text-[#6B7280]">
            {displayedTasks.length} of {total} tasks
          </p>
        </div>

        {/* Task List or Empty/Loading State */}
        {loading ? (
          <TaskSkeleton count={4} />
        ) : displayedTasks.length === 0 ? (
          <EmptyState
            title={tasks.length ? 'No matching tasks' : 'No tasks yet'}
            message={
              tasks.length
                ? 'Try clearing filters or changing your search query.'
                : 'Create your first task to get started!'
            }
            actionLabel={tasks.length ? 'Clear filters' : 'Create a task'}
            onAction={tasks.length ? clearFilters : handleOpenCreateModal}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {displayedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={completeTask}
                onEdit={handleOpenEditModal}
                onDelete={setDeleteTarget}
                disabled={actionLoading || deleteLoading}
              />
            ))}
          </div>
        )}
      </section>

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={handleOpenCreateModal}
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#5B5BD6] text-white shadow-lg hover:bg-[#4F4FCC] hover:shadow-xl transition z-40"
        title="Create new task"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Modals */}
      <TaskFormModal
        mode={editingTask ? 'edit' : 'create'}
        initialTask={editingTask}
        open={formModalOpen}
        onClose={handleCloseModal}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        loading={actionLoading}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete task?"
        message={
          deleteTarget
            ? `This will permanently delete "${deleteTarget.title}".`
            : ''
        }
        confirmLabel="Delete"
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
