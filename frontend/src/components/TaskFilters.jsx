export default function TaskFilters({ filters, onChange, onClear, loading, hasActiveFilters }) {
  return (
    <section className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-[#111827]">Search</span>
            <input
              name="search"
              type="search"
              value={filters.search}
              onChange={onChange}
              disabled={loading}
              placeholder="Search tasks"
              className="mt-2 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm outline-none focus:border-[#5B5BD6] focus:ring-2 focus:ring-[#5B5BD6]/10"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#111827]">Status</span>
            <select
              name="status"
              value={filters.status}
              onChange={onChange}
              disabled={loading}
              className="mt-2 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm outline-none focus:border-[#5B5BD6] focus:ring-2 focus:ring-[#5B5BD6]/10"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#111827]">Priority</span>
            <select
              name="priority"
              value={filters.priority}
              onChange={onChange}
              disabled={loading}
              className="mt-2 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm outline-none focus:border-[#5B5BD6] focus:ring-2 focus:ring-[#5B5BD6]/10"
            >
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={onClear}
          disabled={loading || !hasActiveFilters}
          className="rounded-2xl border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition hover:border-[#9CA3AF] hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear filters
        </button>
      </div>
    </section>
  )
}
