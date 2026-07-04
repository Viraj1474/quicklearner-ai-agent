from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()

# ── Page setup (letter, 1" margins) ─────────────────────────────────────────
sec = doc.sections[0]
sec.page_width  = Inches(8.5)
sec.page_height = Inches(11)
sec.top_margin    = Inches(1)
sec.bottom_margin = Inches(1)
sec.left_margin   = Inches(0.75)
sec.right_margin  = Inches(0.75)

# ── Helpers ──────────────────────────────────────────────────────────────────
FONT = "Times New Roman"

def set_run(run, size, bold=False, italic=False):
    run.font.name   = FONT
    run.font.size   = Pt(size)
    run.font.bold   = bold
    run.font.italic = italic

def add_para(align=WD_ALIGN_PARAGRAPH.LEFT, sb=0, sa=0, indent=None):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(sb)
    p.paragraph_format.space_after  = Pt(sa)
    if indent is not None:
        p.paragraph_format.first_line_indent = Pt(indent)
    return p

def add_cols(n=2, space_twips=720):
    """Add two-column layout to current section."""
    sectPr = doc.sections[-1]._sectPr
    cols = OxmlElement('w:cols')
    cols.set(qn('w:num'), str(n))
    cols.set(qn('w:space'), str(space_twips))
    # remove existing cols if any
    for old in sectPr.findall(qn('w:cols')):
        sectPr.remove(old)
    sectPr.append(cols)

def add_hrule(p):
    """Add bottom border (horizontal rule) to paragraph."""
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bot = OxmlElement('w:bottom')
    bot.set(qn('w:val'), 'single')
    bot.set(qn('w:sz'), '6')
    bot.set(qn('w:space'), '1')
    bot.set(qn('w:color'), '000000')
    pBdr.append(bot)
    pPr.append(pBdr)

def add_footer(left_txt, center_txt, right_txt):
    """Add footer with left / center / right text."""
    sec = doc.sections[-1]
    footer = sec.footer
    fp = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    fp.clear()
    fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    fp.paragraph_format.space_before = Pt(0)
    fp.paragraph_format.space_after  = Pt(0)
    # use tab stops: center at 3.5", right at 7"
    from docx.oxml import OxmlElement as OE
    pPr = fp._p.get_or_add_pPr()
    tabs = OE('w:tabs')
    for pos, leader, val in [("3960", "none", "center"), ("7920", "none", "right")]:
        tab = OE('w:tab')
        tab.set(qn('w:val'), val)
        tab.set(qn('w:leader'), leader)
        tab.set(qn('w:pos'), pos)
        tabs.append(tab)
    pPr.append(tabs)
    r1 = fp.add_run(left_txt)
    set_run(r1, 9, bold=True)
    fp.add_run("\t")
    r2 = fp.add_run(center_txt)
    set_run(r2, 9)
    fp.add_run("\t")
    r3 = fp.add_run(right_txt)
    set_run(r3, 9, bold=True)

# ════════════════════════════════════════════════════════════════════════════
# PAGE 1 HEADER (single line, centered, with hrule)
# ════════════════════════════════════════════════════════════════════════════
p = add_para(WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=4)
r = p.add_run("© June 2026 | IJIRT | Volume 13 Issue 1 | ISSN: 2349-6002")
set_run(r, 10)
add_hrule(p)

# ════════════════════════════════════════════════════════════════════════════
# TITLE (large, centered, full-width)
# ════════════════════════════════════════════════════════════════════════════
p = add_para(WD_ALIGN_PARAGRAPH.CENTER, sb=12, sa=4)
r = p.add_run("AI-Powered Study Assistant: An Intelligent Full-Stack Platform\nfor Personalized Learning Using Large Language Models")
set_run(r, 22, bold=False)

# ════════════════════════════════════════════════════════════════════════════
# AUTHORS
# ════════════════════════════════════════════════════════════════════════════
p = add_para(WD_ALIGN_PARAGRAPH.CENTER, sb=10, sa=2)
def sup(p, text, size=7):
    r = p.add_run(text)
    set_run(r, size)
    rPr = r._r.get_or_add_rPr()
    vAlign = OxmlElement('w:vertAlign')
    vAlign.set(qn('w:val'), 'superscript')
    rPr.append(vAlign)
    return r

def txt(p, text, size=10, bold=False, italic=False):
    r = p.add_run(text)
    set_run(r, size, bold=bold, italic=italic)
    return r

txt(p, "Viraj Kulye"); sup(p, "1"); txt(p, ", Pranav Lawand"); sup(p, "2")
txt(p, ", Janhavi Lande"); sup(p, "3"); txt(p, ", Kunal Khopade"); sup(p, "4")
txt(p, ", Mrs. Sucheta Navale"); sup(p, "5")

p = add_para(WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=2)
sup(p, "1,2,3")
txt(p, "Sinhgad Institute of Technology and Science, Pune Narhe, Pune, India", italic=True)

p = add_para(WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=2)
sup(p, "4")
txt(p, "Guide, Sinhgad Institute of Technology and Science, Pune, Narhe, Pune, India", italic=True)

# blank line before two-column content
p = add_para(sb=6, sa=0)
p.add_run("")

# ════════════════════════════════════════════════════════════════════════════
# Switch to TWO COLUMNS
# ════════════════════════════════════════════════════════════════════════════
add_cols(2, 720)
add_footer("IJIRT 205742", "INTERNATIONAL JOURNAL OF INNOVATIVE RESEARCH IN TECHNOLOGY", "8319")

print("Part 1 done")
