import { useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Home from './pages/Home'
import Reader from './pages/Reader'
import { savePaper, loadPaperAsFile, touchPaper } from './utils/paperStore'

type AppState = 'home' | 'loading' | 'reader'

function App() {
  const [state, setState] = useState<AppState>('home')
  const [currentFile, setCurrentFile] = useState<File | null>(null)

  // Called when the user drops / browses a new PDF
  async function handleFileUpload(file: File) {
    try {
      await savePaper(file) // persist to IndexedDB
    } catch (err) {
      console.warn('Could not save paper to IndexedDB:', err)
    }
    setCurrentFile(file)
    setState('reader')
  }

  // Called when the user clicks "Continue" on a library card
  async function handleOpenPaper(key: string) {
    setState('loading')
    try {
      const file = await loadPaperAsFile(key)
      if (!file) {
        alert('Paper not found in storage. Please re-upload the PDF.')
        setState('home')
        return
      }
      await touchPaper(key)
      setCurrentFile(file)
      setState('reader')
    } catch (err) {
      console.error('Failed to load paper:', err)
      alert('Could not load paper. Please try re-uploading.')
      setState('home')
    }
  }

  function handleBack() {
    setCurrentFile(null)
    setState('home')
  }

  if (state === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #f0f4ff 0%, #fafafa 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        gap: '16px',
      }}>
        <div style={{
          width: '52px', height: '52px',
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '26px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>📄</div>
        <p style={{ fontSize: '15px', color: '#6b7280', fontWeight: '500' }}>
          Opening your paper…
        </p>
        <style>{`
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.95)} }
        `}</style>
      </div>
    )
  }

  return (
    <>
      {state === 'reader' && currentFile ? (
        <Reader file={currentFile} onBack={handleBack} />
      ) : (
        <Home onFileUpload={handleFileUpload} onOpenPaper={handleOpenPaper} />
      )}
      <Analytics />
    </>
  )
}

export default App
