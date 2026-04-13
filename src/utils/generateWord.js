import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx'

const TEMPLATES = [
  {
    id: 'grand',
    bodyFont: 'Times New Roman', headFont: 'Times New Roman',
    h1Size: 48, h2Size: 20, h3Size: 15, bodySize: 13,
    h1Bold: true,  h2Bold: true,  h3Bold: true,
    h1Center: true, h2Center: false,
    h2Underline: true, h2AllCaps: false, h2SmallCaps: false,
    h1Border: 'bottom_thick', h2Border: null,
    lineSpacing: 360, spaceAfter: 200, marginIn: 1.25, firstIndent: false,
  },
  {
    id: 'modern',
    bodyFont: 'Calibri', headFont: 'Calibri',
    h1Size: 44, h2Size: 16, h3Size: 13, bodySize: 12,
    h1Bold: true,  h2Bold: true,  h3Bold: false,
    h1Center: true, h2Center: false,
    h2Underline: false, h2AllCaps: true, h2SmallCaps: false,
    h1Border: null, h2Border: 'left_thick',
    lineSpacing: 240, spaceAfter: 140, marginIn: 1.0, firstIndent: false,
  },
  {
    id: 'elegant',
    bodyFont: 'Georgia', headFont: 'Georgia',
    h1Size: 46, h2Size: 20, h3Size: 15, bodySize: 13,
    h1Bold: true,  h2Bold: true,  h3Bold: false,
    h1Center: true, h2Center: true,
    h2Underline: false, h2AllCaps: false, h2SmallCaps: false,
    h1Border: 'top_and_bottom', h2Border: 'bottom',
    lineSpacing: 480, spaceAfter: 240, marginIn: 1.5, firstIndent: true,
  },
  {
    id: 'technical',
    bodyFont: 'Arial', headFont: 'Arial',
    h1Size: 36, h2Size: 14, h3Size: 12, bodySize: 11,
    h1Bold: true,  h2Bold: true,  h3Bold: true,
    h1Center: false, h2Center: false,
    h2Underline: false, h2AllCaps: false, h2SmallCaps: true,
    h1Border: 'bottom', h2Border: null,
    lineSpacing: 240, spaceAfter: 120, marginIn: 1.0, firstIndent: false,
  },
  {
    id: 'luxury',
    bodyFont: 'Calibri', headFont: 'Calibri',
    h1Size: 52, h2Size: 17, h3Size: 13, bodySize: 12,
    h1Bold: true,  h2Bold: false, h3Bold: false,
    h1Center: true, h2Center: false,
    h2Underline: false, h2AllCaps: false, h2SmallCaps: false,
    h1Border: 'box', h2Border: 'bottom',
    lineSpacing: 360, spaceAfter: 220, marginIn: 1.4, firstIndent: false,
  },
]

// Internal font family name (from TTF name table: nameId=1)
const NRT_FONT_NAME = 'NRT Reg'
const KURDISH_FONTS = [NRT_FONT_NAME]

const hp  = pt => pt * 2          // half-points  (docx font size unit)
const tw  = pt => pt * 20         // twips        (docx spacing unit)
const inTw = i => Math.round(i * 1440) // inches → twips

const BORDER_DEFS = {
  bottom_thick:   () => ({ bottom: { style: BorderStyle.THICK,  size: 24, color: '000000', space: 4 } }),
  bottom:         () => ({ bottom: { style: BorderStyle.SINGLE, size: 8,  color: '000000', space: 4 } }),
  top_and_bottom: () => ({ top:    { style: BorderStyle.SINGLE, size: 8,  color: '000000', space: 4 },
                           bottom: { style: BorderStyle.SINGLE, size: 8,  color: '000000', space: 4 } }),
  box:            () => ({ top:    { style: BorderStyle.THICK,  size: 24, color: '000000', space: 4 },
                           bottom: { style: BorderStyle.THICK,  size: 24, color: '000000', space: 4 },
                           left:   { style: BorderStyle.THICK,  size: 24, color: '000000', space: 4 },
                           right:  { style: BorderStyle.THICK,  size: 24, color: '000000', space: 4 } }),
  left_thick:     () => ({ left:   { style: BorderStyle.THICK,  size: 24, color: '000000', space: 4 } }),
}

