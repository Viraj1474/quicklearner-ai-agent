# ch00_frontmatter.py
import sys
sys.path.insert(0, r'C:\ai-agent')
from ql_helpers import *
from ql_helpers import _p, _r, _sup, body, set_footer, FONT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

def write_frontmatter(doc):
    sec = doc.sections[0]

    # ═══════════════════════════════════════════════════════
    # PAGE 1 – COVER
    # ═══════════════════════════════════════════════════════
    # top-left reference number
    p = _p(doc, WD_ALIGN_PARAGRAPH.LEFT, sb=0, sa=0)
    _r(p, "SITS/Computer Engineering/Projects/UG/2025-26/GNo.B15", size=10, bold=True)

    # spacer
    for _ in range(4): _p(doc, sa=0)

    # "A Project Report on"
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=0)
    _r(p, "A Project Report", size=12)
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=0)
    _r(p, "on", size=12)

    # project title
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=6, sa=6)
    _r(p, "QUICKLEARNER AI", size=28, bold=True)
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=0)
    _r(p, "(AI Learning Agent)", size=16)

    # spacer
    for _ in range(4): _p(doc, sa=0)

    # "By"
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=6, sa=6)
    _r(p, "By", size=12, bold=True)

    # student table
    students = [
        ("Mr. Viraj Kulye",    "Exam Seat No B400570243"),
        ("Mr. Pranav Lawand",  "Exam Seat No B400570308"),
        ("Ms. Janhavi Lande",  "Exam Seat No B400570319"),
        ("Mr. Kunal Khopade",  "Exam Seat No B400570353"),
    ]
    t = doc.add_table(rows=4, cols=2)
    t.style = 'Table Grid'
    for cell in t._tbl.iter():
        if cell.tag.endswith('}tbl'):
            tblPr = cell.find(qn('w:tblPr'))
            if tblPr is None:
                tblPr = OxmlElement('w:tblPr')
                cell.insert(0, tblPr)
            tblBorders = OxmlElement('w:tblBorders')
            for bname in ['top','left','bottom','right','insideH','insideV']:
                b = OxmlElement(f'w:{bname}')
                b.set(qn('w:val'), 'none')
                tblBorders.append(b)
            tblPr.append(tblBorders)
            break
    for ri, (name, seat) in enumerate(students):
        c0 = t.rows[ri].cells[0]; c0.text = ''
        p0 = c0.paragraphs[0]; p0.alignment = WD_ALIGN_PARAGRAPH.LEFT
        _r(p0, name, size=12)
        c1 = t.rows[ri].cells[1]; c1.text = ''
        p1 = c1.paragraphs[0]; p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        _r(p1, seat, size=12)

    for _ in range(4): _p(doc, sa=0)

    # guide
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=6, sa=2)
    _r(p, "Guide", size=12, bold=True)
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=0)
    _r(p, "Mrs. S. S. Navale", size=12)

    for _ in range(3): _p(doc, sa=0)

    # placeholder for logo (text box)
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=6, sa=2)
    _r(p, "[Sinhgad Institutes Logo]", size=11, italic=True)
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=2)
    _r(p, "Sinhgad Institutes", size=16, bold=True)

    for _ in range(2): _p(doc, sa=0)

    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=4, sa=2)
    _r(p, "Department of Computer Engineering", size=14, bold=True)
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=2)
    _r(p, "Sinhgad Institute of Technology and Science", size=14, bold=True)
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=2)
    _r(p, "Pune 411 041", size=14, bold=True)
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=0)
    _r(p, "[2025-26]", size=14, bold=True)

    # ═══════════════════════════════════════════════════════
    # PAGE 2 – CERTIFICATE
    # ═══════════════════════════════════════════════════════
    doc.add_page_break()
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=4)
    _r(p, "[Sinhgad Institutes Logo]", size=11, italic=True)
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=12)
    _r(p, "Sinhgad Institutes", size=20, bold=True)

    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=6, sa=12)
    _r(p, "C E R T I F I C A T E", size=16, bold=True)

    # certify paragraph
    p = _p(doc, WD_ALIGN_PARAGRAPH.JUSTIFY, sb=0, sa=8, indent=18)
    _r(p, "This is to certify that ", size=12)
    _r(p, "Mr. VIRAJ KULYE", size=12, bold=True, italic=True)
    _r(p, " Exam No B400570243, ", size=12)
    _r(p, "Mr. PRANAV LAWAND", size=12, bold=True, italic=True)
    _r(p, " Exam No B400570308, ", size=12)
    _r(p, "Ms. JANHAVI LANDE", size=12, bold=True, italic=True)
    _r(p, " Exam No B400570319, ", size=12)
    _r(p, "Mr. KUNAL KHOPADE", size=12, bold=True, italic=True)
    _r(p, " Exam No B400570353 have successfully completed the Project Stage-II entitled ", size=12)
    _r(p, "QuickLearner AI — AI Learning Agent", size=12, bold=True, italic=True)
    _r(p, " under my supervision, in the fulfillment of Bachelor of Computer Engineering of Savitribai Phule Pune University.", size=12)

    p = _p(doc, WD_ALIGN_PARAGRAPH.LEFT, sb=12, sa=4)
    _r(p, "Date :", size=12)
    p = _p(doc, WD_ALIGN_PARAGRAPH.LEFT, sb=0, sa=0)
    _r(p, "Place :", size=12)

    for _ in range(5): _p(doc, sa=0)

    # 4-signature block via table
    sig = doc.add_table(rows=3, cols=2)
    sig.style = 'Table Grid'
    # remove borders
    for cell in sig._tbl.iter():
        if cell.tag.endswith('}tbl'):
            tblPr2 = cell.find(qn('w:tblPr'))
            if tblPr2 is None:
                tblPr2 = OxmlElement('w:tblPr'); cell.insert(0, tblPr2)
            tb2 = OxmlElement('w:tblBorders')
            for bn in ['top','left','bottom','right','insideH','insideV']:
                b2 = OxmlElement(f'w:{bn}'); b2.set(qn('w:val'), 'none'); tb2.append(b2)
            tblPr2.append(tb2); break

    def sig_cell(row, col, name, role):
        c = sig.rows[row].cells[col]; c.text = ''
        p = c.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        _r(p, name, size=12)
        p2 = c.add_paragraph(); p2.alignment = WD_ALIGN_PARAGRAPH.LEFT
        _r(p2, role, size=12)

    sig_cell(0, 0, "Mrs. S. S. Navale", "Guide")
    sig_cell(0, 1, "Mrs. A. R. Kamble", "Head of Department")
    sig_cell(1, 0, "External Examiner", "")
    sig_cell(1, 1, "Dr. S. D. Markande", "Principal")
    sig_cell(2, 1, "Sinhgad Institute of Technology and Science, Pune 411041", "")

    # ═══════════════════════════════════════════════════════
    # PAGE 3 – ACKNOWLEDGEMENT  (roman page i)
    # ═══════════════════════════════════════════════════════
    doc.add_page_break()
    p = _p(doc, WD_ALIGN_PARAGRAPH.CENTER, sb=30, sa=18)
    _r(p, "ACKNOWLEDGEMENT", size=16, bold=True)

    body(doc,
        "We take this opportunity with great pleasure to express our deep sense of gratitude "
        "towards our guide "
    )
    # rebuild with inline italic
    doc.paragraphs[-1].clear()
    p = _p(doc, WD_ALIGN_PARAGRAPH.JUSTIFY, sb=0, sa=8, indent=18)
    _r(p, "We take this opportunity with great pleasure to express our deep sense of gratitude "
        "towards our guide ")
    _r(p, "Mrs. S. S. Navale", size=12, italic=True)
    _r(p, " for her valuable guidance, incessant encouragement and co-operation extended to us "
        "during this project work.")

    p = _p(doc, WD_ALIGN_PARAGRAPH.JUSTIFY, sb=0, sa=8, indent=18)
    _r(p, "We are also thankful to ")
    _r(p, "Mrs. A. R. Kamble", size=12, italic=True)
    _r(p, " Head, Computer Engineering Department, for providing all departmental facilities "
        "for this work.")

    p = _p(doc, WD_ALIGN_PARAGRAPH.JUSTIFY, sb=0, sa=20, indent=18)
    _r(p, "We would also like to thank ")
    _r(p, "Dr. S. D. Markande", size=12, italic=True)
    _r(p, " Principal, Sinhgad Institute of Technology and Science for his unflinching help, "
        "support and cooperation during the project work.")

    for _ in range(4): _p(doc, sa=0)

    names = ["VIRAJ KULYE", "PRANAV LAWAND", "JANHAVI LANDE", "KUNAL KHOPADE"]
    for n in names:
        p = _p(doc, WD_ALIGN_PARAGRAPH.RIGHT, sb=6, sa=2)
        _r(p, "-", size=12)
        p.add_run("   ")
        _r(p, n, size=12, bold=True)

    # roman page number footer
    ack_sec = doc.sections[0]
    set_footer(ack_sec, "")
    ftr = ack_sec.footer
    if ftr.paragraphs:
        fp = ftr.paragraphs[0]
        fp.clear()
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        _r(fp, "i", size=10)
