import { useState, useRef } from 'react'

function RightPanel({
  notes, onDeleteNote, activeNoteId, onNoteClick,
  noteCardRefs, onUpdateNote, searchQuery,
  onGeneralAsk, generalAskLoading, summaryLoading, paperSummary,
}) {
  const [chatInput, setChatInput] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const chatInputRef = useRef(null)

  function handleChatSubmit() {
    if (!chatInput.trim() || generalAskLoading) return
    onGeneralAsk(chatInput.trim())
    setChatInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Chat with Paper input ── */}
      <div style={{
        padding: '12px',
        borderBottom: '1px solid #f3f4f6',
        background: 'white',
      }}>
        <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🌐 Chat with Paper
        </p>

        {/* Paper summary toggle */}
        {paperSummary && (
          <div style={{ marginBottom: '8px' }}>
            <button
              onClick={() => setShowSummary((v) => !v)}
              style={{
                fontSize: '11px', color: '#059669', background: '#f0fdf4',
                border: '1px solid #bbf7d0', borderRadius: '6px',
                padding: '3px 10px', cursor: 'pointer', fontWeight: '500',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              📋 Paper Summary {showSummary ? '▲' : '▼'}
            </button>
            {showSummary && (
              <div style={{
                marginTop: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: '8px', padding: '10px 12px', maxHeight: '200px', overflowY: 'auto',
              }}>
                <p style={{ fontSize: '12px', color: '#166534', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {paperSummary}
                </p>
              </div>
            )}
          </div>
        )}

        {summaryLoading && !paperSummary && (
          <div style={{
            marginBottom: '8px', background: '#f5f3ff', border: '1px solid #e9d5ff',
            borderRadius: '8px', padding: '8px 10px', fontSize: '12px', color: '#7c3aed',
          }}>
            ⏳ Reading paper and building context… You can already ask questions below.
          </div>
        )}

        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            ref={chatInputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit() } }}
            placeholder={generalAskLoading ? 'AI is thinking…' : 'Ask anything about this paper…'}
            disabled={generalAskLoading}
            style={{
              flex: 1, fontSize: '12px', padding: '8px 10px',
              border: '1px solid #e9d5ff', borderRadius: '8px',
              background: generalAskLoading ? '#faf5ff' : 'white',
              color: '#374151', outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#7c3aed' }}
            onBlur={(e) => { e.target.style.borderColor = '#e9d5ff' }}
          />
          <button
            onClick={handleChatSubmit}
            disabled={!chatInput.trim() || generalAskLoading}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              background: chatInput.trim() && !generalAskLoading ? '#7c3aed' : '#e9d5ff',
              color: chatInput.trim() && !generalAskLoading ? 'white' : '#a78bfa',
              fontSize: '14px', fontWeight: '700',
              cursor: chatInput.trim() && !generalAskLoading ? 'pointer' : 'default',
              transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            {generalAskLoading ? '⏳' : '→'}
          </button>
        </div>
        <p style={{ margin: '5px 0 0', fontSize: '10px', color: '#9ca3af' }}>
          No highlighting needed — ask anything about the paper
        </p>
      </div>

      {/* ── Notes list ── */}
      {notes.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '60px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>
            {searchQuery ? '🔍' : '📝'}
          </div>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>
            {searchQuery
              ? `No notes match "${searchQuery}"`
              : 'Select text on the paper or chat above to add notes'}
          </p>
        </div>
      ) : (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notes.map((note) => {
            const isActive = activeNoteId === note.id
            const isGeneral = note.type === 'general'

            return (
              <div
                key={note.id}
                ref={(el) => (noteCardRefs.current[note.id] = el)}
                onClick={() => onNoteClick(note.id, note.pageIndex)}
                style={{
                  background: 'white',
                  border: isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: isGeneral ? 'default' : 'pointer',
                  boxShadow: isActive
                    ? '0 0 0 3px rgba(59,130,246,0.15)'
                    : '0 1px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '600',
                    color: isGeneral ? '#7c3aed' : note.question ? '#059669' : '#3b82f6',
                    background: isGeneral ? '#f5f3ff' : note.question ? '#f0fdf4' : '#eff6ff',
                    padding: '2px 8px', borderRadius: '999px',
                  }}>
                    {isGeneral ? '🌐 General' : note.question ? '💬 Ask' : '✨ Explain'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!isGeneral && (
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>↩ Jump to page</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id) }}
                      style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: '14px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Highlighted text (only for highlight notes) */}
                {!isGeneral && note.highlight && (
                  <p style={{
                    fontSize: '13px', color: '#374151', background: '#fefce8',
                    borderLeft: `3px solid ${note.question ? '#86efac' : '#facc15'}`,
                    padding: '8px 10px',
                    borderRadius: '0 6px 6px 0', margin: '0 0 10px',
                    fontStyle: 'italic', lineHeight: '1.5',
                  }}>
                    "{note.highlight}"
                  </p>
                )}

                {/* Question */}
                {note.question && (
                  <div style={{
                    background: isGeneral ? '#f5f3ff' : '#f0fdf4',
                    border: `1px solid ${isGeneral ? '#e9d5ff' : '#bbf7d0'}`,
                    borderRadius: '8px', padding: '8px 10px', marginBottom: '10px',
                    display: 'flex', alignItems: 'flex-start', gap: '6px',
                  }}>
                    <span style={{ fontSize: '13px', flexShrink: 0 }}>{isGeneral ? '🌐' : '💬'}</span>
                    <p style={{ fontSize: '13px', color: isGeneral ? '#5b21b6' : '#166534', margin: 0, fontWeight: '500' }}>
                      {note.question}
                    </p>
                  </div>
                )}

                {/* AI Explanation / Answer */}
                {note.aiExplanation && (
                  <div style={{
                    background: '#f0f9ff', border: '1px solid #bae6fd',
                    borderRadius: '8px', padding: '10px 12px', marginBottom: '10px',
                  }}>
                    <p style={{
                      fontSize: '11px', fontWeight: '700', color: '#0284c7',
                      margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {isGeneral ? '🤖 AI Answer' : note.question ? '🤖 AI Answer' : '✨ AI Explanation'}
                    </p>
                    <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {note.aiExplanation}
                    </p>
                  </div>
                )}

                {/* User notes textarea — fully controlled, persists to localStorage */}
                <textarea
                  placeholder="Add your thoughts…"
                  value={note.userNote}
                  onChange={(e) => {
                    onUpdateNote(note.id, e.target.value)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  rows={3}
                  style={{
                    width: '100%', fontSize: '13px', color: '#4b5563',
                    border: '1px solid #e5e7eb', borderRadius: '8px',
                    padding: '8px', resize: 'none', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#3b82f6' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                />

                <p style={{ fontSize: '11px', color: '#d1d5db', margin: '6px 0 0', textAlign: 'right' }}>
                  {note.timestamp}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RightPanel