export async function generateWordDoc(text, language) {
  const isRTL = /kurdish|arabic|sorani/i.test(language)
  const tpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]
  const bodyFont = isRTL
    ? KURDISH_FONTS[Math.floor(Math.random() * KURDISH_FONTS.length)]
    : tpl.bodyFont
  const headFont = isRTL ? bodyFont : tpl.headFont


  const align = (center) =>
    isRTL ? AlignmentType.RIGHT : (center ? AlignmentType.CENTER : AlignmentType.LEFT)

  const mkRun = (t, opts = {}) => new TextRun({
    text: t,
    size:       hp(opts.size ?? tpl.bodySize),
    bold:       opts.bold      ?? false,
    italic:     opts.italic    ?? false,
    underline:  opts.underline ? {} : undefined,
    allCaps:    opts.allCaps   ?? false,
    smallCaps:  opts.smallCaps ?? false,
    font:       { name: opts.font ?? bodyFont, cs: opts.font ?? bodyFont },
    color:      '000000',
    rightToLeft: isRTL,
  })

  const borderOf = (type) => type ? (BORDER_DEFS[type]?.() ?? undefined) : undefined

  const children = []
  let onCover = true

  for (const raw of text.split('\n')) {
    const line = raw.trim()

    if (line.startsWith('# ')) {
      // ── Cover title
      children.push(new Paragraph({
        spacing:     { before: tw(160), after: tw(32) },
        alignment:   isRTL ? AlignmentType.RIGHT : AlignmentType.CENTER,
        border:      borderOf(tpl.h1Border),
        bidirectional: isRTL,
        children:    [mkRun(line.slice(2), { size: tpl.h1Size, bold: tpl.h1Bold, font: headFont })],
      }))

    } else if (line.startsWith('## ')) {
      // ── Section heading — forces page break
      onCover = false
      children.push(new Paragraph({
        pageBreakBefore: true,
        spacing:     { before: tw(12), after: tw(8) },
        alignment:   align(tpl.h2Center),
        border:      borderOf(tpl.h2Border),
        bidirectional: isRTL,
        children:    [mkRun(line.slice(3), {
          size: tpl.h2Size, bold: tpl.h2Bold,
          underline: tpl.h2Underline, allCaps: tpl.h2AllCaps, smallCaps: tpl.h2SmallCaps,
          font: headFont,
        })],
      }))

    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({
        spacing:     { before: tw(8), after: tw(4) },
        alignment:   isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
        bidirectional: isRTL,
        children:    [mkRun(line.slice(4), { size: tpl.h3Size, bold: tpl.h3Bold, font: headFont })],
      }))

    } else if (line === '' || line === '---') {
      children.push(new Paragraph({ spacing: { after: 0 } }))

    } else if (onCover) {
      // ── Cover meta lines (student, course, date…)
      children.push(new Paragraph({
        spacing:     { after: tw(4) },
        alignment:   isRTL ? AlignmentType.RIGHT : AlignmentType.CENTER,
        bidirectional: isRTL,
        children:    [mkRun(line, { size: tpl.bodySize + 1 })],
      }))

    } else {
      // ── Body paragraph (handles **bold** spans)
      const parts = line.split(/(\*\*[^*]+\*\*)/)
      children.push(new Paragraph({
        spacing:     { after: tpl.spaceAfter, line: tpl.lineSpacing, lineRule: 'auto' },
        alignment:   isRTL ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
        bidirectional: isRTL,
        indent:      tpl.firstIndent ? { firstLine: 432 } : undefined,
        children:    parts.map(p =>
          p.startsWith('**') && p.endsWith('**')
            ? mkRun(p.slice(2, -2), { size: tpl.bodySize, bold: true })
            : mkRun(p, { size: tpl.bodySize })
        ),
      }))
    }
  }

  const m = inTw(tpl.marginIn)
  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: inTw(1.0), bottom: inTw(1.0), left: m, right: m } },
      },
      children,
    }],
  })

  return Packer.toBlob(doc)
}
