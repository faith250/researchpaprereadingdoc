/**
 * driveService.js — Google Drive auto-sync for Research Notes
 *
 * SETUP (5 minutes):
 * 1. Go to https://console.cloud.google.com → New Project
 * 2. APIs & Services → Enable → search "Google Drive API" → Enable
 * 3. APIs & Services → Credentials → Create → OAuth 2.0 Client ID
 *    · Type: Web Application
 *    · Authorised JS origins: http://localhost:5173  (add your Vercel URL too)
 * 4. Copy the Client ID and paste it below (or set in AI Settings → Google Drive)
 * 5. APIs & Services → OAuth consent screen → Add your Google account as test user
 *
 * Notes are saved in your Google Drive's hidden App Data folder
 * (not visible in Drive UI, only accessible by this app).
 */

// ── Config ────────────────────────────────────────────────────────────────────
const SCOPES    = 'https://www.googleapis.com/auth/drive.appdata'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API= 'https://www.googleapis.com/upload/drive/v3'
const GIS_URL   = 'https://accounts.google.com/gsi/client'

// ── Module state ─────────────────────────────────────────────────────────────
let tokenClient  = null
let accessToken  = null
let tokenExpiry  = 0
let _clientId    = null

// ── Script loader ─────────────────────────────────────────────────────────────
function loadGIS() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) { resolve(); return }
    const s = document.createElement('script')
    s.src = GIS_URL
    s.onload = resolve
    document.head.appendChild(s)
  })
}

// ── Public: initialise with a Client ID ───────────────────────────────────────
export async function initDrive(clientId) {
  if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') return
  _clientId = clientId
  await loadGIS()
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: () => {}, // overridden per-call
  })
}

// ── Public: prompt the OAuth consent screen ───────────────────────────────────
export function connectDrive() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) { reject(new Error('Drive not initialised — add your Client ID in Settings')); return }
    tokenClient.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error_description || resp.error)); return }
      accessToken = resp.access_token
      tokenExpiry = Date.now() + resp.expires_in * 1000
      resolve()
    }
    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}

// ── Public: silently refresh if token is near expiry ────────────────────────
export function refreshDriveToken() {
  if (!tokenClient) return Promise.resolve()
  if (Date.now() < tokenExpiry - 60_000) return Promise.resolve() // still fresh
  return new Promise((resolve) => {
    tokenClient.callback = (resp) => {
      if (!resp.error) {
        accessToken = resp.access_token
        tokenExpiry = Date.now() + resp.expires_in * 1000
      }
      resolve()
    }
    tokenClient.requestAccessToken({ prompt: '' })
  })
}

// ── Public: disconnect ────────────────────────────────────────────────────────
export function disconnectDrive() {
  if (accessToken) window.google?.accounts?.oauth2?.revoke(accessToken)
  accessToken = null
  tokenExpiry = 0
}

// ── Public: is Drive currently connected? ─────────────────────────────────────
export function isDriveConnected() {
  return !!accessToken && Date.now() < tokenExpiry
}

// ── Public: get current Client ID ────────────────────────────────────────────
export function getDriveClientId() {
  return _clientId
}

// ── Internal: authenticated fetch helper ──────────────────────────────────────
async function driveRequest(method, path, body, contentType) {
  await refreshDriveToken()
  if (!accessToken) throw new Error('Not connected to Google Drive')
  const resp = await fetch(`${DRIVE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(contentType ? { 'Content-Type': contentType } : {}),
    },
    body,
  })
  if (resp.status === 401) {
    accessToken = null
    throw new Error('Drive session expired — please reconnect')
  }
  return resp
}

// ── Internal: filename from paper key ────────────────────────────────────────
function filename(paperKey) {
  return `notes_${paperKey.replace(/[^a-z0-9]/gi, '_')}.json`
}

// ── Internal: find a file by name in appDataFolder ───────────────────────────
async function findFile(name) {
  const resp = await driveRequest(
    'GET',
    `/files?spaces=appDataFolder&q=name%3D'${encodeURIComponent(name)}'&fields=files(id,name)`,
  )
  const data = await resp.json()
  return data.files?.[0] || null
}

// ── Internal: multipart upload body builder ───────────────────────────────────
function buildMultipart(boundary, metadata, content) {
  return [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n')
}

// ── Public: save notes to Drive ───────────────────────────────────────────────
export async function syncNotesToDrive(paperKey, notes) {
  if (!isDriveConnected()) return
  const name    = filename(paperKey)
  const content = JSON.stringify(notes)
  const boundary = 'rn_boundary_xyz987'
  const existing = await findFile(name)

  if (existing) {
    // PATCH content only (metadata stays)
    await fetch(`${UPLOAD_API}/files/${existing.id}?uploadType=media`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body:    content,
    })
  } else {
    // POST new file with metadata + content
    const body = buildMultipart(boundary, { name, parents: ['appDataFolder'] }, content)
    await fetch(`${UPLOAD_API}/files?uploadType=multipart`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body,
    })
  }
}

// ── Public: load notes from Drive ────────────────────────────────────────────
export async function loadNotesFromDrive(paperKey) {
  if (!isDriveConnected()) return null
  const file = await findFile(filename(paperKey))
  if (!file) return null
  const resp = await driveRequest('GET', `/files/${file.id}?alt=media`)
  return resp.json()
}

// ── Public: list all note files in Drive ──────────────────────────────────────
export async function listDrivePapers() {
  if (!isDriveConnected()) return []
  const resp = await driveRequest(
    'GET',
    '/files?spaces=appDataFolder&fields=files(id,name,modifiedTime)',
  )
  const data = await resp.json()
  return (data.files || []).filter((f) => f.name.startsWith('notes_'))
}
