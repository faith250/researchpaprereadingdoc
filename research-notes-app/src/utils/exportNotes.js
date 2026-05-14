import jsPDF from 'jspdf'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
  AlignmentType,
} from 'docx'
import { pdfjs } from 'react-pdf'

// ─────────────────────────────────────────────
// Shared helper: trigger a file download
// ─────────────────────────────────────────────
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────
// Derive a clean base name from the PDF file name
// ─────────────────────────────────────────────
function baseName(pdfName) {
  return pdfName.replace(/\.pdf$/i, '').replace(/[^a-z0-9_\- ]/gi, '_').trim()
}

// ─────────────────────────────────────────────
// 1. Markdown export
// ─────────────────────────────────────────────
export function exportAsMarkdown(notes, pdfName) {
  const name = baseName(pdfName)
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const lines = [
    `# Research Notes: ${name}`,
    `*Exported on ${date} · ${notes.length} note${notes.length !== 1 ? 's' : ''}*`,
    '',
  ]

  notes.forEach((note, i) => {
    lines.push(`## Note ${i + 1} — Page ${note.pageIndex + 1}`)
    lines.push('')
    lines.push(`> ${note.highlight}`)
    lines.push('')

    if (note.aiExplanation) {
      lines.push(`**✨ AI Explanation**`)
      lines.push('')
      lines.push(note.aiExplanation)
      lines.push('')
    }

    if (note.userNote && note.userNote.trim()) {
      lines.push(`**📝 My Notes**`)
      lines.push('')
      lines.push(note.userNote)
      lines.push('')
    }

    lines.push('---')
    lines.push('')
  })

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
  downloadBlob(blob, `${name}-notes.md`)
}

// ─────────────────────────────────────────────
// 2. PDF export (jsPDF)
// ─────────────────────────────────────────────
export async function exportAsPDF(notes, pdfName) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const PAGE_W = 210
  const MARGIN = 14
  const TEXT_W = PAGE_W - MARGIN * 2
  const PAGE_H = 297
  const BOTTOM_MARGIN = 20
  const name = baseName(pdfName)
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  let y = 22

  // Helper: add page if needed, returns new y
  function maybeNewPage(neededH) {
    if (y + neededH > PAGE_H - BOTTOM_MARGIN) {
      doc.addPage()
      y = 22
    }
    return y
  }

  // Helper: add wrapped text and return new y
  function addText(text, fontSize, fontStyle, color, maxW) {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, maxW)
    const blockH = lines.length * (fontSize * 0.4)
    maybeNewPage(blockH + 4)
    doc.text(lines, MARGIN, y)
    y += blockH + 2
    return lines.length
  }

  // ── Title block ──
  doc.setFillColor(59, 130, 246)
  doc.rect(0, 0, PAGE_W, 18, 'F')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(`Research Notes: ${name}`, MARGIN, 12)
  y = 26

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(`${date}  ·  ${notes.length} note${notes.length !== 1 ? 's' : ''}`, MARGIN, y)
  y += 10

  // ── Notes ──
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    maybeNewPage(30)

    // Note header pill
    doc.setFillColor(239, 246, 255)
    doc.roundedRect(MARGIN, y - 4, TEXT_W, 8, 2, 2, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(37, 99, 235)
    doc.text(`Note ${i + 1}`, MARGIN + 3, y + 1)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(`Page ${note.pageIndex + 1}  ·  ${note.timestamp || ''}`, MARGIN + 24, y + 1)
    y += 10

    // Highlight text
    const hlLines = doc.splitTextToSize(`"${note.highlight}"`, TEXT_W - 6)
    const hlH = hlLines.length * 5 + 7
    maybeNewPage(hlH)
    doc.setFillColor(254, 252, 232)
    doc.setDrawColor(250, 204, 21)
    doc.rect(MARGIN, y - 3, 3, hlH - 2, 'F')
    doc.setFillColor(254, 252, 232)
    doc.rect(MARGIN + 3, y - 3, TEXT_W - 3, hlH - 2, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(55, 65, 81)
    doc.text(hlLines, MARGIN + 5, y)
    y += hlH + 2

    // Attached image
    if (note.image) {
      try {
        const imgEl = await new Promise((res) => {
          const i = new Image(); i.onload = () => res(i); i.src = note.image
        })
        const ratio = imgEl.width / imgEl.height
        const maxW = TEXT_W - 6
        const maxH = 70
        const imgW = ratio > maxW / maxH ? maxW : maxH * ratio
        const imgH = ratio > maxW / maxH ? maxW / ratio : maxH
        maybeNewPage(imgH + 6)
        doc.addImage(note.image, 'JPEG', MARGIN + 3, y, imgW, imgH)
        y += imgH + 6
      } catch { /* skip broken image */ }
    }

    // AI Explanation
    if (note.aiExplanation) {
      const aiLines = doc.splitTextToSize(note.aiExplanation, TEXT_W - 6)
      const aiH = aiLines.length * 5 + 10
      maybeNewPage(aiH)
      doc.setFillColor(240, 249, 255)
      doc.setDrawColor(186, 230, 253)
      doc.rect(MARGIN, y - 3, TEXT_W, aiH, 'F')
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(2, 132, 199)
      doc.text('✦ AI Explanation', MARGIN + 3, y + 2)
      y += 6
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(55, 65, 81)
      doc.text(aiLines, MARGIN + 3, y)
      y += aiLines.length * 5 + 5
    }

    // User notes
    if (note.userNote && note.userNote.trim()) {
      const unLines = doc.splitTextToSize(note.userNote, TEXT_W - 6)
      const unH = unLines.length * 5 + 10
      maybeNewPage(unH)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(107, 114, 128)
      doc.text('My Notes', MARGIN, y)
      y += 5
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(75, 85, 99)
      doc.text(unLines, MARGIN, y)
      y += unLines.length * 5 + 4
    }

    // Divider
    doc.setDrawColor(229, 231, 235)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 8
  }

  // Page numbers
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(156, 163, 175)
    doc.text(`${p} / ${totalPages}`, PAGE_W / 2, PAGE_H - 8, { align: 'center' })
  }

  doc.save(`${name}-notes.pdf`)
}

