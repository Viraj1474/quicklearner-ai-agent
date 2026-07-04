# build_report.py  –  combine all chapters and save final .docx
import sys
sys.path.insert(0, r'C:\ai-agent')

from ql_helpers import new_doc, set_header, set_footer, _p, _r, FONT
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# import all chapter writers
from ch00_frontmatter   import write_frontmatter
from ch00_prelim        import write_prelim
from ch01_introduction  import write_ch1
from ch02_literature    import write_ch2
from ch03_srs           import write_ch3
from ch04_design        import write_ch4
from ch05_planning      import write_ch5
from ch06_implementation import write_ch6
from ch07_testing       import write_ch7
from ch08_results       import write_ch8, write_ch9, write_bibliography, write_appendix

# ── Build document ───────────────────────────────────────────────────────────
doc = new_doc()

write_frontmatter(doc)
write_prelim(doc)
write_ch1(doc)
write_ch2(doc)
write_ch3(doc)
write_ch4(doc)
write_ch5(doc)
write_ch6(doc)
write_ch7(doc)
write_ch8(doc)
write_ch9(doc)
write_bibliography(doc)
write_appendix(doc)

# ── Apply chapter headers/footers to each section ────────────────────────────
# Section 0 covers front matter (no header, roman footer already set)
# For main chapters we set header = project name (right), footer = SITS info
FOOTER_TEXT = "SITS, B. E. (Computer) 2019 Course, Project Stage II, 2025-26"
for i, sec in enumerate(doc.sections):
    if i == 0:
        # front matter section: no running header
        hdr = sec.header
        for p in hdr.paragraphs:
            p.clear()
    else:
        set_header(sec, "QuickLearner AI")
        set_footer(sec, FOOTER_TEXT)

# ── Save ─────────────────────────────────────────────────────────────────────
out = r"C:\Users\viraj\OneDrive\Desktop\QuickLearner_AI_Blackbook_Final.docx"
doc.save(out)
print(f"Saved: {out}")
print(f"Total paragraphs: {len(doc.paragraphs)}")
