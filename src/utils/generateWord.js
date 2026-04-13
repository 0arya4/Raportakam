import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, BorderStyle, Header, Footer, PageNumber,
  Table, TableRow, TableCell, WidthType, ShadingType,
} from 'docx'

// ── RANDOM COLOR THEMES ────────────────────────────────────────────────────
// Different color scheme each time!
const THEMES = [
  { name: 'Navy', h2: '1F3A74', h1: '0D2657', h3: '404040' },           // Professional Navy
  { name: 'Blue', h2: '1D4ED8', h1: '1E3A8A', h3: '475569' },          // Corporate Blue
  { name: 'Green', h2: '15803D', h1: '166534', h3: '475569' },         // Dark Green
  { name: 'Red', h2: '991B1B', h1: '7F1D1D', h3: '4F46E5' },          // Deep Red
  { name: 'Purple', h2: '6D28D9', h1: '581C87', h3: '475569' },        // Purple Premium
  { name: 'Teal', h2: '0D9488', h1: '047857', h3: '475569' },          // Teal Modern
  { name: 'Amber', h2: 'B45309', h1: '92400E', h3: '475569' },         // Amber Classic
  { name: 'Indigo', h2: '4F46E5', h1: '4338CA', h3: '475569' },        // Indigo Tech
]

// ── RANDOM COVER PAGE STYLES ────────────────────────────────────────────────
const COVER_STYLES = ['centered', 'left', 'right', 'minimal', 'elegant']
const ACCENT_POSITIONS = ['top', 'bottom', 'none']
const BLACK      = '000000'            // body text (always black)
const RULE_GRAY  = 'CCCCCC'            // header/footer thin lines

// ── Unit helpers ──────────────────────────────────────────────────────────
const hp   = pt => pt * 2             // half-points  (docx font size)
const tw   = pt => pt * 20            // twips        (docx spacing)
const inTw = i  => Math.round(i * 1440) // inches → twips

// ── Font sizes (pt) ───────────────────────────────────────────────────────
const COVER_TITLE  = 26
const COVER_META   = 12
const H2_SIZE      = 16
const H3_SIZE      = 13
const BODY_SIZE    = 12
const TINY         = 9     // header / footer text

