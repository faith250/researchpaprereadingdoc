import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { explainText, askQuestion } from '../../services/aiService'

function PdfViewer({ file, onAddNote, notes, activeNoteId, onHighlightClick, pageElRefs, aiSettings, onPaperLoaded, paperSummary }) {
  const [numPages, setNumPages]         = useState(null)
  const [tooltip, setTooltip]           = useState(null)  // { x, y, text, rects, pageIndex }
  const [tooltipMode, setTooltipMode]   = useState('buttons') // 'buttons' | 'ask'
  const [askInput, setAskInput]         = useState('')
  const [loadingAi, setLoadingAi]       = useState(false)
  const [loadingLabel, setLoadingLabel] = useState('')

  const containerRef   = useRef(null)
  const localPageRefs  = useRef({})
  const pdfDocRef      = useRef(null)   // PDFDocumentProxy from react-pdf
  const pageTextsRef   = useRef({})     // cache: { pageIndex -> extracted text }
  const askInputRef    = useRef(null)
  const fullTextRef    = useRef('')     // accumulated full paper text

  // ── Document loaded ──────────────────────────────────────────────────────
  function onDocumentLoadSuccess(pdf) {
    setNumPages(pdf.numPages)
    pdfDocRef.current = pdf
    pageTextsRef.current = {}
    fullTextRef.current = ''
  }

  // ── Eagerly extract ALL pages when numPages is known ─────────────────────
  useEffect(() => {
    if (!numPages || !pdfDocRef.current) return
    let cancelled = false

    async function extractAll() {
      const parts = []
      for (let i = 0; i < numPages; i++) {
        if (cancelled) return
        try {
          const page = await pdfDocRef.current.getPage(i + 1)
          const content = await page.getTextContent()
          const text = content.items.map((item) => item.str).join(' ')
          pageTextsRef.current[i] = text.slice(0, 3000)
          parts.push(text)
        } catch {
          pageTextsRef.current[i] = ''
        }
      }
      if (!cancelled) {
        fullTextRef.current = parts.join('\n\n')
        if (onPaperLoaded) onPaperLoaded(fullTextRef.current)
      }
    }

    extractAll()
    return () => { cancelled = true }
  }, [numPages]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Extract text from a single page (cached) ─────────────────────────────
  async function getPageText(pageIndex) {
    if (pageTextsRef.current[pageIndex] !== undefined) {
      return pageTextsRef.current[pageIndex]
    }
    try {
      const page = await pdfDocRef.current.getPage(pageIndex + 1)
      const content = await page.getTextContent()
      const text = content.items.map((item) => item.str).join(' ')
      pageTextsRef.current[pageIndex] = text.slice(0, 3000)
    } catch {
      pageTextsRef.current[pageIndex] = ''
    }
    return pageTextsRef.current[pageIndex]
  }

  // ── Text selection → tooltip ─────────────────────────────────────────────
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
        const onPage = clientRects.filter(
          (r) => r.top >= pageBox.top - 10 && r.bottom <= pageBox.bottom + 10,
        ).map((r) => ({
          top: r.top - pageBox.top,
          left: r.left - pageBox.left,
          width: r.width,
          height: r.height,
        }))
        if (onPage.length > 0) { pageIndex = parseInt(idx); relativeRects = onPage }
      })

      setTooltip({ x: e.clientX, y: e.clientY, text: selectedText, rects: relativeRects, pageIndex })
      setTooltipMode('buttons')
      setAskInput('')
    }, 100)
  }

  // ── Explain ──────────────────────────────────────────────────────────────
  async function handleExplain() {
    if (!tooltip?.text) return
    const { text, rects, pageIndex } = tooltip
    window.getSelection().removeAllRanges()
    setTooltip(null)
    setLoadingAi(true)
    setLoadingLabel('AI is explaining…')

    let aiExplanation = ''
    try {
      if (!aiSettings?.provider) throw new Error('Open ⚙️ AI Settings and configure your provider first.')
      const pageContext = await getPageText(pageIndex)
      aiExplanation = await explainText(text, aiSettings, pageContext, paperSummary || '')
    } catch (err) {
      aiExplanation = `⚠️ ${err.message}`
    }

    setLoadingAi(false)
    onAddNote(text, rects, pageIndex, aiExplanation, null)
  }

  // ── Ask ──────────────────────────────────────────────────────────────────
  function handleOpenAsk() {
    setTooltipMode('ask')
    setAskInput('')
    setTimeout(() => askInputRef.current?.focus(), 50)
  }

  async function handleAsk() {
    if (!tooltip?.text || !askInput.trim()) return
    const { text, rects, pageIndex } = tooltip
    const question = askInput.trim()
    window.getSelection().removeAllRanges()
    setTooltip(null)
    setLoadingAi(true)
    setLoadingLabel('AI is answering…')

    let aiAnswer = ''
    try {
      if (!aiSettings?.provider) throw new Error('Open ⚙️ AI Settings and configure your provider first.')
      const pageContext = await getPageText(pageIndex)
      aiAnswer = await askQuestion(question, text, aiSettings, pageContext, paperSummary || '')
    } catch (err) {
      aiAnswer = `⚠️ ${err.message}`
    }

    setLoadingAi(false)
    onAddNote(text, rects, pageIndex, aiAnswer, question)
  }

  // ── Highlights ───────────────────────────────────────────────────────────
  function getHighlightsForPage(pageIndex) {
    return notes.filter((n) => n.pageIndex === pageIndex && n.rects?.length > 0)
  }

  // ── Tooltip dismiss on Esc ───────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setTooltip(null)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative' }} onMouseUp={handleMouseUp} onKeyDown={handleKeyDown}>

      {/* ── Loading toast ── */}
      {loadingAi && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: '#1f2937', color: 'white',
          borderRadius: '999px', padding: '10px 20px', fontSize: '13px', fontWeight: '500',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          animation: 'fadeIn 0.2s ease',
        }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
          {loadingLabel}
        </div>
      )}

      {/* ── Tooltip ── */}
      {tooltip && (
        <div
          onMouseUp={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: tooltipMode === 'ask' ? tooltip.y - 110 : tooltip.y - 64,
            left: tooltip.x - 80,
            zIndex: 9999,
            background: '#1f2937',
            color: 'white',
            borderRadius: '12px',
            padding: tooltipMode === 'ask' ? '12px' : '8px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            pointerEvents: 'all',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            minWidth: tooltipMode === 'ask' ? '260px' : 'auto',
          }}
        >
          {tooltipMode === 'buttons' ? (
            /* ─ Buttons mode ─ */
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onMouseDown={(e) => { e.preventDefault(); handleExplain() }}
                style={{
                  color: '#93c5fd', fontSize: '13px', cursor: 'pointer',
                  background: 'none', border: 'none', fontWeight: 600, padding: '2px 0',
                }}
              >
                ✨ Explain
              </button>
              <span style={{ color: '#374151' }}>|</span>
              <button
                onMouseDown={(e) => { e.preventDefault(); handleOpenAsk() }}
                style={{
                  color: '#86efac', fontSize: '13px', cursor: 'pointer',
                  background: 'none', border: 'none', fontWeight: 600, padding: '2px 0',
                }}
              >
                💬 Ask
              </button>
              <span style={{ color: '#374151' }}>|</span>
              <button
                onMouseDown={(e) => { e.preventDefault(); setTooltip(null) }}
                style={{ color: '#9ca3af', fontSize: '12px', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                ✕
              </button>
            </div>
          ) : (
            /* ─ Ask mode ─ */
            <div>
              {/* Highlighted snippet preview */}
              <p style={{
                fontSize: '11px', color: '#9ca3af', margin: '0 0 8px',
                maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                "{tooltip.text.length > 50 ? tooltip.text.slice(0, 50) + '…' : tooltip.text}"
              </p>

              {/* Question input */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  ref={askInputRef}
                  value={askInput}
                  onChange={(e) => setAskInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAsk(); if (e.key === 'Escape') setTooltip(null) }}
                  placeholder="Ask about this text…"
                  style={{
                    flex: 1, fontSize: '13px', padding: '7px 10px',
                    borderRadius: '8px', border: '1px solid #374151',
                    background: '#111827', color: 'white',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleAsk() }}
                  disabled={!askInput.trim()}
                  style={{
                    padding: '7px 12px', borderRadius: '8px', border: 'none',
                    background: askInput.trim() ? '#3b82f6' : '#374151',
                    color: 'white', fontSize: '13px', cursor: askInput.trim() ? 'pointer' : 'default',
                    fontWeight: '600', transition: 'background 0.15s',
                  }}
                >
                  →
                </button>
              </div>

              {/* Back / close row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <button
                  onMouseDown={(e) => { e.preventDefault(); setTooltipMode('buttons') }}
                  style={{ fontSize: '11px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ← back
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); setTooltip(null) }}
                  style={{ fontSize: '11px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PDF document ── */}
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
              <Page
                pageNumber={index + 1}
                width={580}
                renderTextLayer={true}
                renderAnnotationLayer={false}
              />

              {/* Highlight overlays */}
              {getHighlightsForPage(index).map((note) =>
                note.rects.map((rect, i) => {
                  const isActive = activeNoteId === note.id
                  return (
                    <div
                      key={`${note.id}-${i}`}
                      onClick={() => onHighlightClick(note.id, note.pageIndex)}
                      title={note.question ? `Q: ${note.question}` : 'Click to jump to note'}
                      style={{
                        position: 'absolute',
                        top: rect.top, left: rect.left,
                        width: rect.width, height: rect.height,
                        background: note.question
                          ? (isActive ? 'rgba(134,239,172,0.55)' : 'rgba(134,239,172,0.25)')
                          : (isActive ? 'rgba(251,191,36,0.5)' : 'rgba(253,224,71,0.2)'),
                        border: isActive
                          ? `1px solid ${note.question ? 'rgba(134,239,172,0.8)' : 'rgba(251,191,36,0.7)'}`
                          : 'none',
                        pointerEvents: 'all', zIndex: 5,
                        borderRadius: '2px', cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                    />
                  )
                }),
              )}
            </div>
          ))}
        </div>
      </Document>
    </div>
  )
}

export default PdfViewer
