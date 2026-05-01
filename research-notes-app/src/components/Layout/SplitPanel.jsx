import { useState, useRef } from 'react'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'

function SplitPanel({ file, aiSettings }) {
  const [notes, setNotes] = useState([])
  const [activeNoteId, setActiveNoteId] = useState(null)
  const leftScrollRef = useRef(null)
  const rightScrollRef = useRef(null)
  const noteCardRefs = useRef({})
  const pageElRefs = useRef({})

  function handleAddNote(highlightedText, rects, pageIndex, aiExplanation) {
    const newNote = {
      id: Date.now(),
      highlight: highlightedText,
      rects,
      pageIndex,
      aiExplanation: aiExplanation || '',
      userNote: '',
      timestamp: new Date().toLocaleTimeString(),
    }
    setNotes((prev) => [newNote, ...prev])
    setActiveNoteId(newNote.id)
  }

  function handleDeleteNote(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setActiveNoteId(null)
  }

  function handleHighlightClick(noteId) {
    setActiveNoteId(noteId)
    setTimeout(() => {
      const noteCard = noteCardRefs.current[noteId]
      const rightContainer = rightScrollRef.current
      if (noteCard && rightContainer) {
        rightContainer.scrollTo({ top: noteCard.offsetTop - 80, behavior: 'smooth' })
      }
    }, 50)
  }

  function handleNoteClick(noteId, pageIndex) {
    setActiveNoteId(noteId)
    setTimeout(() => {
      const pageEl = pageElRefs.current[pageIndex]
      const leftContainer = leftScrollRef.current
      if (pageEl && leftContainer) {
        leftContainer.scrollTo({ top: pageEl.offsetTop - 80, behavior: 'smooth' })
      }
    }, 50)
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Left: PDF */}
      <div
        ref={leftScrollRef}
        style={{ width: '62%', height: '100%', overflowY: 'auto', background: '#f3f4f6', borderRight: '1px solid #e5e7eb' }}
      >
        <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Research Paper</span>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <LeftPanel
            file={file}
            onAddNote={handleAddNote}
            notes={notes}
            activeNoteId={activeNoteId}
            onHighlightClick={handleHighlightClick}
            pageElRefs={pageElRefs}
            aiSettings={aiSettings}
          />
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '3px', background: '#e5e7eb', flexShrink: 0 }} />

      {/* Right: Notes */}
      <div
        ref={rightScrollRef}
        style={{ width: '38%', height: '100%', overflowY: 'auto', background: '#fafafa' }}
      >
        <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Notes</span>
          <span style={{ fontSize: '11px', background: '#eff6ff', color: '#3b82f6', fontWeight: '600', padding: '2px 8px', borderRadius: '999px' }}>{notes.length}</span>
        </div>
        <RightPanel
          notes={notes}
          onDeleteNote={handleDeleteNote}
          activeNoteId={activeNoteId}
          onNoteClick={handleNoteClick}
          noteCardRefs={noteCardRefs}
        />
      </div>

    </div>
  )
}

export default SplitPanel