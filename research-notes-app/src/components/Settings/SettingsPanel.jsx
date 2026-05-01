import { useState } from 'react'
import { FREE_MODELS, OLLAMA_MODELS } from '../../services/aiService'

function SettingsPanel({ settings, onSave, onClose }) {
  // Added a fallback to an empty object to prevent "cannot read property of null" errors
  const [local, setLocal] = useState(settings || { provider: 'gemini', model: FREE_MODELS[0].value })

  function update(key, value) {
    setLocal(prev => ({ ...prev, [key]: value }))
  }

  function switchProvider(p) {
    const next = { ...local, provider: p }
    if (p === 'gemini') next.model = FREE_MODELS[0].value
    if (p === 'ollama') next.model = OLLAMA_MODELS[0].value
    setLocal(next)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '28px', width: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>AI Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
        </div>

        {/* Provider toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Provider
          </label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={() => switchProvider('gemini')}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                border: local.provider === 'gemini' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                background: local.provider === 'gemini' ? '#eff6ff' : 'white',
                color: local.provider === 'gemini' ? '#3b82f6' : '#6b7280',
                fontWeight: '600', fontSize: '13px',
              }}
            >
              Gemini (Free)
            </button>
            <button
              onClick={() => switchProvider('ollama')}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                border: local.provider === 'ollama' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                background: local.provider === 'ollama' ? '#eff6ff' : 'white',
                color: local.provider === 'ollama' ? '#3b82f6' : '#6b7280',
                fontWeight: '600', fontSize: '13px',
              }}
            >
              Ollama (Local)
            </button>
          </div>
        </div>

        {/* Gemini settings */}
        {local.provider === 'gemini' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                API Key
              </label>
              <input
                type="password"
                placeholder="AIza..."
                value={local.apiKey || ''}
                onChange={(e) => update('apiKey', e.target.value)}
                style={{
                  width: '100%', marginTop: '8px', padding: '10px 12px',
                  border: '1px solid #e5e7eb', borderRadius: '8px',
                  fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'monospace',
                }}
              />
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>1500 free requests/day</span>
                {/* FIXED: Added missing 'a' tag here */}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}
                >
                  Get free key
                </a>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Model
              </label>
              <select
                value={local.model || FREE_MODELS[0].value}
                onChange={(e) => update('model', e.target.value)}
                style={{
                  width: '100%', marginTop: '8px', padding: '10px 12px',
                  border: '1px solid #e5e7eb', borderRadius: '8px',
                  fontSize: '13px', outline: 'none', background: 'white',
                  boxSizing: 'border-box', cursor: 'pointer',
                }}
              >
                {FREE_MODELS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <div style={{ marginTop: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#15803d' }}>Gemini 2.0 Flash — fastest, best for research</p>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#15803d' }}>Gemini 1.5 Flash — great balance of speed and quality</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#15803d' }}>Gemini 1.5 Pro — most detailed explanations</p>
              </div>
            </div>
          </div>
        )}

        {/* Ollama settings */}
        {local.provider === 'ollama' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Model
            </label>
            <select
              value={local.model || OLLAMA_MODELS[0].value}
              onChange={(e) => update('model', e.target.value)}
              style={{
                width: '100%', marginTop: '8px', padding: '10px 12px',
                border: '1px solid #e5e7eb', borderRadius: '8px',
                fontSize: '13px', outline: 'none', background: 'white',
                boxSizing: 'border-box', cursor: 'pointer',
              }}
            >
              {OLLAMA_MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <div style={{ marginTop: '12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Setup instructions:</p>
              <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#6b7280' }}>1. Install from ollama.com</p>
              <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#6b7280' }}>2. Run: ollama serve</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>3. Run: ollama pull {local.model || 'llama3'}</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px',
              background: 'white', color: '#6b7280',
              border: '1px solid #e5e7eb', borderRadius: '10px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(local); onClose() }}
            style={{
              flex: 2, padding: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            Save Settings
          </button>
        </div>

      </div>
    </div>
  )
}

export default SettingsPanel