"""
Convert JSON report structure to Microsoft Word document
"""

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import json
import io


def create_heading_style(doc, level):
    """Get style name for heading level"""
    return f"Heading {level}"


def add_heading_with_label(doc, text, level):
    """Add heading with [Heading X] label parsed from text"""
    # Text comes in format "[Heading 1] Title" - extract the title part
    if text.startswith("[Heading"):
        # Extract everything after the closing bracket
        parts = text.split("]", 1)
        if len(parts) > 1:
            text = parts[1].strip()

    # Add heading with appropriate style
    heading = doc.add_heading(text, level=level)
    return heading


def add_table_to_doc(doc, table_data):
    """Add a formatted table to the document"""
    if not table_data or not table_data.get("headers"):
        return

    headers = table_data["headers"]
    rows = table_data.get("rows", [])

    # Create table (rows = data rows + 1 header row)
    table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    table.style = "Light Grid Accent 1"

    # Add headers
    header_cells = table.rows[0].cells
    for i, header in enumerate(headers):
        header_cells[i].text = str(header)
        # Format header cell
        for paragraph in header_cells[i].paragraphs:
            for run in paragraph.runs:
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
            paragraph_format = paragraph.paragraph_format
            paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        # Header background color
        shading_elm = OxmlElement("w:shd")
        shading_elm.set(qn("w:fill"), "366092")  # Dark blue
        header_cells[i]._element.get_or_add_tcPr().append(shading_elm)

    # Add data rows
    for row_idx, row_data in enumerate(rows):
        row_cells = table.rows[row_idx + 1].cells
        for col_idx, cell_data in enumerate(row_data):
            row_cells[col_idx].text = str(cell_data)
            # Alternate row colors
            if row_idx % 2 == 1:
                shading_elm = OxmlElement("w:shd")
                shading_elm.set(qn("w:fill"), "E7E6E6")  # Light gray
                row_cells[col_idx]._element.get_or_add_tcPr().append(shading_elm)

    doc.add_paragraph()  # Add spacing after table


def add_smart_structure_to_doc(doc, structure_data):
    """Add SmartArt-style structure (hierarchy or process)"""
    if not structure_data:
        return

    title = structure_data.get("title", "Structure")
    struct_type = structure_data.get("type", "hierarchy")
    data = structure_data.get("data", {})

    # Add title
    doc.add_heading(title, level=3)

    if struct_type == "process":
        # Process flow - add steps with arrows
        steps = data.get("steps", [])
        for step in steps:
            step_num = step.get("step", "")
            step_name = step.get("name", "")
            step_desc = step.get("description", "")

            p = doc.add_paragraph(f"→ Step {step_num}: {step_name}", style="List Bullet")
            if step_desc:
                doc.add_paragraph(step_desc, style="List Bullet 2")

    elif struct_type == "hierarchy":
        # Hierarchy tree
        root = data.get("root", "Root")
        children = data.get("children", [])

        p = doc.add_paragraph(root)
        p.paragraph_format.left_indent = Inches(0)

        def add_tree_item(parent_dict, indent_level=1):
            children_list = parent_dict.get("children", [])
            for child in children_list:
                p = doc.add_paragraph(f"└─ {child.get('name', '')}")
                p.paragraph_format.left_indent = Inches(indent_level * 0.3)
                if "children" in child:
                    add_tree_item(child, indent_level + 1)

        for child in children:
            p = doc.add_paragraph(f"├─ {child.get('name', '')}")
            p.paragraph_format.left_indent = Inches(0.3)
            if "children" in child:
                add_tree_item(child, indent_level=2)

    doc.add_paragraph()  # Add spacing


def add_chart_description_to_doc(doc, chart_data):
    """Add chart as text representation (actual chart generation would require image creation)"""
    if not chart_data:
        return

    title = chart_data.get("title", "Chart")
    chart_type = chart_data.get("type", "bar")
    labels = chart_data.get("labels", [])
    values = chart_data.get("values", [])
    description = chart_data.get("description", "")

    # Add chart info
    p = doc.add_paragraph(f"[{chart_type.upper()} CHART] {title}")
    p.runs[0].font.bold = True

    # Add data representation
    if labels and values:
        data_table = doc.add_table(rows=len(labels) + 1, cols=2)
        data_table.style = "Light Grid Accent 1"

        # Headers
        data_table.rows[0].cells[0].text = "Category"
        data_table.rows[0].cells[1].text = "Value"

        # Data
        for i, (label, value) in enumerate(zip(labels, values)):
            data_table.rows[i + 1].cells[0].text = str(label)
            data_table.rows[i + 1].cells[1].text = str(value)

    if description:
        doc.add_paragraph(f"Description: {description}", style="Normal")

    doc.add_paragraph()  # Add spacing


