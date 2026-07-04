# ql_helpers.py  –  shared formatting helpers for QuickLearner AI report
from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

FONT      = "Times New Roman"
BODY_SIZE = 12

def new_doc():
    doc = Document()
    sec = doc.sections[0]
    sec.page_width    = Inches(8.5)
    sec.page_height   = Inches(11)
    sec.top_margin    = Inches(1.0)
    sec.bottom_margin = Inches(1.0)
    sec.left_margin   = Inches(1.25)
    sec.right_margin  = Inches(1.0)
    return doc

# ── run helpers ──────────────────────────────────────────────────────────────
def _r(p, text, size=BODY_SIZE, bold=False, italic=False, color=None):
    r = p.add_run(text)
    r.font.name   = FONT
    r.font.size   = Pt(size)
    r.font.bold   = bold
    r.font.italic = italic
    if color:
        r.font.color.rgb = RGBColor(*color)
    return r

def _sup(p, text):
    r = p.add_run(text)
    r.font.name = FONT
    r.font.size = Pt(8)
    rPr = r._r.get_or_add_rPr()
    v = OxmlElement('w:vertAlign')
    v.set(qn('w:val'), 'superscript')
    rPr.append(v)
    return r

# ── paragraph helpers ────────────────────────────────────────────────────────
def _p(doc, align=WD_ALIGN_PARAGRAPH.LEFT, sb=0, sa=0, indent=0, keep_next=False):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before  = Pt(sb)
    p.paragraph_format.space_after   = Pt(sa)
    if indent:
        p.paragraph_format.first_line_indent = Pt(indent)
    if keep_next:
        p.paragraph_format.keep_with_next = True
    return p

def body(doc, text, sb=0, sa=6):
    p = _p(doc, WD_ALIGN_PARAGRAPH.JUSTIFY, sb=sb, sa=sa, indent=18)
    _r(p, text)
    return p

def body_noindent(doc, text, sb=0, sa=6):
    p = _p(doc, WD_ALIGN_PARAGRAPH.JUSTIFY, sb=sb, sa=sa)
    _r(p, text)
    return p

def bullet(doc, text, sb=0, sa=3):
    p = doc.add_paragraph(style='List Bullet')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(sb)
    p.paragraph_format.space_after  = Pt(sa)
    _r(p, text)
    return p

def numbered(doc, text, sb=0, sa=3):
    p = doc.add_paragraph(style='List Number')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(sb)
    p.paragraph_format.space_after  = Pt(sa)
    _r(p, text)
    return p

# ── chapter / section headings ───────────────────────────────────────────────
def chapter_heading(doc, num, title):
    """'Chapter N'  then  'TITLE' – each on own paragraph, large fonts."""
    doc.add_page_break()
    p1 = _p(doc, WD_ALIGN_PARAGRAPH.LEFT, sb=60, sa=6, keep_next=True)
    _r(p1, f"Chapter {num}", size=24, bold=False)
    p2 = _p(doc, WD_ALIGN_PARAGRAPH.LEFT, sb=6, sa=18, keep_next=True)
    _r(p2, title.upper(), size=24, bold=False)
    return p2

def section(doc, num, title, sb=12, sa=6):
    p = _p(doc, WD_ALIGN_PARAGRAPH.LEFT, sb=sb, sa=sa)
    _r(p, f"{num}  {title}", size=14, bold=False)
    return p

def subsection(doc, num, title, sb=8, sa=4):
    p = _p(doc, WD_ALIGN_PARAGRAPH.LEFT, sb=sb, sa=sa)
    _r(p, f"{num}  {title}", size=12, bold=True)
    return p

# ── large-title pages (Abstract, List of …) ─────────────────────────────────
def big_title_page(doc, title):
    doc.add_page_break()
    p = _p(doc, WD_ALIGN_PARAGRAPH.LEFT, sb=72, sa=24)
    _r(p, title, size=24, bold=False)
    return p

# ── figure caption ───────────────────────────────────────────────────────────
def fig_caption(doc, num, text):
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=4, sa=10)
    _r(p, f"Figure {num}: {text}", size=11, italic=False)
    return p

def table_caption(doc, num, text):
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=10, sa=4)
    _r(p, f"Table {num}: {text}", size=11, italic=False)
    return p

