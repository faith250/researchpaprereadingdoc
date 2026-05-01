function HighlightTooltip({ position, onAddNote, onClose }) {
  if (!position) return null

  return (
    <div
      className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2 flex gap-2"
      style={{ top: position.y - 50, left: position.x - 60 }}
    >
      <button
        onClick={onAddNote}
        className="text-xs font-medium hover:text-blue-300 transition-colors"
      >
        + Add Note
      </button>
      <span className="text-gray-500">|</span>
      <button
        onClick={onClose}
        className="text-xs text-gray-400 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  )
}

export default HighlightTooltip