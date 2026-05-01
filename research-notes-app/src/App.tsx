import { useState } from 'react'
import Home from './pages/Home'
import Reader from './pages/Reader'

function App() {
  const [currentFile, setCurrentFile] = useState(null)

  function handleFileUpload(file) {
    setCurrentFile(file)
  }

  function handleBack() {
    setCurrentFile(null)
  }

  return (
    <>
      {currentFile ? (
        <Reader file={currentFile} onBack={handleBack} />
      ) : (
        <Home onFileUpload={handleFileUpload} />
      )}
    </>
  )
}

export default App