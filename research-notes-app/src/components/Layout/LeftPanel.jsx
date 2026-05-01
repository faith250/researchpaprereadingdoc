import PdfViewer from '../PdfViewer/PdfViewer'

function LeftPanel({ file, onAddNote, notes, activeNoteId, onHighlightClick, pageElRefs, aiSettings }) {
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
        />
      ) : (
        <p style={{ color: '#9ca3af', marginTop: '80px' }}>No paper loaded</p>
      )}
    </div>
  )
}

export default LeftPanel