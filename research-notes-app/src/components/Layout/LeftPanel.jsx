import PdfViewer from '../PdfViewer/PdfViewer'

function LeftPanel({ file, onAddNote, notes, activeNoteId, onHighlightClick, pageElRefs, aiSettings, onPaperLoaded, paperSummary }) {
  return (
    <div>
      {file ? (
        <PdfViewer
          file={file}
          onAddNote={onAddNote}
          notes={notes}
          activeNoteId={activeNoteId}
          onHighlightClick={onHighlightClick}
          pageElRefs={pageElRefs}
          aiSettings={aiSettings}
          onPaperLoaded={onPaperLoaded}
          paperSummary={paperSummary}
        />
      ) : (
        <p style={{ color: '#9ca3af', marginTop: '80px' }}>No paper loaded</p>
      )}
    </div>
  )
}

export default LeftPanel
