/**
 * paperStore.js
 * Stores full PDF files in IndexedDB so the user never has to re-upload them.
 * Notes continue to live in localStorage (fast, small).
 */

const DB_NAME    = 'research-notes-db'
const DB_VERSION = 1
const STORE      = 'papers'

// ── Open (or create) the database ────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' })
      }
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror  = (e) => reject(e.target.error)
  })
}

// Shared key format — must match SplitPanel's storageKey()
export function paperKey(file) {
  return `${file.name}::${file.size}`
}

// ── Save a PDF file ───────────────────────────────────────────────────────────
export async function savePaper(file) {
  const key = paperKey(file)
  const arrayBuffer = await file.arrayBuffer()
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({
      key,
      name:       file.name,
      size:       file.size,
      type:       file.type,
      lastOpened: Date.now(),
      data:       arrayBuffer,
    })
    tx.oncomplete = () => resolve(key)
    tx.onerror    = (e) => reject(e.target.error)
  })
}

// ── Restore a stored PDF as a File object ─────────────────────────────────────
export async function loadPaperAsFile(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = (e) => {
      const rec = e.target.result
      if (!rec) { resolve(null); return }
      resolve(new File([rec.data], rec.name, { type: rec.type }))
    }
    req.onerror = (e) => reject(e.target.error)
  })
}

// ── List all stored papers (metadata only, no binary data) ────────────────────
export async function listPapers() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
    req.onsuccess = (e) => {
      const papers = e.target.result.map(({ key, name, size, lastOpened }) => ({
        key,
        name,
        size,
        lastOpened,
        noteCount: getNoteCount(key),
      }))
      papers.sort((a, b) => b.lastOpened - a.lastOpened)
      resolve(papers)
    }
    req.onerror = (e) => reject(e.target.error)
  })
}

// ── Update the lastOpened timestamp ──────────────────────────────────────────
export async function touchPaper(key) {
  const db = await openDB()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  const req = store.get(key)
  req.onsuccess = (e) => {
    const rec = e.target.result
    if (rec) { rec.lastOpened = Date.now(); store.put(rec) }
  }
}

// ── Delete a paper and its notes ──────────────────────────────────────────────
export async function deletePaper(key) {
  // Remove notes from localStorage
  localStorage.removeItem(`research-notes::${key}`)
  // Remove PDF from IndexedDB
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = resolve
    tx.onerror    = (e) => reject(e.target.error)
  })
}

// ── Helper: read note count from localStorage ─────────────────────────────────
function getNoteCount(key) {
  try {
    const saved = localStorage.getItem(`research-notes::${key}`)
    return saved ? JSON.parse(saved).length : 0
  } catch {
    return 0
  }
}

// ── Human-readable relative time ─────────────────────────────────────────────
export function timeAgo(ts) {
  const diff  = Date.now() - ts
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  <  1) return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  ===1) return 'yesterday'
  if (days  < 30) return `${days} days ago`
  return new Date(ts).toLocaleDateString()
}
