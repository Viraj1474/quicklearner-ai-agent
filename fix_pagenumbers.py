# fix_pagenumbers.py
# Apply exact page number style matching the reference report:
# - Cover page: no header, no footer
# - Prelim pages (Ack, Abstract, etc): centered roman numeral at bottom
# - Chapter first pages: centered arabic number at bottom, no header
# - Body continuation pages: header = project title right + rule, footer = SITS left + page# right + rule

from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

FONT = "Times New Roman"
FOOTER_LEFT = "SITS, B. E. (Computer) 2019 Course, Project Stage II, 2025-26"
HEADER_RIGHT = "QuickLearner AI"

doc = Document(r"C:\Users\viraj\OneDrive\Desktop\QuickLearner_AI_Blackbook_Final.docx")

def clear_hf(hf):
    for p in hf.paragraphs:
        p.clear()
    while len(hf.paragraphs) > 1:
        p = hf.paragraphs[-1]
        p._element.getparent().remove(p._element)

def add_rule(p, where='bottom'):
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    el = OxmlElement(f'w:{where}')
    el.set(qn('w:val'), 'single')
    el.set(qn('w:sz'), '4')
    el.set(qn('w:space'), '1')
    el.set(qn('w:color'), '000000')
    pBdr.append(el)
    # remove existing pBdr
    for old in pPr.findall(qn('w:pBdr')):
        pPr.remove(old)
    pPr.append(pBdr)

def page_num_field(p, align, size=10, fmt=None):
    """Insert PAGE field into paragraph p."""
    p.clear()
    p.alignment = align
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(0)
    run = p.add_run()
    run.font.name = FONT
    run.font.size = Pt(size)
    if fmt:
        # numFmt instruction
        instr = f' PAGE \\* {fmt} '
    else:
        instr = ' PAGE '
    fldChar1 = OxmlElement('w:fldChar'); fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText'); instrText.text = instr
    instrText.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    fldChar2 = OxmlElement('w:fldChar'); fldChar2.set(qn('w:fldCharType'), 'end')
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)

def set_roman_footer(sec):
    """Centered roman numeral page number at bottom."""
    ftr = sec.footer
    ftr.is_linked_to_previous = False
    clear_hf(ftr)
    p = ftr.paragraphs[0]
    page_num_field(p, WD_ALIGN_PARAGRAPH.CENTER, size=10, fmt='LowerRoman')

def set_arabic_bottom(sec):
    """Centered arabic page number at bottom (chapter first pages)."""
    ftr = sec.footer
    ftr.is_linked_to_previous = False
    clear_hf(ftr)
    p = ftr.paragraphs[0]
    page_num_field(p, WD_ALIGN_PARAGRAPH.CENTER, size=10)

def set_body_footer(sec):
    """SITS left, page# right, top rule."""
    ftr = sec.footer
    ftr.is_linked_to_previous = False
    clear_hf(ftr)
    p = ftr.paragraphs[0]
    p.clear()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(0)
    add_rule(p, 'top')
    # tab stop at right margin
    pPr = p._p.get_or_add_pPr()
    tabs = OxmlElement('w:tabs')
    tab = OxmlElement('w:tab')
    tab.set(qn('w:val'), 'right')
    tab.set(qn('w:pos'), '8640')
    tabs.append(tab)
    pPr.append(tabs)
    # left text
    r1 = p.add_run(FOOTER_LEFT)
    r1.font.name = FONT; r1.font.size = Pt(9)
    # tab
    p.add_run('\t')
    # page number field
    r2 = p.add_run()
    r2.font.name = FONT; r2.font.size = Pt(9)
    fldChar1 = OxmlElement('w:fldChar'); fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText'); instrText.text = ' PAGE '
    instrText.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    fldChar2 = OxmlElement('w:fldChar'); fldChar2.set(qn('w:fldCharType'), 'end')
    r2._r.append(fldChar1); r2._r.append(instrText); r2._r.append(fldChar2)

def set_body_header(sec):
    """Project title right-aligned with bottom rule."""
    hdr = sec.header
    hdr.is_linked_to_previous = False
    clear_hf(hdr)
    p = hdr.paragraphs[0]
    p.clear()
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(4)
    add_rule(p, 'bottom')
    r = p.add_run(HEADER_RIGHT)
    r.font.name = FONT; r.font.size = Pt(10)

