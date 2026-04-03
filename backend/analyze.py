import zipfile
import re
import xml.etree.ElementTree as ET

file_path = "d:\\raportakam\\The-Nissan-Maxima-A-Legacy-of-Sport-Sedan-Excellence-2000-2023.pptx"

print(f"Analyzing: {file_path}")
try:
    with zipfile.ZipFile(file_path, "r") as z:
        slide_files = [f for f in z.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
        print(f"Found {len(slide_files)} slide XMLs.")
        
        # We can analyze the first few
        slide_files.sort(key=lambda s: int(re.search(r'slide(\d+)\.xml', s).group(1)) if re.search(r'slide(\d+)\.xml', s) else 0)
        
        for slide in slide_files[:5]:
            xml_content = z.read(slide).decode('utf-8')
            print(f"\n--- {slide} ---")
            
            # Simple regex to extract <a:t>...</a:t>
            texts = re.findall(r'<a:t[^>]*>(.*?)</a:t>', xml_content)
            for t in texts:
                if t.strip():
                    print("-", t.strip()[:100])
except Exception as e:
    print(f"Error parsing ZIP/XML: {str(e)}")
