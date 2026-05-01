import { useState, useRef } from 'react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { explainText } from '../../services/aiService'

function PdfViewer({ file, onAddNote, notes, activeNoteId, onHighlightClick, pageElRefs, aiSettings }) {
  const [numPages, setNumPages] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const containerRef = useRef(null)
  const localPageRefs = useRef({})

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
  }

  function handleMouseUp(e) {
    setTimeout(() => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()
      if (!selectedText || selectedText.length < 3) { setTooltip(null); return }

      const range = selection.getRangeAt(0)
      const clientRects = Array.from(range.getClientRects())
      let pageIndex = 0
      let relativeRects = []

      Object.entries(localPageRefs.current).forEach(([idx, pageEl]) => {
        if (!pageEl) return
        const pageBox = pageEl.getBoundingClientRect()
        const rectsOnThisPage = clientRects
          .filter(r => r.top >= pageBox.top - 10 && r.bottom <= pageBox.bottom + 10)
          .map(r => ({
            top: r.top - pageBox.top,
            left: r.left - pageBox.left,
            width: r.width,
            height: r.height,
          }))
        if (rectsOnThisPage.length > 0) {
          pageIndex = parseInt(idx)
          relativeRects = rectsOnThisPage
        }
      })

      setTooltip({ x: e.clientX, y: e.clientY, text: selectedText, rects: relativeRects, pageIndex })
    }, 100)
  }

  async function handleAddNote() {
    if (!tooltip?.text) return

    const { text, rects, pageIndex } = tooltip
    window.getSelection().removeAllRanges()
    setTooltip(null)
    setLoadingAi(true)

    let aiExplanation = ''
    try {
      if (!aiSettings?.provider) throw new Error('Open ⚙️ AI Settings and configure your provider first.')
      aiExplanation = await explainText(text, aiSettings)
    } catch (err) {
      aiExplanation = `⚠️ ${err.message}`
    }

    setLoadingAi(false)
    onAddNote(text, rects, pageIndex, aiExplanation)
  }

  function getHighlightsForPage(pageIndex) {
    return notes.filter(n => n.pageIndex === pageIndex && n.rects?.length > 0)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }} onMouseUp={handleMouseUp}>

      {/* Loading toast */}
      {loadingAi && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: '#1f2937', color: 'white',
          borderRadius: '999px', padding: '10px 20px', fontSize: '13px', fontWeight: '500',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}>
          ⏳ AI is explaining...
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', top: tooltip.y - 70, left: tooltip.x - 50,
          zIndex: 9999, background: '#1f2937', color: 'white',
          borderRadius: '8px', padding: '8px 12px',
          display: 'flex', gap: '8px', alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'all',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleAddNote() }}
            style={{ color: '#93c5fd', fontSize: '13px', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600 }}
          >
            ✨ Explain + Add Note
          </button>
          <span style={{ color: '#4b5563' }}>|</span>
          <button
            onMouseDown={(e) => { e.preventDefault(); setTooltip(null) }}
            style={{ color: '#9ca3af', fontSize: '12px', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            ✕
          </button>
        </div>
      )}

      <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`page_${index + 1}`}
              data-page-index={index}
              style={{ position: 'relative', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', marginBottom: '8px' }}
              ref={(el) => {
                localPageRefs.current[index] = el
                if (pageElRefs) pageElRefs.current[index] = el
              }}
            >
              <Page pageNumber={index + 1} width={580} renderTextLayer={true} renderAnnotationLayer={false} />

              {getHighlightsForPage(index).map((note) =>
                note.rects.map((rect, i) => {
                  const isActive = activeNoteId === note.id
                  return (
                    <div
                      key={`${note.id}-${i}`}
                      onClick={() => onHighlightClick(note.id, note.pageIndex)}
                      style={{
                        position: 'absolute',
                        top: rect.top, left: rect.left,
                        width: rect.width, height: rect.height,
                        background: isActive ? 'rgba(251,191,36,0.5)' : 'rgba(253,224,71,0.2)',
                        border: isActive ? '1px solid rgba(251,191,36,0.7)' : 'none',
                        pointerEvents: 'all', zIndex: 5,
                        borderRadius: '2px', cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                    />
                  )
                })
              )}
            </div>
          ))}
        </div>
      </Document>
    </div>
  )
}

export default PdfViewer