def json_to_word(report_json_str):
    """
    Convert JSON report to Word document

    Args:
        report_json_str: JSON string containing report structure

    Returns:
        BytesIO object containing Word document
    """
    try:
        report_data = json.loads(report_json_str)
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON format")

    # Create document
    doc = Document()

    # Set margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # === COVER PAGE ===
    cover_data = report_data.get("cover", {})
    title = report_data.get("title", "Academic Report")

    # Add spacing
    for _ in range(4):
        doc.add_paragraph()

    # Title
    title_para = doc.add_heading(title, level=0)
    title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER

    for _ in range(3):
        doc.add_paragraph()

    # Cover info
    student = cover_data.get("student", "")
    university = cover_data.get("university", "")
    instructor = cover_data.get("instructor", "")
    date = cover_data.get("date", "")

    if student:
        p = doc.add_paragraph(student)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    if university:
        p = doc.add_paragraph(university)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    if instructor:
        p = doc.add_paragraph(f"Instructor: {instructor}")
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    if date:
        p = doc.add_paragraph(f"Date: {date}")
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Page break after cover
    doc.add_page_break()

    # === ABSTRACT ===
    abstract = report_data.get("abstract", "")
    if abstract:
        doc.add_heading("Abstract", level=1)
        doc.add_paragraph(abstract)
        doc.add_paragraph()

    # === TABLE OF CONTENTS ===
    sections_data = report_data.get("sections", [])
    if sections_data:
        doc.add_heading("Table of Contents", level=1)

        for section_idx, section in enumerate(sections_data, 1):
            heading = section.get("heading", "")
            # Extract section number from heading
            p = doc.add_paragraph(heading, style="List Number")

            subsections = section.get("subsections", [])
            for sub_idx, subsection in enumerate(subsections, 1):
                sub_heading = subsection.get("heading", "")
                p = doc.add_paragraph(sub_heading, style="List Number 2")

        doc.add_page_break()

    # === MAIN CONTENT ===
    for section in sections_data:
        heading = section.get("heading", "")
        content = section.get("content", "")

        # Add main section heading
        add_heading_with_label(doc, heading, level=1)

        if content:
            doc.add_paragraph(content)

        # Add subsections
        subsections = section.get("subsections", [])
        for subsection in subsections:
            sub_heading = subsection.get("heading", "")
            sub_content = subsection.get("content", "")

            # Add subsection heading
            add_heading_with_label(doc, sub_heading, level=2)

            if sub_content:
                doc.add_paragraph(sub_content)

            # Add sub-subsections if they exist
            subsubsections = subsection.get("subsubsections", [])
            for subsubsection in subsubsections:
                subsub_heading = subsubsection.get("heading", "")
                subsub_content = subsubsection.get("content", "")

                add_heading_with_label(doc, subsub_heading, level=3)

                if subsub_content:
                    doc.add_paragraph(subsub_content)

    # === TABLES ===
    tables = report_data.get("tables", [])
    if tables:
        doc.add_heading("Data Tables", level=1)
        for table_data in tables:
            if table_data.get("title"):
                doc.add_heading(table_data["title"], level=2)
            add_table_to_doc(doc, table_data)

    # === SMART STRUCTURES ===
    smart_structures = report_data.get("smart_structures", [])
    if smart_structures:
        doc.add_heading("Structured Analysis", level=1)
        for structure in smart_structures:
            add_smart_structure_to_doc(doc, structure)

    # === CHARTS ===
    charts = report_data.get("charts", [])
    if charts:
        doc.add_heading("Data Analysis", level=1)
        for chart in charts:
            add_chart_description_to_doc(doc, chart)

    # === CONCLUSION ===
    conclusion = report_data.get("conclusion", "")
    if conclusion:
        doc.add_page_break()
        doc.add_heading("Conclusion", level=1)
        doc.add_paragraph(conclusion)

    # === REFERENCES ===
    references = report_data.get("references", [])
    if references:
        doc.add_page_break()
        doc.add_heading("References", level=1)
        for ref in references:
            doc.add_paragraph(ref, style="List Bullet")

    # Save to bytes
    output = io.BytesIO()
    doc.save(output)
    output.seek(0)
    return output
