from pptx import Presentation

file_path = "d:\\raportakam\\backend\\templates\\sample1.pptx"

print("Loading presentation...")
try:
    prs = Presentation(file_path)
    print("Master Layouts available:")
    for i, layout in enumerate(prs.slide_layouts):
        print(f"Layout {i}: {layout.name}")
        for ph in layout.placeholders:
            print(f"  - Placeholder: {ph.placeholder_format.type} (idx: {ph.placeholder_format.idx})")
except Exception as e:
    import traceback
    traceback.print_exc()