// ─────────────────────────────────────────────
// 3. DOCX export (docx package)
// ─────────────────────────────────────────────
export async function exportAsDocx(notes, pdfName) {
  const name = baseName(pdfName)
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const children = []

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Research Notes: ${name}`, bold: true, size: 36, color: '1D4ED8' })],
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Exported on ${date}  ·  ${notes.length} note${notes.length !== 1 ? 's' : ''}`,
          color: '9CA3AF',
          size: 18,
        }),
      ],
    }),
    new Paragraph({ children: [] }),
  )

  notes.forEach((note, i) => {
    // Note heading
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Note ${i + 1}`, bold: true, color: '2563EB', size: 24 }),
          new TextRun({ text: `  —  Page ${note.pageIndex + 1}`, color: '6B7280', size: 20 }),
          ...(note.timestamp ? [new TextRun({ text: `  ·  ${note.timestamp}`, color: '9CA3AF', size: 18 })] : []),
        ],
        spacing: { before: 240, after: 80 },
      }),
    )

    // Highlight (yellow shading)
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `"${note.highlight}"`, italics: true, color: '374151', size: 20 })],
        shading: { type: 'clear', fill: 'FEFCE8' },
        border: {
          left: { style: BorderStyle.THICK, size: 8, color: 'FACC15' },
        },
        indent: { left: 200 },
        spacing: { before: 80, after: 120 },
      }),
    )

    // AI explanation
    if (note.aiExplanation) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '✦ AI Explanation', bold: true, color: '0284C7', size: 18 })],
          spacing: { before: 80, after: 40 },
          shading: { type: 'clear', fill: 'F0F9FF' },
          indent: { left: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: note.aiExplanation, color: '374151', size: 20 })],
          shading: { type: 'clear', fill: 'F0F9FF' },
          indent: { left: 200 },
          spacing: { after: 120 },
        }),
      )
    }

    // User notes
    if (note.userNote && note.userNote.trim()) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'My Notes', bold: true, color: '6B7280', size: 18 })],
          spacing: { before: 80, after: 40 },
        }),
        new Paragraph({
          children: [new TextRun({ text: note.userNote, color: '4B5563', size: 20 })],
          spacing: { after: 120 },
        }),
      )
    }

    // Separator
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '' })],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
        },
        spacing: { before: 160, after: 160 },
      }),
    )
  })

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 },
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${name}-notes.docx`)
}

