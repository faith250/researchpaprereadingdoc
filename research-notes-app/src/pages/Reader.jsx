import { useState } from 'react'
import SplitPanel from '../components/Layout/SplitPanel'
import SettingsPanel from '../components/Settings/SettingsPanel'
import { FREE_MODELS } from '../services/aiService'

const DEFAULT_SETTINGS = {
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  apiKey: '',
}

function Reader({ file, onBack }) {
  const [showSettings, setShowSettings] = useState(false)
  const [aiSettings, setAiSettings] = useState(() => {
    // Load from localStorage if saved before
    const saved = localStorage.getItem('ai-settings')
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS
  })

  function handleSaveSettings(newSettings) {
    setAiSettings(newSettings)
    localStorage.setItem('ai-settings', JSON.stringify(newSettings))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: 'white', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ fontSize: '13px', color: '#6b7280', cursor: 'pointer', background: 'none', border: 'none' }}>
            ← Back
          </button>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{file?.name}</span>
        </div>

        {/* AI status + settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '600',
            background: aiSettings.apiKey || aiSettings.provider === 'ollama' ? '#f0fdf4' : '#fef9c3',
            color: aiSettings.apiKey || aiSettings.provider === 'ollama' ? '#16a34a' : '#ca8a04',
          }}>
            {aiSettings.provider === 'ollama'
              ? `🖥️ Ollama · ${aiSettings.model}`
              : aiSettings.apiKey
                ? `☁️ ${FREE_MODELS.find(m => m.value === aiSettings.model)?.label || aiSettings.model}`
                : '⚠️ No API key set'
            }
          </span>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              fontSize: '12px', padding: '6px 12px', borderRadius: '8px',
              border: '1px solid #e5e7eb', background: 'white',
              cursor: 'pointer', color: '#374151', fontWeight: '500',
            }}
          >
            ⚙️ AI Settings
          </button>
        </div>
      </div>

      {/* Split panel */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <SplitPanel file={file} aiSettings={aiSettings} />
      </div>

      {/* Settings modal */}
      {showSettings && (
        <SettingsPanel
          settings={aiSettings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default Reader