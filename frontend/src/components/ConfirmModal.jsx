export default function ConfirmModal({
  open,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="modal-overlay fixed inset-0 z-40 bg-black bg-opacity-30"
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        className="modal-content fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 transform"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 id="confirm-modal-title" className="text-lg font-600 text-[#111827]">
            {title}
          </h2>
          {message && <p className="mt-2 text-sm text-[#6B7280]">{message}</p>}

          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-500 text-[#111827] hover:bg-[#F9FAFB] disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-500 text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? 'Deleting...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
