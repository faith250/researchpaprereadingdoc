import { useState, useEffect } from 'react'
import SplitPanel from '../components/Layout/SplitPanel'
import SettingsPanel from '../components/Settings/SettingsPanel'
import { FREE_MODELS, GROQ_MODELS } from '../services/aiService'
import {
  initDrive,
  connectDrive,
  disconnectDrive,
  isDriveConnected,
} from '../services/driveService'

const DEFAULT_SETTINGS = {
  provider: 'groq',
  model: 'llama-3.1-8b-instant',
  apiKey: '',
  groqApiKey: '',
  driveClientId: '',
}

function Reader({ file, onBack }) {
  const [showSettings, setShowSettings] = useState(false)
  const [aiSettings, setAiSettings] = useState(() => {
    const saved = localStorage.getItem('ai-settings')
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS
  })
  const [driveState, setDriveState] = useState('idle') // 'idle'|'connecting'|'connected'|'error'

  // Initialise Drive on mount if a client ID was saved
  useEffect(() => {
    const clientId = aiSettings.driveClientId
    if (clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      initDrive(clientId).then(() => {
        if (isDriveConnected()) setDriveState('connected')
      })
    }
  }, [])

  function handleSaveSettings(newSettings) {
    setAiSettings(newSettings)
    localStorage.setItem('ai-settings', JSON.stringify(newSettings))
    if (newSettings.driveClientId && newSettings.driveClientId !== aiSettings.driveClientId) {
      initDrive(newSettings.driveClientId)
    }
  }

  async function handleDriveToggle() {
    if (driveState === 'connected') {
      disconnectDrive()
      setDriveState('idle')
      return
    }
    if (!aiSettings.driveClientId || aiSettings.driveClientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      setShowSettings(true)
      return
    }
    setDriveState('connecting')
    try {
      await initDrive(aiSettings.driveClientId)
      await connectDrive()
      setDriveState('connected')
    } catch (err) {
      console.error('Drive connect failed:', err)
      setDriveState('error')
      setTimeout(() => setDriveState('idle'), 3000)
    }
  }

  // ── AI status badge ──
  function getAiBadge() {
    const { provider, model, apiKey, groqApiKey } = aiSettings
    if (provider === 'ollama') {
      return { text: `🖥️ ${model || 'Ollama'}`, ok: true }
    }
    if (provider === 'groq') {
      return groqApiKey
        ? { text: `⚡ ${GROQ_MODELS.find((m) => m.value === model)?.label?.split(' —')[0] || model}`, ok: true }
        : { text: '⚠️ Add Groq key', ok: false }
    }
    // gemini
    return apiKey
      ? { text: `☁️ ${FREE_MODELS.find((m) => m.value === model)?.label?.split(' (')[0] || model}`, ok: true }
      : { text: '⚠️ No API key', ok: false }
  }

  const badge = getAiBadge()

  const driveLabel = {
    idle:       '☁️ Connect Drive',
    connecting: '⏳ Connecting…',
    connected:  '✓ Drive synced',
    error:      '⚠️ Drive failed',
  }[driveState]

  const driveColor = {
    idle:       { bg: 'white', color: '#6b7280', border: '#e5e7eb' },
    connecting: { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
    connected:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    error:      { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
  }[driveState]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: 'white', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ fontSize: '13px', color: '#6b7280', cursor: 'pointer', background: 'none', border: 'none' }}>
            ← Library
          </button>
          <span style={{ color: '#e5e7eb' }}>|</span>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file?.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* AI status badge */}
          <span
            onClick={() => setShowSettings(true)}
            title="Click to change AI settings"
            style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '600',
              background: badge.ok ? '#f0fdf4' : '#fef9c3',
              color: badge.ok ? '#16a34a' : '#ca8a04',
              cursor: 'pointer',
            }}
          >
            {badge.text}
          </span>

          {/* Google Drive toggle */}
          <button
            onClick={handleDriveToggle}
            title={driveState === 'connected' ? 'Click to disconnect Drive' : 'Sync notes to Google Drive'}
            style={{
              fontSize: '12px', padding: '5px 12px', borderRadius: '8px',
              border: `1px solid ${driveColor.border}`,
              background: driveColor.bg, color: driveColor.color,
              cursor: driveState === 'connecting' ? 'not-allowed' : 'pointer',
              fontWeight: '500', transition: 'all 0.15s',
            }}
          >
            {driveLabel}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            style={{
              fontSize: '12px', padding: '6px 12px', borderRadius: '8px',
              border: '1px solid #e5e7eb', background: 'white',
              cursor: 'pointer', color: '#374151', fontWeight: '500',
            }}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* ── Split panel ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <SplitPanel file={file} aiSettings={aiSettings} />
      </div>

      {/* ── Settings modal ── */}
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
