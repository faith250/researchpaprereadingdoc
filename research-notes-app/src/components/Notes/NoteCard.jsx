function NoteCard({ note, onDelete }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Highlight badge */}
      <div className="flex items-start justify-between mb-2 gap-2">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
          Highlight
        </span>
        <button
          onClick={() => onDelete(note.id)}
          className="text-gray-300 hover:text-red-400 transition-colors text-xs"
        >
          ✕
        </button>
      </div>

      {/* Highlighted text */}
      <p className="text-sm text-gray-700 bg-yellow-50 border-l-4 border-yellow-400 pl-3 py-1 rounded-r-md mb-3 italic">
        "{note.highlight}"
      </p>

      {/* User note input */}
      <textarea
        placeholder="Add your thoughts here..."
        defaultValue={note.userNote}
        onChange={(e) => note.userNote = e.target.value}
        className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
        rows={3}
      />

      {/* Timestamp */}
      <p className="text-xs text-gray-300 mt-2">{note.timestamp}</p>
    </div>
  )
}

export default NoteCard