# ── header / footer ──────────────────────────────────────────────────────────
def set_header(section_obj, right_text):
    hdr = section_obj.header
    hdr.is_linked_to_previous = False
    for p in hdr.paragraphs:
        p.clear()
    if not hdr.paragraphs:
        p = hdr.add_paragraph()
    else:
        p = hdr.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    _r(p, right_text, size=10)
    # bottom border on header
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bot = OxmlElement('w:bottom')
    bot.set(qn('w:val'), 'single'); bot.set(qn('w:sz'), '4')
    bot.set(qn('w:space'), '1');    bot.set(qn('w:color'), '000000')
    pBdr.append(bot); pPr.append(pBdr)

def set_footer(section_obj, left_text):
    ftr = section_obj.footer
    ftr.is_linked_to_previous = False
    for p in ftr.paragraphs:
        p.clear()
    if not ftr.paragraphs:
        p = ftr.add_paragraph()
    else:
        p = ftr.paragraphs[0]
    p.clear()
    # top border
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    top = OxmlElement('w:top')
    top.set(qn('w:val'), 'single'); top.set(qn('w:sz'), '4')
    top.set(qn('w:space'), '1');    top.set(qn('w:color'), '000000')
    pBdr.append(top); pPr.append(pBdr)
    # tab stops: right at page width - margins
    tabs_el = OxmlElement('w:tabs')
    tab = OxmlElement('w:tab')
    tab.set(qn('w:val'), 'right'); tab.set(qn('w:pos'), '8640')
    tabs_el.append(tab); pPr.append(tabs_el)
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    _r(p, left_text, size=10)
    p.add_run('\t')
    # page number field
    fldChar1 = OxmlElement('w:fldChar'); fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText'); instrText.text = ' PAGE '
    fldChar2 = OxmlElement('w:fldChar'); fldChar2.set(qn('w:fldCharType'), 'end')
    run = p.add_run()
    run.font.name = FONT; run.font.size = Pt(10)
    run._r.append(fldChar1); run._r.append(instrText); run._r.append(fldChar2)

# ── simple bordered table ─────────────────────────────────────────────────────
def make_table(doc, headers, rows, col_widths=None):
    t = doc.add_table(rows=1+len(rows), cols=len(headers))
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    # header row
    for i, h in enumerate(headers):
        c = t.rows[0].cells[i]
        c.text = ''
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        _r(p, h, size=11, bold=True)
        c._tc.get_or_add_tcPr()
    # data rows
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            c = t.rows[ri+1].cells[ci]
            c.text = ''
            p = c.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            _r(p, str(val), size=11)
    if col_widths:
        for ri in range(len(t.rows)):
            for ci, w in enumerate(col_widths):
                t.rows[ri].cells[ci].width = Inches(w)
    return t

# ── image placeholder (empty bordered box for manual image insertion) ─────────
def img_placeholder(doc, fig_num, caption, description=""):
    """A centered bordered table cell acting as an image insertion space."""
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    t = doc.add_table(rows=1, cols=1)
    t.style = 'Table Grid'
    from docx.enum.table import WD_TABLE_ALIGNMENT
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = t.rows[0].cells[0]
    cell.width = Inches(5.8)
    # Set row height
    tr = t.rows[0]._tr
    trPr = tr.get_or_add_trPr()
    trHeight = OxmlElement('w:trHeight')
    trHeight.set(qn('w:val'), '3600')   # ~2.5 inches in twips
    trHeight.set(qn('w:hRule'), 'exact')
    trPr.append(trHeight)
    # shade cell light grey
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), 'F2F2F2')
    tcPr.append(shd)
    # placeholder text
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(40)
    run = p.add_run(f"[ Insert Screenshot: Figure {fig_num} ]")
    run.font.name = FONT
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(0x88, 0x88, 0x88)
    # caption below
    p_cap = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=4, sa=4)
    _r(p_cap, f"Figure {fig_num}: {caption}", size=11)
    # description
    if description:
        p_desc = _p(doc, WD_ALIGN_PARAGRAPH.JUSTIFY, sb=0, sa=10, indent=18)
        _r(p_desc, description, size=12)
def ascii_diagram(doc, lines, caption=""):
    t = doc.add_table(rows=1, cols=1)
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = t.rows[0].cells[0]
    c.width = Inches(5.5)
    c.text = ''
    for line in lines:
        p = c.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after  = Pt(0)
        run = p.add_run(line)
        run.font.name = 'Courier New'
        run.font.size = Pt(9)
    if caption:
        doc.add_paragraph()
        fig_caption(doc, caption[0], caption[1])
