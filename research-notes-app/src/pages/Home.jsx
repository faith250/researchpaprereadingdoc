import { useState, useEffect, useCallback } from 'react'
import { listPapers, deletePaper, timeAgo } from '../utils/paperStore'

// ── Paper library card ────────────────────────────────────────────────────────
function PaperCard({ paper, onContinue, onDelete, isLoading }) {
  const ext = paper.name.split('.').pop().toUpperCase()
  const displayName = paper.name.replace(/\.[^.]+$/, '')

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s, transform 0.2s',
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(59,130,246,0.15)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
      onClick={onContinue}
    >
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        title="Remove from library"
        style={{
          position: 'absolute', top: '10px', right: '10px',
          width: '22px', height: '22px',
          background: 'rgba(255,255,255,0.85)', border: '1px solid #e5e7eb',
          borderRadius: '50%', cursor: 'pointer',
          fontSize: '11px', color: '#9ca3af',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2, lineHeight: 1,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#e5e7eb' }}
      >
        ✕
      </button>

      {/* Card header — gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
        padding: '28px 20px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
      }}>
        <div style={{
          width: '44px', height: '52px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '8px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.3)',
        }}>
          <span style={{ fontSize: '16px' }}>📄</span>
          <span style={{ fontSize: '7px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em', marginTop: '2px' }}>
            {ext}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p
          title={displayName}
          style={{
            margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            lineHeight: '1.4',
          }}
        >
          {displayName}
        </p>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{
            fontSize: '12px', fontWeight: '600',
            color: paper.noteCount > 0 ? '#3b82f6' : '#9ca3af',
            background: paper.noteCount > 0 ? '#eff6ff' : '#f9fafb',
            padding: '2px 8px', borderRadius: '999px',
          }}>
            {paper.noteCount} {paper.noteCount === 1 ? 'note' : 'notes'}
          </span>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
            {timeAgo(paper.lastOpened)}
          </span>
        </div>

        {/* Continue button */}
        <button
          onClick={(e) => { e.stopPropagation(); onContinue() }}
          disabled={isLoading}
          style={{
            marginTop: 'auto',
            width: '100%', padding: '9px',
            background: isLoading ? '#e5e7eb' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: isLoading ? '#9ca3af' : 'white',
            border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'opacity 0.15s',
          }}
        >
          {isLoading ? (
            <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Opening…</>
          ) : (
            <>Continue →</>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Main Home component ───────────────────────────────────────────────────────
function Home({ onFileUpload, onOpenPaper }) {
  const [papers, setPapers]       = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [loadingKey, setLoadingKey] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // key to confirm

  useEffect(() => {
    listPapers().then(setPapers)
  }, [])

  function handleFile(file) {
    if (file && file.type === 'application/pdf') {
      onFileUpload(file)
    } else {
      alert('Please select a PDF file.')
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  const handleDragOver  = useCallback((e) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  async function handleContinue(key) {
    setLoadingKey(key)
    await onOpenPaper(key)
    setLoadingKey(null)
  }

  async function handleDelete(key) {
    await deletePaper(key)
    setPapers((prev) => prev.filter((p) => p.key !== key))
    setConfirmDelete(null)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f0f4ff 0%, #fafafa 60%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ── Top nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px',
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(229,231,235,0.8)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}>📄</div>
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>Research Notes</span>
        </div>
        <a
          href="https://github.com/your-username/research-notes-app"
          target="_blank" rel="noreferrer"
          style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}
        >
          ⭐ Star on GitHub
        </a>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Hero (only when no papers) ── */}
        {papers.length === 0 && (
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '40px', fontWeight: '800', color: '#111827', margin: '0 0 12px', letterSpacing: '-1px' }}>
              Read smarter with AI
            </h1>
            <p style={{ fontSize: '17px', color: '#6b7280', margin: 0 }}>
              Upload a research paper, highlight any text, and get instant AI explanations — saved as notes.
            </p>
          </div>
        )}

        {/* ── Library ── */}
        {papers.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>Your Library</h2>
              <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500' }}>{papers.length} paper{papers.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '16px',
            }}>
              {papers.map((paper) => (
                <PaperCard
                  key={paper.key}
                  paper={paper}
                  isLoading={loadingKey === paper.key}
                  onContinue={() => handleContinue(paper.key)}
                  onDelete={() => setConfirmDelete(paper.key)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Upload zone ── */}
        <section>
          {papers.length > 0 && (
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 16px' }}>
              Add new paper
            </h2>
          )}

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              border: `2px dashed ${isDragging ? '#6366f1' : '#d1d5db'}`,
              borderRadius: '20px',
              padding: papers.length > 0 ? '36px 32px' : '56px 32px',
              textAlign: 'center',
              background: isDragging ? 'rgba(99,102,241,0.04)' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{
              width: '56px', height: '56px',
              background: isDragging ? 'rgba(99,102,241,0.1)' : '#f3f4f6',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '24px',
              transition: 'background 0.2s',
            }}>
              {isDragging ? '📂' : '⬆️'}
            </div>

            <p style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 6px' }}>
              {isDragging ? 'Drop it!' : 'Drag & drop your PDF here'}
            </p>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>
              Any research paper in PDF format
            </p>

            <label style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: 'white',
              padding: '10px 28px',
              borderRadius: '10px',
              fontSize: '14px', fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
            }}>
              Browse File
              <input
                type="file" accept=".pdf"
                onChange={(e) => handleFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#d1d5db' }}>
            Files are stored locally in your browser — nothing is uploaded to any server
          </p>
        </section>

      </div>

      {/* ── Delete confirm modal ── */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px',
            width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: '700', color: '#111827' }}>
              Remove from library?
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px' }}>
              This will permanently delete the stored PDF and all its notes. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  border: '1px solid #e5e7eb', background: 'white',
                  color: '#374151', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  border: 'none', background: '#ef4444',
                  color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default Home
