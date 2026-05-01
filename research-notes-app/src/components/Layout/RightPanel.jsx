import { useEffect, useRef } from 'react'

function RightPanel({ notes, onDeleteNote, activeNoteId, onNoteClick, noteCardRefs }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {notes.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>Select text on the paper to add notes</p>
        </div>
      ) : (
        notes.map((note) => {
          const isActive = activeNoteId === note.id
          return (
            <div
              key={note.id}
              ref={(el) => (noteCardRefs.current[note.id] = el)}
              onClick={() => onNoteClick(note.id, note.pageIndex)}
              style={{
                background: 'white',
                border: isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '12px', padding: '14px', cursor: 'pointer',
                boxShadow: isActive ? '0 0 0 3px rgba(59,130,246,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '999px' }}>
                  Highlight
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>↩ Jump to page</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id) }}
                    style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: '14px' }}
                  >✕</button>
                </div>
              </div>

              <p style={{
                fontSize: '13px', color: '#374151', background: '#fefce8',
                borderLeft: '3px solid #facc15', padding: '8px 10px',
                borderRadius: '0 6px 6px 0', margin: '0 0 10px',
                fontStyle: 'italic', lineHeight: '1.5',
              }}>
                "{note.highlight}"
              </p>

             {/* AI Explanation */}
                {note.aiExplanation && (
                <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '10px',
                }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ✨ AI Explanation
                    </p>
                    <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.6' }}>
                    {note.aiExplanation}
                    </p>
                </div>
                )}


              <textarea
                placeholder="Add your thoughts..."
                defaultValue={note.userNote}
                onChange={(e) => { note.userNote = e.target.value }}
                onClick={(e) => e.stopPropagation()}
                rows={3}
                style={{
                  width: '100%', fontSize: '13px', color: '#4b5563',
                  border: '1px solid #e5e7eb', borderRadius: '8px',
                  padding: '8px', resize: 'none', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '11px', color: '#d1d5db', margin: '6px 0 0', textAlign: 'right' }}>{note.timestamp}</p>
            </div>
          )
        })
      )}
    </div>
  )
}

export default RightPanel