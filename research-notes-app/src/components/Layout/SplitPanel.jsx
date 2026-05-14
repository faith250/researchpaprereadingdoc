import { useState, useRef, useEffect, useCallback } from 'react'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import { exportAsPDF, exportAsDocx, exportAsMarkdown, exportPaperWithNotes } from '../../utils/exportNotes'
import { isDriveConnected, syncNotesToDrive } from '../../services/driveService'
import { paperKey } from '../../utils/paperStore'
import { summarizePaper, generalAsk } from '../../services/aiService'

// Unique localStorage key per PDF (name + size combo)
function storageKey(file) {
  return `research-notes::${file.name}::${file.size}`
}
function summaryStorageKey(file) {
  return `research-summary::${file.name}::${file.size}`
}

function SplitPanel({ file, aiSettings }) {
  // ── Notes state — loaded from localStorage on first render ──
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey(file))
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [activeNoteId, setActiveNoteId] = useState(null)
  const [searchQuery, setSearchQuery]   = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exportLoading, setExportLoading]   = useState(null) // 'pdf' | 'docx' | 'md' | null

  // ── Paper context state ──
  const [paperFullText, setPaperFullText]   = useState('')
  const [paperSummary, setPaperSummary]     = useState(() => {
    // Load cached summary from localStorage
    try {
      return localStorage.getItem(summaryStorageKey(file)) || ''
    } catch { return '' }
  })
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [generalAskLoading, setGeneralAskLoading] = useState(false)

  const leftScrollRef   = useRef(null)
  const rightScrollRef  = useRef(null)
  const noteCardRefs    = useRef({})
  const pageElRefs      = useRef({})
  const exportMenuRef   = useRef(null)

  // ── Auto-save to localStorage + optionally Drive on every notes change ──
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(file), JSON.stringify(notes))
    } catch (e) {
      console.warn('Could not save notes to localStorage:', e)
    }
    // Drive sync (fire-and-forget, errors are non-fatal)
    if (isDriveConnected()) {
      syncNotesToDrive(paperKey(file), notes).catch(() => {})
    }
  }, [notes, file])

  // ── Close export menu when clicking outside ──
  useEffect(() => {
    function handleClickOutside(e) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Paper loaded callback: full text extracted from all pages ──
  const handlePaperLoaded = useCallback(async (fullText) => {
    setPaperFullText(fullText)

    // Check if we already have a cached summary
    const cached = localStorage.getItem(summaryStorageKey(file))
    if (cached) {
      setPaperSummary(cached)
      return
    }

    // No cached summary — generate one now
    if (!aiSettings?.provider || !fullText) return
    setSummaryLoading(true)
    try {
      const summary = await summarizePaper(fullText, aiSettings)
      setPaperSummary(summary)
      try {
        localStorage.setItem(summaryStorageKey(file), summary)
      } catch { /* storage full */ }
    } catch (err) {
      console.warn('Paper summarization failed:', err.message)
      // Not fatal — app works fine without a summary
    }
    setSummaryLoading(false)
  }, [file, aiSettings]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Note operations ──
  function handleAddNote(highlightedText, rects, pageIndex, aiExplanation, question, image = null) {
    const newNote = {
      id: Date.now(),
      type: 'highlight',
      highlight: highlightedText,
      rects,
      pageIndex,
      question: question || null,        // null = explain, string = ask
      aiExplanation: aiExplanation || '',
      image: image || null,              // base64 data URL for attached image
      userNote: '',
      timestamp: new Date().toLocaleTimeString(),
    }
    setNotes((prev) => [newNote, ...prev])
    setActiveNoteId(newNote.id)
  }

  // ── General ask (chat with paper, no highlight required) ──
  const handleGeneralAsk = useCallback(async (question) => {
    if (!question.trim() || !aiSettings?.provider) return
    setGeneralAskLoading(true)

    let aiAnswer = ''
    try {
      aiAnswer = await generalAsk(question, aiSettings, paperSummary, paperFullText)
    } catch (err) {
      aiAnswer = `⚠️ ${err.message}`
    }

    setGeneralAskLoading(false)

    const newNote = {
      id: Date.now(),
      type: 'general',
      highlight: '',
      rects: [],
      pageIndex: null,
      question,
      aiExplanation: aiAnswer,
      userNote: '',
      timestamp: new Date().toLocaleTimeString(),
    }
    setNotes((prev) => [newNote, ...prev])
    setActiveNoteId(newNote.id)
  }, [aiSettings, paperSummary, paperFullText])

  function handleDeleteNote(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setActiveNoteId(null)
  }

  // Proper controlled update — triggers auto-save via useEffect
  const handleUpdateNote = useCallback((id, userNote) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, userNote } : n)))
  }, [])

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
    if (pageIndex === null) return
    setTimeout(() => {
      const pageEl = pageElRefs.current[pageIndex]
      const leftContainer = leftScrollRef.current
      if (pageEl && leftContainer) {
        leftContainer.scrollTo({ top: pageEl.offsetTop - 80, behavior: 'smooth' })
      }
    }, 50)
  }

  // ── Export ──
  async function handleExport(format) {
    if (notes.length === 0) return
    setShowExportMenu(false)
    setExportLoading(format)
    try {
      if (format === 'pdf') exportAsPDF(notes, file.name)
      else if (format === 'combined') await exportPaperWithNotes(notes, file)
      else if (format === 'md') exportAsMarkdown(notes, file.name)
      else if (format === 'docx') await exportAsDocx(notes, file.name)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    }
    setExportLoading(null)
  }

  // ── Search filter ──
  const filteredNotes = searchQuery.trim()
    ? notes.filter(
        (n) =>
          (n.highlight && n.highlight.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (n.userNote && n.userNote.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (n.aiExplanation && n.aiExplanation.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (n.question && n.question.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : notes

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Left: PDF ── */}
      <div
        ref={leftScrollRef}
        style={{ width: '62%', height: '100%', overflowY: 'auto', background: '#f3f4f6', borderRight: '1px solid #e5e7eb' }}
      >
        <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Research Paper</span>
          {summaryLoading && (
            <span style={{
              fontSize: '11px', color: '#8b5cf6', background: '#f5f3ff',
              padding: '2px 8px', borderRadius: '999px', fontWeight: '500',
            }}>
              ⏳ Reading paper…
            </span>
          )}
          {paperSummary && !summaryLoading && (
            <span style={{
              fontSize: '11px', color: '#059669', background: '#f0fdf4',
              padding: '2px 8px', borderRadius: '999px', fontWeight: '500',
            }}>
              ✓ Paper context ready
            </span>
          )}
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
            onPaperLoaded={handlePaperLoaded}
            paperSummary={paperSummary}
          />
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '3px', background: '#e5e7eb', flexShrink: 0 }} />

      {/* ── Right: Notes ── */}
      <div
        ref={rightScrollRef}
        style={{ width: '38%', height: '100%', overflowY: 'auto', background: '#fafafa', display: 'flex', flexDirection: 'column' }}
      >
        {/* Right header */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexShrink: 0,
        }}>
          {/* Row 1: title + count + export */}
          <div style={{ padding: '10px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Notes</span>
              <span style={{ fontSize: '11px', background: '#eff6ff', color: '#3b82f6', fontWeight: '600', padding: '2px 8px', borderRadius: '999px' }}>
                {notes.length}
              </span>
              {notes.length > 0 && (
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '500' }}>
                  ✓ saved
                </span>
              )}
            </div>

            {/* Export button + dropdown */}
            <div ref={exportMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => notes.length > 0 && setShowExportMenu((v) => !v)}
                disabled={notes.length === 0}
                style={{
                  fontSize: '12px', padding: '5px 10px', borderRadius: '7px',
                  border: '1px solid #e5e7eb',
                  background: notes.length === 0 ? '#f9fafb' : 'white',
                  cursor: notes.length === 0 ? 'not-allowed' : 'pointer',
                  color: notes.length === 0 ? '#d1d5db' : '#374151',
                  fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px',
                  transition: 'all 0.15s',
                }}
              >
                {exportLoading ? '⏳' : '⬇️'} Export ▾
              </button>

              {showExportMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                  background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '220px',
                  overflow: 'hidden',
                }}>
                  {[
                    { format: 'combined', icon: '📰', label: 'Paper + Notes PDF', sub: 'Side-by-side, one page per annotation' },
                    { format: 'pdf', icon: '📄', label: 'Notes only PDF', sub: 'Formatted notes without paper' },
                    { format: 'docx', icon: '📝', label: 'Export as Word', sub: '.docx file' },
                    { format: 'md', icon: '🗒️', label: 'Export as Markdown', sub: '.md file' },
                  ].map(({ format, icon, label, sub }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 14px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', gap: '1px',
                        borderBottom: format !== 'md' ? '1px solid #f3f4f6' : 'none',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{icon} {label}</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Search bar */}
          <div style={{ padding: '0 12px 10px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '13px', color: '#9ca3af', pointerEvents: 'none',
              }}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search highlights, notes…"
                style={{
                  width: '100%', fontSize: '12px', padding: '6px 10px 6px 28px',
                  border: '1px solid #e5e7eb', borderRadius: '8px',
                  outline: 'none', background: '#f9fafb',
                  color: '#374151', fontFamily: 'inherit',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = 'white' }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '12px', color: '#9ca3af', lineHeight: 1,
                  }}
                >✕</button>
              )}
            </div>
            {searchQuery && (
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 2px 0' }}>
                {filteredNotes.length} of {notes.length} notes match
              </p>
            )}
          </div>
        </div>

        {/* Notes list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <RightPanel
            notes={filteredNotes}
            onDeleteNote={handleDeleteNote}
            activeNoteId={activeNoteId}
            onNoteClick={handleNoteClick}
            noteCardRefs={noteCardRefs}
            onUpdateNote={handleUpdateNote}
            searchQuery={searchQuery}
            onGeneralAsk={handleGeneralAsk}
            generalAskLoading={generalAskLoading}
            summaryLoading={summaryLoading}
            paperSummary={paperSummary}
          />
        </div>
      </div>

    </div>
  )
}

export default SplitPanel
