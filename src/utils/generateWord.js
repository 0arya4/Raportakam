import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, BorderStyle, Header, Footer, PageNumber,
  Table, TableRow, TableCell, WidthType, ShadingType,
} from 'docx'

// ── Color palette ──────────────────────────────────────────────────────────
const DARK_BLUE  = '1F3864'   // headings
const MID_BLUE   = '2F5496'   // h2 accent line
const DARK_GRAY  = '404040'   // h3 / meta
const BLACK      = '000000'   // body text
const RULE_GRAY  = 'CCCCCC'   // header/footer thin lines

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

export async function generateWordDoc(text, language) {
  const isRTL = /kurdish|arabic|sorani/i.test(language)

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
  //  SECTION 1 — Cover page
  // ══════════════════════════════════════════════════════════════════════
  const coverChildren = []

  // Push title ~⅓ down the page
  coverChildren.push(new Paragraph({ spacing: { before: tw(140), after: 0 } }))

  let pastTitle = false
  let reachedFirstSection = false

  for (const raw of lines) {
    if (reachedFirstSection) break
    const line = raw.trim()

    if (line.startsWith('# ')) {
      // ── Main title
      coverChildren.push(new Paragraph({
        alignment:   AlignmentType.CENTER,
        spacing:     { before: 0, after: tw(6) },
        border:      rule('bottom', DARK_BLUE, 18),
        bidirectional: isRTL,
        children:    [run(line.slice(2), { size: COVER_TITLE, bold: true, color: DARK_BLUE, font: headFont })],
      }))
      // Spacer after title rule
      coverChildren.push(new Paragraph({ spacing: { before: 0, after: tw(28) } }))
      pastTitle = true

    } else if (line.startsWith('## ')) {
      reachedFirstSection = true

    } else if (pastTitle && line) {
      // ── Meta line (student, course, instructor, date)
      coverChildren.push(new Paragraph({
        alignment:   AlignmentType.CENTER,
        spacing:     { before: 0, after: tw(5) },
        bidirectional: isRTL,
        children:    [run(line, { size: COVER_META, color: DARK_GRAY, font: headFont })],
      }))
    }
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

  for (const raw of lines) {
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
      bodyChildren.push(new Paragraph({
        alignment:   headAlign,
        spacing:     { before: tw(12), after: tw(4) },
        bidirectional: isRTL,
        children:    [run(line.slice(4), { size: H3_SIZE, bold: true, color: DARK_GRAY, font: headFont })],
      }))

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

  // ── Page number footer ────────────────────────────────────────────────
  const pageFooter = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border:    rule('top'),
        spacing:   { before: tw(4) },
        children:  [new TextRun({
          children: [PageNumber.CURRENT],
          size:  hp(TINY),
          color: '888888',
          font:  { name: headFont, cs: headFont },
        })],
      }),
    ],
  })

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
        children: bodyChildren,
      },
    ],
  })

  return Packer.toBlob(doc)
}
