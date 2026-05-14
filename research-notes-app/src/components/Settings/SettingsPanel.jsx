import { useState } from 'react'
import { FREE_MODELS, GROQ_MODELS, OLLAMA_MODELS, pullOllamaModel } from '../../services/aiService'

function SettingsPanel({ settings, onSave, onClose }) {
  const [local, setLocal] = useState(settings || { provider: 'groq', model: GROQ_MODELS[0].value })
  const [pullState, setPullState] = useState('idle') // 'idle' | 'pulling' | 'done' | 'error'
  const [pullLabel, setPullLabel] = useState('')

  function update(key, value) {
    setLocal((prev) => ({ ...prev, [key]: value }))
    if (key === 'model') { setPullState('idle'); setPullLabel('') }
  }

  function switchProvider(p) {
    const next = { ...local, provider: p }
    if (p === 'gemini') next.model = FREE_MODELS[0].value
    if (p === 'ollama') next.model = OLLAMA_MODELS[0].value
    if (p === 'groq')   next.model = GROQ_MODELS[0].value
    setLocal(next)
    setPullState('idle')
    setPullLabel('')
  }

  async function handlePull() {
    setPullState('pulling')
    setPullLabel('Connecting to Ollama…')
    try {
      await pullOllamaModel(local.model, ({ status, percent }) => {
        const pct = percent !== null ? ` ${percent}%` : ''
        setPullLabel(status + pct)
      })
      setPullState('done')
      setPullLabel('✓ Model ready!')
    } catch (err) {
      setPullState('error')
      setPullLabel(err.message)
    }
  }

  const S = {
    label: { fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: {
      width: '100%', marginTop: '8px', padding: '10px 12px',
      border: '1px solid #e5e7eb', borderRadius: '8px',
      fontSize: '13px', outline: 'none', boxSizing: 'border-box',
      fontFamily: 'monospace',
    },
    select: {
      width: '100%', marginTop: '8px', padding: '10px 12px',
      border: '1px solid #e5e7eb', borderRadius: '8px',
      fontSize: '13px', outline: 'none', background: 'white',
      boxSizing: 'border-box', cursor: 'pointer',
    },
  }

  const providers = [
    { key: 'groq',   label: '⚡ Groq (Free)',   color: '#f97316', bg: '#fff7ed' },
    { key: 'gemini', label: '☁️ Gemini (Free)', color: '#3b82f6', bg: '#eff6ff' },
    { key: 'ollama', label: '🖥️ Ollama (Local)', color: '#8b5cf6', bg: '#f5f3ff' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '28px', width: '480px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>⚙️ AI Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
        </div>

        {/* Provider toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label style={S.label}>Provider</label>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            {providers.map(({ key, label, color, bg }) => (
              <button
                key={key}
                onClick={() => switchProvider(key)}
                style={{
                  flex: 1, padding: '9px 6px', borderRadius: '10px', cursor: 'pointer',
                  border: local.provider === key ? `2px solid ${color}` : '2px solid #e5e7eb',
                  background: local.provider === key ? bg : 'white',
                  color: local.provider === key ? color : '#6b7280',
                  fontWeight: '600', fontSize: '12px', transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Groq settings ── */}
        {local.provider === 'groq' && (
          <div style={{ marginBottom: '20px' }}>
            {/* Promo banner */}
            <div style={{
              background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
              border: '1px solid #fdba74', borderRadius: '10px',
              padding: '12px 14px', marginBottom: '16px',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#c2410c' }}>
                ⚡ Groq — Free & Blazing Fast
              </p>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
                Runs open-source models (Llama, Gemma, Mixtral) in the cloud — no local install needed. 14,400 free requests/day.
              </p>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '12px', fontWeight: '700', color: '#ea580c', textDecoration: 'none' }}
              >
                Get free API key at console.groq.com/keys →
              </a>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={S.label}>API Key</label>
              <input
                type="password"
                placeholder="gsk_…"
                value={local.groqApiKey || ''}
                onChange={(e) => update('groqApiKey', e.target.value)}
                style={S.input}
              />
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                Free at console.groq.com/keys — no credit card required
              </p>
            </div>

            <div>
              <label style={S.label}>Model</label>
              <select
                value={local.model || GROQ_MODELS[0].value}
                onChange={(e) => update('model', e.target.value)}
                style={S.select}
              >
                {GROQ_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                Llama 3.1 8B is fastest · Llama 3.3 70B gives the best answers
              </p>
            </div>
          </div>
        )}

        {/* ── Gemini settings ── */}
        {local.provider === 'gemini' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={S.label}>API Key</label>
              <input
                type="password"
                placeholder="AIza…"
                value={local.apiKey || ''}
                onChange={(e) => update('apiKey', e.target.value)}
                style={S.input}
              />
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>1500 free requests/day</span>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}
                >
                  Get free key →
                </a>
              </div>
            </div>

            <div>
              <label style={S.label}>Model</label>
              <select value={local.model || FREE_MODELS[0].value} onChange={(e) => update('model', e.target.value)} style={S.select}>
                {FREE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Ollama settings ── */}
        {local.provider === 'ollama' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={S.label}>Model</label>
            <select value={local.model || OLLAMA_MODELS[0].value} onChange={(e) => update('model', e.target.value)} style={S.select}>
              {OLLAMA_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            {/* Install model section */}
            <div style={{
              marginTop: '14px', background: '#f8fafc',
              border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>Install model locally</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Downloads via Ollama</p>
                </div>
                <button
                  onClick={handlePull}
                  disabled={pullState === 'pulling'}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    background: pullState === 'done' ? '#10b981'
                              : pullState === 'error' ? '#ef4444'
                              : pullState === 'pulling' ? '#94a3b8'
                              : '#8b5cf6',
                    color: 'white', fontSize: '13px', fontWeight: '600',
                    cursor: pullState === 'pulling' ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap', transition: 'background 0.2s',
                  }}
                >
                  {pullState === 'pulling' ? '⏳ Installing…'
                  : pullState === 'done'    ? '✓ Installed'
                  : pullState === 'error'   ? '↺ Retry'
                  : '⬇ Install Model'}
                </button>
              </div>

              {pullState === 'pulling' && (
                <div>
                  <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
                    <div style={{
                      height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                      borderRadius: '999px', width: '100%',
                      animation: 'progressPulse 1.5s ease-in-out infinite',
                    }} />
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{pullLabel}</p>
                </div>
              )}
              {(pullState === 'done' || pullState === 'error') && (
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '500', color: pullState === 'done' ? '#059669' : '#dc2626' }}>
                  {pullLabel}
                </p>
              )}
            </div>

            <div style={{ marginTop: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: '#15803d' }}>Make sure Ollama is running:</p>
              <code style={{ fontSize: '11px', color: '#166534', background: 'none', display: 'block' }}>ollama serve</code>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#16a34a' }}>
                Or manually: <code>ollama pull {local.model}</code>
              </p>
            </div>
          </div>
        )}

        {/* ── Google Drive section ── */}
        <div style={{ marginBottom: '20px', paddingTop: '4px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0 10px' }}>
            <span style={{ fontSize: '18px' }}>☁️</span>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#111827' }}>Google Drive Sync</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Auto-backup notes across devices</p>
            </div>
          </div>
          <label style={S.label}>Google Client ID</label>
          <input
            type="text"
            placeholder="xxxxx.apps.googleusercontent.com"
            value={local.driveClientId || ''}
            onChange={(e) => update('driveClientId', e.target.value)}
            style={{
              width: '100%', marginTop: '8px', padding: '10px 12px',
              border: '1px solid #e5e7eb', borderRadius: '8px',
              fontSize: '12px', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'monospace', color: '#374151',
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
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
              background: local.provider === 'groq'
                ? 'linear-gradient(135deg, #f97316, #ea580c)'
                : local.provider === 'ollama'
                  ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                  : 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            Save Settings
          </button>
        </div>

      </div>

      <style>{`
        @keyframes progressPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default SettingsPanel
