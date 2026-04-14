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
    # Set heading color to black
    for run in heading.runs:
        run.font.color.rgb = RGBColor(0, 0, 0)
    return heading


def add_table_to_doc(doc, table_data):
    """Add a formatted table to the document"""
    if not table_data or not table_data.get("headers"):
        return

    headers = table_data["headers"]
    rows = table_data.get("rows", [])

    # Create table (rows = data rows + 1 header row)
    table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    table.style = "Table Grid"

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
        # Header background color — black
        shading_elm = OxmlElement("w:shd")
        shading_elm.set(qn("w:fill"), "000000")
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
        data_table.style = "Table Grid"

        # Headers
        for cell_idx, header_text in enumerate(["Category", "Value"]):
            data_table.rows[0].cells[cell_idx].text = header_text
            for paragraph in data_table.rows[0].cells[cell_idx].paragraphs:
                for run in paragraph.runs:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(255, 255, 255)
            shading_elm = OxmlElement("w:shd")
            shading_elm.set(qn("w:fill"), "000000")
            data_table.rows[0].cells[cell_idx]._element.get_or_add_tcPr().append(shading_elm)

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
    except json.JSONDecodeError as e:
        print(f"[JSON] Decode error: {e}")
        print(f"[JSON] String length: {len(report_json_str)}")
        print(f"[JSON] First 200: {report_json_str[:200]}")
        print(f"[JSON] Last 100: {report_json_str[-100:]}")

        # Try progressively aggressive truncation to recover valid JSON
        report_data = None
        if len(report_json_str) > 100:
            # Strategy: walk backwards from the end, try closing brackets
            # First strip any unterminated string by removing chars after last complete line
            lines = report_json_str.split('\n')
            for trim_count in range(1, min(len(lines), 50)):
                candidate = '\n'.join(lines[:len(lines) - trim_count]).rstrip().rstrip(',')
                # Count open/close braces and brackets to close them
                open_braces = candidate.count('{') - candidate.count('}')
                open_brackets = candidate.count('[') - candidate.count(']')
                closer = ']' * max(0, open_brackets) + '}' * max(0, open_braces)
                attempt = candidate + closer
                try:
                    report_data = json.loads(attempt)
                    print(f"[JSON] Recovered by trimming {trim_count} lines and closing {len(closer)} brackets")
                    break
                except json.JSONDecodeError:
                    continue
        if report_data is None:
            raise ValueError(f"Invalid JSON format: {str(e)} (could not recover)")

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

    doc.add_paragraph()

    # Title
    title_para = doc.add_heading(title, level=0)
    title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in title_para.runs:
        run.font.color.rgb = RGBColor(0, 0, 0)

    doc.add_paragraph()

    # Cover info — only show non-empty fields provided by user
    student = cover_data.get("student", "")
    university = cover_data.get("university", "")
    instructor = cover_data.get("instructor", "")
    date_val = cover_data.get("date", "")

    for field_val, field_label in [
        (student, None), (university, None),
        (instructor, "Instructor"), (date_val, "Date")
    ]:
        if field_val and field_val.strip():
            text = f"{field_label}: {field_val}" if field_label else field_val
            p = doc.add_paragraph(text)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # === ABSTRACT ===
    abstract = report_data.get("abstract", "")
    if abstract:
        h = doc.add_heading("Abstract", level=1)
        for run in h.runs:
            run.font.color.rgb = RGBColor(0, 0, 0)
        doc.add_paragraph(abstract)
        doc.add_paragraph()

    # === TABLE OF CONTENTS ===
    sections_data = report_data.get("sections", [])
    if sections_data:
        h = doc.add_heading("Table of Contents", level=1)
        for run in h.runs:
            run.font.color.rgb = RGBColor(0, 0, 0)

        def strip_heading_label(text):
            if text.startswith("[Heading"):
                parts = text.split("]", 1)
                if len(parts) > 1:
                    return parts[1].strip()
            return text

        for section_idx, section in enumerate(sections_data, 1):
            heading = strip_heading_label(section.get("heading", ""))
            p = doc.add_paragraph(heading, style="List Number")

            subsections = section.get("subsections", [])
            for sub_idx, subsection in enumerate(subsections, 1):
                sub_heading = strip_heading_label(subsection.get("heading", ""))
                p = doc.add_paragraph(sub_heading, style="List Number 2")

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
        h = doc.add_heading("Data Tables", level=1)
        for run in h.runs:
            run.font.color.rgb = RGBColor(0, 0, 0)
        for table_data in tables:
            if table_data.get("title"):
                h = doc.add_heading(table_data["title"], level=2)
                for run in h.runs:
                    run.font.color.rgb = RGBColor(0, 0, 0)
            add_table_to_doc(doc, table_data)

    # === SMART STRUCTURES ===
    smart_structures = report_data.get("smart_structures", [])
    if smart_structures:
        h = doc.add_heading("Structured Analysis", level=1)
        for run in h.runs:
            run.font.color.rgb = RGBColor(0, 0, 0)
        for structure in smart_structures:
            add_smart_structure_to_doc(doc, structure)

    # === CHARTS ===
    charts = report_data.get("charts", [])
    if charts:
        h = doc.add_heading("Data Analysis", level=1)
        for run in h.runs:
            run.font.color.rgb = RGBColor(0, 0, 0)
        for chart in charts:
            add_chart_description_to_doc(doc, chart)

    # === CONCLUSION ===
    conclusion = report_data.get("conclusion", "")
    if conclusion:
        doc.add_page_break()
        h = doc.add_heading("Conclusion", level=1)
        for run in h.runs:
            run.font.color.rgb = RGBColor(0, 0, 0)
        doc.add_paragraph(conclusion)

    # === REFERENCES ===
    references = report_data.get("references", [])
    if references:
        doc.add_page_break()
        h = doc.add_heading("References", level=1)
        for run in h.runs:
            run.font.color.rgb = RGBColor(0, 0, 0)
        for ref in references:
            doc.add_paragraph(ref, style="List Bullet")

    # Save to bytes
    output = io.BytesIO()
    doc.save(output)
    output.seek(0)
    return output