def clear_header(sec):
    hdr = sec.header
    hdr.is_linked_to_previous = False
    clear_hf(hdr)
    p = hdr.paragraphs[0]
    p.clear()

def set_page_number_restart(sec, start=1, fmt='decimal'):
    """Force page number restart at given value."""
    sectPr = sec._sectPr
    pgNumType = sectPr.find(qn('w:pgNumType'))
    if pgNumType is None:
        pgNumType = OxmlElement('w:pgNumType')
        sectPr.append(pgNumType)
    pgNumType.set(qn('w:start'), str(start))
    pgNumType.set(qn('w:fmt'), fmt)

# ── The document has ONE section. We need multiple sections for different footers.
# Strategy: use Word's "different first page" + section breaks via python-docx
# Since the document was built as one section, we'll use a simpler approach:
# Apply the body style (SITS footer + header) to section 0, which covers all pages.
# Then note: for a proper submission, the student should manually set the
# first few pages to roman numerals in Word. We'll set body style throughout
# and add a note.
#
# BETTER: We'll insert proper section breaks by manipulating the XML directly.
# Section 1: Cover (no footer)
# Section 2: Prelim (roman footer)  
# Section 3: Body (SITS footer + header, arabic from 1)

# Get the document body
body = doc.element.body
children = list(body)

# Find page break elements (which correspond to chapter starts / section divides)
# We'll find the paragraph containing "Chapter 1" to know where body starts
prelim_end_idx = None   # last paragraph before Chapter 1
for i, child in enumerate(children):
    text = ''.join(t.text or '' for t in child.iter(qn('w:t')))
    if 'Chapter 1' in text and 'Chapter 2' not in text:
        prelim_end_idx = i
        break

print(f"Chapter 1 found at body child index: {prelim_end_idx}")

# ── Insert section break before Chapter 1 ────────────────────────────────────
def insert_section_break(before_element, break_type='nextPage'):
    """Insert a continuous or nextPage section break before the given element."""
    # Create a paragraph with sectPr
    new_p = OxmlElement('w:p')
    new_pPr = OxmlElement('w:pPr')
    new_sectPr = OxmlElement('w:sectPr')
    pgSz = OxmlElement('w:pgSz')
    pgSz.set(qn('w:w'), '12240')
    pgSz.set(qn('w:h'), '15840')
    new_sectPr.append(pgSz)
    pgMar = OxmlElement('w:pgMar')
    pgMar.set(qn('w:top'), '1440')
    pgMar.set(qn('w:right'), '1440')
    pgMar.set(qn('w:bottom'), '1440')
    pgMar.set(qn('w:left'), '1800')
    new_sectPr.append(pgMar)
    new_pPr.append(new_sectPr)
    new_p.append(new_pPr)
    before_element.addprevious(new_p)
    return new_p

if prelim_end_idx:
    chapter1_el = children[prelim_end_idx]
    # Insert section break paragraph before Chapter 1
    sec_break_p = insert_section_break(chapter1_el)
    print("Inserted section break before Chapter 1")

# Now re-open to get updated sections
doc.save(r"C:\Users\viraj\OneDrive\Desktop\QuickLearner_AI_Blackbook_Final2.docx")
doc2 = Document(r"C:\Users\viraj\OneDrive\Desktop\QuickLearner_AI_Blackbook_Final2.docx")

print(f"Sections after insert: {len(doc2.sections)}")

sections = doc2.sections
if len(sections) >= 2:
    sec0 = sections[0]   # Cover + Prelim
    sec1 = sections[1]   # Body (Chapters)

    # Section 0: prelim - roman footer, no header
    clear_header(sec0)
    set_roman_footer(sec0)
    set_page_number_restart(sec0, start=1, fmt='lowerRoman')

    # Section 1: body - SITS footer + project title header, arabic from 1
    set_body_header(sec1)
    set_body_footer(sec1)
    set_page_number_restart(sec1, start=1, fmt='decimal')
else:
    # Only one section - apply body style to everything
    sec = sections[0]
    set_body_header(sec)
    set_body_footer(sec)

out = r"C:\Users\viraj\OneDrive\Desktop\QuickLearner_AI_Blackbook_Final2.docx"
doc2.save(out)
print(f"Saved: {out}")
