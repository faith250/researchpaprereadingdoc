import { useState, useCallback } from 'react'

function Home({ onFileUpload }) {
  const [isDragging, setIsDragging] = useState(false)

  function handleFile(file) {
    if (file && file.type === 'application/pdf') {
      onFileUpload(file)
    } else {
      alert('Please upload a PDF file.')
    }
  }

  function handleInputChange(e) {
    handleFile(e.target.files[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '32px',
    }}>

      {/* Logo + Title */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
        }}>
          {/* Simple document icon using text */}
          <span style={{ fontSize: '24px' }}>📄</span>
        </div>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#111827',
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
        }}>
          Research Notes
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280', margin: 0 }}>
          Upload a paper, highlight text, get AI explanations
        </p>
      </div>

      {/* Drop Zone Card */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          width: '100%',
          maxWidth: '480px',
          border: `2px dashed ${isDragging ? '#6366f1' : '#d1d5db'}`,
          borderRadius: '20px',
          padding: '48px 32px',
          textAlign: 'center',
          background: isDragging ? 'rgba(99,102,241,0.05)' : 'white',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Upload icon */}
        <div style={{
          width: '64px',
          height: '64px',
          background: '#f3f4f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '28px',
        }}>
          ⬆️
        </div>

        <p style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 6px' }}>
          Drag & drop your PDF here
        </p>
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 24px' }}>
          Supports any research paper in PDF format
        </p>

        {/* Browse button */}
        <label style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          color: 'white',
          padding: '10px 28px',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
          transition: 'opacity 0.2s',
        }}>
          Browse File
          <input
            type="file"
            accept=".pdf"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Footer hint */}
      <p style={{ marginTop: '32px', fontSize: '12px', color: '#d1d5db' }}>
        Your files stay local — nothing is uploaded to any server
      </p>

    </div>
  )
}

export default Home