export async function generateWordDoc(text, language, themeOverride = null, coverStyleOverride = null, accentPosOverride = null) {
  const isRTL = /kurdish|arabic|sorani/i.test(language)

  // Use provided theme or pick random
  const selectedTheme = themeOverride || THEMES[Math.floor(Math.random() * THEMES.length)]
  const selectedCoverStyle = coverStyleOverride || COVER_STYLES[Math.floor(Math.random() * COVER_STYLES.length)]
  const selectedAccentPos = accentPosOverride || ACCENT_POSITIONS[Math.floor(Math.random() * ACCENT_POSITIONS.length)]
  const randomTitleSize = 24 + Math.floor(Math.random() * 5)

  // Theme colors derived from selected theme
  const DARK_BLUE  = selectedTheme.h2    // headings
  const MID_BLUE   = selectedTheme.h1    // h2 accent line
  const DARK_GRAY  = selectedTheme.h3    // h3 / meta

  // Body: Times New Roman for Latin, NRT Reg for Kurdish/Arabic
  const bodyFont = isRTL ? 'NRT Reg' : 'Times New Roman'
  const headFont = isRTL ? 'NRT Reg' : 'Calibri'

  // Body alignment: RTL → right; Latin → justified
  const bodyAlign = isRTL ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED
  const headAlign = isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT

  // ── Helper: build a TextRun ────────────────────────────────────────────
  const run = (t, { size = BODY_SIZE, bold = false, italic = false,
                    color = BLACK, font = bodyFont } = {}) =>
    new TextRun({
      text: t,
      size:       hp(size),
      bold,
      italic,
      color,
      font:       { name: font, cs: font },
      rightToLeft: isRTL,
    })

  // ── Helper: thin border rule ───────────────────────────────────────────
  const rule = (side, color = RULE_GRAY, sz = 4) =>
    ({ [side]: { style: BorderStyle.SINGLE, size: sz, color, space: 4 } })

  // ── Helper: create SmartArt-style process diagram ─────────────────────
  const buildSmartArtDiagram = (title, steps) => {
    const diagrams = []

    // Title
    diagrams.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: tw(12), after: tw(12) },
      children: [run(title, { size: H2_SIZE, bold: true, color: DARK_BLUE, font: headFont })],
    }))

    // Process boxes
    steps.forEach((step, idx) => {
      // Step box
      const boxPara = new Paragraph({
        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.CENTER,
        spacing: { before: tw(8), after: tw(8) },
        border: {
          top: { style: BorderStyle.SINGLE, size: 12, color: DARK_BLUE, space: 4 },
          bottom: { style: BorderStyle.SINGLE, size: 12, color: DARK_BLUE, space: 4 },
          left: { style: BorderStyle.SINGLE, size: 12, color: DARK_BLUE, space: 4 },
          right: { style: BorderStyle.SINGLE, size: 12, color: DARK_BLUE, space: 4 },
        },
        shading: { fill: 'F0F4F8', type: ShadingType.CLEAR, color: 'auto' },
        children: [run(step, { size: BODY_SIZE, bold: true, color: DARK_BLUE, font: bodyFont })],
      })
      diagrams.push(boxPara)

      // Arrow between steps
      if (idx < steps.length - 1) {
        diagrams.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: tw(2), after: tw(2) },
          children: [run('↓', { size: 14, color: DARK_BLUE })],
        }))
      }
    })

    return diagrams
  }

  // ── Parse source markdown ──────────────────────────────────────────────
  const lines = text.split('\n')

  // Extract title for the running header
  let reportTitle = ''
  for (const l of lines) {
    if (l.startsWith('# ')) { reportTitle = l.slice(2).trim(); break }
  }

  // ── Build inline bold spans from **text** ─────────────────────────────
  const bodyRuns = (line) =>
    line.split(/(\*\*[^*]+\*\*)/).map(p =>
      p.startsWith('**') && p.endsWith('**')
        ? run(p.slice(2, -2), { bold: true })
        : run(p)
    )

  // ── Build a Word table from collected markdown table lines ─────────────
  const buildTable = (tableLines) => {
    // split each line into cells, strip leading/trailing |
    const rows = tableLines
      .filter(l => !/^\|[\s|:-]+\|$/.test(l.trim())) // skip separator rows
      .map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()))

    if (rows.length === 0) return null
    const headers = rows[0]
    const dataRows = rows.slice(1)

    const cellPara = (text, bold, color, bg) => new TableCell({
      shading: bg ? { fill: bg, type: ShadingType.CLEAR, color: 'auto' } : undefined,
      margins: { top: tw(3), bottom: tw(3), left: tw(5), right: tw(5) },
      children: [new Paragraph({
        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
        bidirectional: isRTL,
        children: [new TextRun({
          text,
          bold,
          color,
          size: hp(11),
          font: { name: bodyFont, cs: bodyFont },
          rightToLeft: isRTL,
        })],
      })],
    })

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Header row — dark blue background, white bold text
        new TableRow({
          tableHeader: true,
          children: headers.map(h => cellPara(h, true, 'FFFFFF', DARK_BLUE)),
        }),
        // Data rows — alternating light gray
        ...dataRows.map((cells, i) =>
          new TableRow({
            children: cells.map(c => cellPara(c, false, BLACK, i % 2 === 1 ? 'F2F2F2' : 'FFFFFF')),
          })
        ),
      ],
    })
  }

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 1 — Cover page (with random styles)
  // ══════════════════════════════════════════════════════════════════════
  const coverChildren = []

  // ── Top accent bar (if selected) ────────────────────────────────────
  if (selectedAccentPos === 'top') {
    coverChildren.push(new Paragraph({
      spacing: { before: 0, after: tw(20) },
      border: rule('bottom', DARK_BLUE, 20),
      children: [run('', { size: 1 })],
    }))
  }

  // ── Dynamic spacing before title based on cover style ───────────────
  const spacingBeforeTitle = selectedCoverStyle === 'minimal' ? tw(80) : selectedCoverStyle === 'elegant' ? tw(120) : tw(140)
  coverChildren.push(new Paragraph({ spacing: { before: spacingBeforeTitle, after: 0 } }))

  let pastTitle = false
  let reachedFirstSection = false

  for (const raw of lines) {
    if (reachedFirstSection) break
    const line = raw.trim()

    if (line.startsWith('# ')) {
      // ── Main title with dynamic alignment ────────────────────────────
      let titleAlign = AlignmentType.CENTER
      if (selectedCoverStyle === 'left') titleAlign = AlignmentType.LEFT
      else if (selectedCoverStyle === 'right') titleAlign = AlignmentType.RIGHT

      const titleBorder = selectedCoverStyle === 'minimal' ? {} : rule('bottom', DARK_BLUE, 18)
      const titleSpacingAfter = selectedCoverStyle === 'elegant' ? tw(12) : tw(6)

      coverChildren.push(new Paragraph({
        alignment:   titleAlign,
        spacing:     { before: 0, after: titleSpacingAfter },
        border:      titleBorder,
        bidirectional: isRTL,
        children:    [run(line.slice(2), { size: randomTitleSize, bold: true, color: DARK_BLUE, font: headFont })],
      }))
      // Spacer after title
      coverChildren.push(new Paragraph({ spacing: { before: 0, after: tw(selectedCoverStyle === 'minimal' ? 12 : 28) } }))
      pastTitle = true

    } else if (line.startsWith('## ')) {
      reachedFirstSection = true

    } else if (pastTitle && line) {
      // ── Meta line (student, course, instructor, date)
      let metaAlign = AlignmentType.CENTER
      if (selectedCoverStyle === 'left') metaAlign = AlignmentType.LEFT
      else if (selectedCoverStyle === 'right') metaAlign = AlignmentType.RIGHT

      coverChildren.push(new Paragraph({
        alignment:   metaAlign,
        spacing:     { before: 0, after: tw(5) },
        bidirectional: isRTL,
        children:    [run(line, { size: COVER_META, color: DARK_GRAY, font: headFont })],
      }))
    }
  }

  // ── Bottom accent bar (if selected) ──────────────────────────────────
  if (selectedAccentPos === 'bottom') {
    coverChildren.push(new Paragraph({ spacing: { before: tw(40), after: 0 } }))
    coverChildren.push(new Paragraph({
      spacing: { before: 0, after: 0 },
      border: rule('top', DARK_BLUE, 20),
      children: [run('', { size: 1 })],
    }))
  }

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 2 — Body (header + footer + content)
  // ══════════════════════════════════════════════════════════════════════
  const bodyChildren = []
  let inBody = false
  let tableBuffer = []

  const flushTable = () => {
    if (tableBuffer.length < 2) { tableBuffer = []; return }
    const tbl = buildTable(tableBuffer)
    if (tbl) {
      bodyChildren.push(tbl)
      bodyChildren.push(new Paragraph({ spacing: { after: tw(8) } }))
    }
    tableBuffer = []
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()

    // Collect markdown table lines
    if (line.startsWith('|')) {
      if (inBody) tableBuffer.push(line)
      continue
    }

    // Flush any buffered table before processing next non-table line
    if (tableBuffer.length > 0) flushTable()

    if (line.startsWith('# ')) continue   // cover-only

    if (line.startsWith('## ')) {
      inBody = true
      bodyChildren.push(new Paragraph({
        pageBreakBefore: true,
        alignment:   headAlign,
        spacing:     { before: tw(4), after: tw(14) },
        border:      rule('bottom', MID_BLUE, 10),
        bidirectional: isRTL,
        children:    [run(line.slice(3), { size: H2_SIZE, bold: true, color: DARK_BLUE, font: headFont })],
      }))

    } else if (line.startsWith('### ')) {
      const sectionTitle = line.slice(4)
      bodyChildren.push(new Paragraph({
        alignment:   headAlign,
        spacing:     { before: tw(12), after: tw(4) },
        bidirectional: isRTL,
        children:    [run(sectionTitle, { size: H3_SIZE, bold: true, color: DARK_GRAY, font: headFont })],
      }))

      // ── Detect SmartArt patterns (consecutive bullet points/steps) ─────
      const nextLines = []
      let j = i + 1
      while (j < lines.length && lines[j].trim() !== '') {
        const nextLine = lines[j].trim()
        if (nextLine.startsWith('#') || nextLine.startsWith('|')) break
        if (nextLine.startsWith('- ') || nextLine.startsWith('* ') || /^\d+\.\s/.test(nextLine)) {
          nextLines.push(nextLine.replace(/^[-*]\s|\d+\.\s/, ''))
          j++
        } else {
          break
        }
      }

      // If we found 2+ steps, render as SmartArt diagram
      if (nextLines.length >= 2) {
        const diagramElements = buildSmartArtDiagram(sectionTitle, nextLines)
        bodyChildren.push(...diagramElements)
        i = j - 1  // Skip processed lines
        continue
      }

    } else if (line.startsWith('#### ')) {
      bodyChildren.push(new Paragraph({
        alignment:   headAlign,
        spacing:     { before: tw(8), after: tw(2) },
        bidirectional: isRTL,
        children:    [run(line.slice(5), { bold: true, italic: true, color: DARK_GRAY })],
      }))

    } else if (line === '' || line === '---') {
      if (inBody) bodyChildren.push(new Paragraph({ spacing: { after: 0 } }))

    } else if (inBody) {
      bodyChildren.push(new Paragraph({
        alignment:   bodyAlign,
        spacing:     { after: tw(6), line: 360, lineRule: 'auto' },
        bidirectional: isRTL,
        children:    bodyRuns(line),
      }))
    }
  }
  // Flush any trailing table
  if (tableBuffer.length > 0) flushTable()

  // ── Running header ─────────────────────────────────────────────────────
  const pageHeader = new Header({
    children: [
      new Paragraph({
        alignment:   isRTL ? AlignmentType.LEFT : AlignmentType.RIGHT,
        border:      rule('bottom'),
        spacing:     { after: tw(4) },
        children:    [new TextRun({
          text:  reportTitle,
          italic: true,
          size:  hp(TINY),
          color: '888888',
          font:  { name: headFont, cs: headFont },
        })],
      }),
    ],
  })

  // ── Page number footer with title ─────────────────────────────────────
  const pageFooter = new Footer({
    children: [
      new Paragraph({
        alignment: isRTL ? AlignmentType.LEFT : AlignmentType.RIGHT,
        border:    rule('top'),
        spacing:   { before: tw(4), after: tw(1) },
        children:  [new TextRun({
          text: reportTitle,
          italic: true,
          size:  hp(TINY),
          color: '888888',
          font:  { name: headFont, cs: headFont },
          rightToLeft: isRTL,
        })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing:   { before: tw(1) },
        children:  [new TextRun({
          children: [PageNumber.CURRENT],
          size:  hp(TINY),
          color: '888888',
          font:  { name: headFont, cs: headFont },
        })],
      }),
    ],
  })

  // ── Apply left accent bar to body if selected ──────────────────────────
  // Note: Left accent disabled - use top/bottom/none for cleaner look
  let finalBodyChildren = bodyChildren
  // if (selectedAccentPos === 'left') {
  //   Add left border to body paragraphs if re-enabled in future
  // }

  const margin = inTw(1.0)

  const doc = new Document({
    sections: [
      // Cover — no header/footer
      {
        properties: {
          page: { margin: { top: margin, bottom: margin, left: margin, right: margin } },
        },
        children: coverChildren,
      },
      // Body — with header and page numbers
      {
        properties: {
          page: { margin: { top: margin, bottom: inTw(1.2), left: margin, right: margin } },
        },
        headers: { default: pageHeader },
        footers: { default: pageFooter },
        children: finalBodyChildren,
      },
    ],
  })

  return Packer.toBlob(doc)
}