// ─────────────────────────────────────────────
// 4. Combined export: paper + notes side-by-side (landscape A4, one page per annotated PDF page)
// ─────────────────────────────────────────────
export async function exportPaperWithNotes(notes, file) {
  const name = baseName(file.name)

  // Group notes by PDF page index, sorted by page order
  const notesByPage = {}
  notes.forEach((note) => {
    if (!notesByPage[note.pageIndex]) notesByPage[note.pageIndex] = []
    notesByPage[note.pageIndex].push(note)
  })
  const pageIndices = Object.keys(notesByPage).map(Number).sort((a, b) => a - b)
  if (pageIndices.length === 0) return

  // Load the PDF with pdfjs (worker already configured by main.tsx)
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise

  // ── jsPDF landscape A4 ──
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const PW = 297        // page width mm
  const PH = 210        // page height mm
  const M = 10          // margin
  const HEADER_H = 13   // blue header height
  const DIVIDER_X = M + 168 // where the vertical divider sits
  const LEFT_W = 168    // PDF page column width
  const RIGHT_X = DIVIDER_X + 5 // notes column starts here
  const RIGHT_W = PW - RIGHT_X - M // notes column width
  const CONTENT_Y = M + HEADER_H + 3 // top of content area
  const CONTENT_H = PH - CONTENT_Y - M // height of content area

  let firstOutputPage = true

  for (const pageIndex of pageIndices) {
    if (!firstOutputPage) doc.addPage()
    firstOutputPage = false

    const pageNum = pageIndex + 1
    const pageNotes = notesByPage[pageIndex]

    // ── Blue header ──
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, PW, HEADER_H, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    const truncatedName = name.length > 55 ? name.slice(0, 52) + '…' : name
    doc.text(truncatedName, M, 8.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(147, 197, 253)
    doc.text(
      `Page ${pageNum}  ·  ${pageNotes.length} note${pageNotes.length !== 1 ? 's' : ''}`,
      PW - M, 8.5, { align: 'right' },
    )

    // ── Render PDF page to canvas ──
    const page = await pdfDoc.getPage(pageNum)
    const viewport = page.getViewport({ scale: 2.5 }) // high-res for sharpness
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise

    // ── Draw highlights on top of the rendered page ──
    // Browser renders Page at width=580; canvas is at scale 2.5 natural size
    // so scaleFactor = canvas.width / 580
    const scaleFactor = canvas.width / 580
    pageNotes.forEach((note) => {
      if (!note.rects?.length) return
      const color = note.image
        ? 'rgba(251,146,60,0.35)'
        : note.question
          ? 'rgba(134,239,172,0.40)'
          : 'rgba(253,224,71,0.45)'
      const border = note.image ? 'rgba(251,146,60,0.7)' : note.question ? 'rgba(74,222,128,0.7)' : 'rgba(250,204,21,0.7)'
      note.rects.forEach((rect) => {
        const x = rect.left * scaleFactor
        const y = rect.top * scaleFactor
        const w = rect.width * scaleFactor
        const h = rect.height * scaleFactor
        ctx.save()
        ctx.globalCompositeOperation = 'multiply'
        ctx.fillStyle = color
        ctx.fillRect(x, y, w, h)
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = border
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, w, h)
        ctx.restore()
      })
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.92)

    // Scale to fit LEFT_W × CONTENT_H, centered
    const ratio = viewport.width / viewport.height
    const boxRatio = LEFT_W / CONTENT_H
    let drawW, drawH
    if (ratio > boxRatio) { drawW = LEFT_W; drawH = LEFT_W / ratio }
    else                  { drawH = CONTENT_H; drawW = CONTENT_H * ratio }
    const imgX = M + (LEFT_W - drawW) / 2
    const imgY = CONTENT_Y + (CONTENT_H - drawH) / 2

    // White background + shadow effect, then PDF image
    doc.setFillColor(243, 244, 246)
    doc.rect(M, CONTENT_Y, LEFT_W, CONTENT_H, 'F')
    doc.setFillColor(255, 255, 255)
    doc.rect(imgX, imgY, drawW, drawH, 'F')
    doc.addImage(imgData, 'JPEG', imgX, imgY, drawW, drawH)
    doc.setDrawColor(209, 213, 219)
    doc.setLineWidth(0.3)
    doc.rect(imgX, imgY, drawW, drawH)

    // ── Vertical divider ──
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.5)
    doc.line(DIVIDER_X + 2, CONTENT_Y, DIVIDER_X + 2, PH - M)

    // ── Notes column ──
    let y = CONTENT_Y + 1

    for (let noteIdx = 0; noteIdx < pageNotes.length; noteIdx++) {
      const note = pageNotes[noteIdx]
      if (y >= PH - M - 6) break

      // Highlight quote (yellow pill)
      const hlLines = doc.splitTextToSize(`"${note.highlight}"`, RIGHT_W - 5)
      const hlLineH = 4.3
      const hlBlockH = hlLines.length * hlLineH + 6
      if (y + hlBlockH < PH - M) {
        doc.setFillColor(254, 252, 232)
        doc.roundedRect(RIGHT_X, y, RIGHT_W, hlBlockH, 1.5, 1.5, 'F')
        doc.setDrawColor(251, 191, 36)
        doc.setLineWidth(0.4)
        doc.line(RIGHT_X + 1.5, y + 2, RIGHT_X + 1.5, y + hlBlockH - 2)
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(55, 65, 81)
        doc.text(hlLines, RIGHT_X + 4, y + 4.5)
        y += hlBlockH + 2
      }

      // Attached image
      if (note.image && y + 20 < PH - M) {
        try {
          const maxImgH = Math.min(50, PH - M - y - 5)
          const imgEl = await new Promise((res) => {
            const i = new Image(); i.onload = () => res(i); i.src = note.image
          })
          const ratio = imgEl.width / imgEl.height
          const imgH = maxImgH
          const imgW = Math.min(RIGHT_W, imgH * ratio)
          doc.addImage(note.image, 'JPEG', RIGHT_X, y, imgW, imgH)
          y += imgH + 3
        } catch { /* skip broken image */ }
      }

      // AI explanation
      if (note.aiExplanation && y + 7 < PH - M) {
        const aiLines = doc.splitTextToSize(note.aiExplanation, RIGHT_W - 6)
        const maxAiLines = Math.max(1, Math.floor((PH - M - y - 9) / 3.9))
        const showAi = aiLines.slice(0, maxAiLines)
        const aiBlockH = showAi.length * 3.9 + 8
        doc.setFillColor(240, 249, 255)
        doc.roundedRect(RIGHT_X, y, RIGHT_W, aiBlockH, 1.5, 1.5, 'F')
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(2, 132, 199)
        doc.text('✦ AI Explanation', RIGHT_X + 3, y + 4)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(55, 65, 81)
        doc.text(showAi, RIGHT_X + 3, y + 8)
        y += aiBlockH + 2
      }

      // User's own note
      if (note.userNote?.trim() && y + 7 < PH - M) {
        const unLines = doc.splitTextToSize(note.userNote, RIGHT_W - 6)
        const maxUnLines = Math.max(1, Math.floor((PH - M - y - 9) / 3.9))
        const showUn = unLines.slice(0, maxUnLines)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(107, 114, 128)
        doc.text('My notes', RIGHT_X + 3, y + 4)
        y += 6
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(75, 85, 99)
        doc.text(showUn, RIGHT_X + 3, y)
        y += showUn.length * 3.9 + 3
      }

      // Thin separator between notes (skip after last)
      if (noteIdx < pageNotes.length - 1 && y < PH - M - 5) {
        doc.setDrawColor(229, 231, 235)
        doc.setLineWidth(0.2)
        doc.line(RIGHT_X, y + 1, RIGHT_X + RIGHT_W, y + 1)
        y += 5
      }
    }
  }

  doc.save(`${name}-annotated.pdf`)
}
