from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


def set_rtl(paragraph):
    pPr = paragraph._p.get_or_add_pPr()
    bidi = OxmlElement("w:bidi")
    pPr.append(bidi)
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT


def create_word(data: dict, output_path: str):
    doc = Document()

    # Page margins
    section = doc.sections[0]
    section.left_margin = Inches(1.2)
    section.right_margin = Inches(1.2)
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)

    # Title
    title_para = doc.add_paragraph()
    set_rtl(title_para)
    title_run = title_para.add_run(data.get("title", "ڕاپۆرت"))
    title_run.bold = True
    title_run.font.size = Pt(28)
    title_run.font.color.rgb = RGBColor(15, 23, 42)
    title_para.space_after = Pt(6)

    # Subtitle line
    sub_para = doc.add_paragraph()
    set_rtl(sub_para)
    sub_run = sub_para.add_run("دروستکراوە بە ڕاپۆرتەکام")
    sub_run.font.size = Pt(12)
    sub_run.font.color.rgb = RGBColor(234, 179, 8)
    sub_para.space_after = Pt(20)

    doc.add_paragraph()  # spacer

    # Sections
    for section_data in data.get("sections", []):
        # Section heading
        heading_para = doc.add_paragraph()
        set_rtl(heading_para)
        heading_run = heading_para.add_run(section_data.get("heading", ""))
        heading_run.bold = True
        heading_run.font.size = Pt(18)
        heading_run.font.color.rgb = RGBColor(15, 23, 42)
        heading_para.space_before = Pt(14)
        heading_para.space_after = Pt(6)

        # Paragraphs
        for para_text in section_data.get("paragraphs", []):
            p = doc.add_paragraph()
            set_rtl(p)
            run = p.add_run(para_text)
            run.font.size = Pt(12)
            run.font.color.rgb = RGBColor(51, 65, 85)
            p.space_after = Pt(8)
            p.paragraph_format.line_spacing = Pt(20)

    doc.save(output_path)
