# ch00_prelim.py
import sys
sys.path.insert(0, r'C:\ai-agent')
from ql_helpers import *
from ql_helpers import _p, _r, _sup
from docx.enum.text import WD_ALIGN_PARAGRAPH

def write_prelim(doc):

    # ═══════════════════════════════════════════════
    # ABSTRACT  (page ii)
    # ═══════════════════════════════════════════════
    big_title_page(doc, "Abstract")

    body(doc,
        "In the contemporary era of digital learning, students face significant challenges "
        "in organising study material, retaining information, and tracking academic progress "
        "effectively. Traditional study approaches such as passive reading, manual note-taking, "
        "and static flashcard applications fail to harness the potential of artificial "
        "intelligence for personalised education. QuickLearner AI is a full-stack intelligent "
        "learning agent designed to bridge this gap by integrating Google Gemini's large "
        "language model capabilities with a responsive web-based interface. The system provides "
        "ten tightly integrated features: an AI Chat Assistant for real-time question answering, "
        "an AI Quiz Generator for self-assessment, AI-powered Flashcards for active recall, "
        "an AI Notes Highlighter to identify key concepts, an AI Text Summariser for condensing "
        "lengthy content, a Study Analytics dashboard for visualising learning patterns, "
        "Daily Goals for structured planning, a Daily Streak mechanism for motivation, "
        "a unified Dashboard for quick overview, and Progress Tracking for longitudinal "
        "performance monitoring. The backend is implemented using FastAPI with SQLAlchemy ORM "
        "and SQLite for persistent data storage, while the frontend leverages React.js with "
        "Tailwind CSS for a modern, responsive user interface. The Gemini API provides the "
        "generative AI backbone for all content-creation features. The system demonstrates "
        "that combining large language model technology with thoughtful UX design can "
        "significantly improve the quality and efficiency of independent student learning.")

    p = _p(doc, WD_ALIGN_PARAGRAPH.JUSTIFY, sb=10, sa=6, indent=18)
    _r(p, "Keywords : ", size=12, bold=True)
    _r(p, "AI Learning Agent, Large Language Models, Google Gemini API, FastAPI, React.js, "
        "Flashcard Generation, Quiz Generator, Text Summarisation, Study Analytics, "
        "Personalised Learning, SQLite, Tailwind CSS", size=12)

    # ═══════════════════════════════════════════════
    # LIST OF ABBREVIATIONS  (page iii)
    # ═══════════════════════════════════════════════
    big_title_page(doc, "List of Abbreviations")
    _p(doc, sa=12)

    abbrevs = [
        ("AI",      "Artificial Intelligence"),
        ("API",     "Application Programming Interface"),
        ("LLM",     "Large Language Model"),
        ("UI",      "User Interface"),
        ("UX",      "User Experience"),
        ("URL",     "Uniform Resource Locator"),
        ("HTTP",    "HyperText Transfer Protocol"),
        ("HTTPS",   "HyperText Transfer Protocol Secure"),
        ("DB",      "Database"),
        ("ORM",     "Object-Relational Mapping"),
        ("SDLC",    "Software Development Life Cycle"),
        ("UML",     "Unified Modeling Language"),
        ("DFD",     "Data Flow Diagram"),
        ("CRUD",    "Create, Read, Update, Delete"),
        ("JSON",    "JavaScript Object Notation"),
        ("REST",    "Representational State Transfer"),
        ("SRS",     "Software Requirements Specification"),
        ("ER",      "Entity-Relationship"),
        ("SPA",     "Single Page Application"),
        ("CSS",     "Cascading Style Sheets"),
        ("JWT",     "JSON Web Token"),
        ("NLP",     "Natural Language Processing"),
        ("ML",      "Machine Learning"),
        ("CORS",    "Cross-Origin Resource Sharing"),
        ("ASGI",    "Asynchronous Server Gateway Interface"),
    ]
    for abbr, full in abbrevs:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after  = Pt(2)
        _r(p, f"{abbr}", size=12, bold=True)
        _r(p, f" \u2013 {full}", size=12)

    # ═══════════════════════════════════════════════
    # LIST OF FIGURES  (page iv)
    # ═══════════════════════════════════════════════
    big_title_page(doc, "List of Figures")
    _p(doc, sa=12)

    figures = [
        ("1.1",  "Problem Definition for QuickLearner AI",           "3"),
        ("3.1",  "QuickLearner AI SDLC Model",                       "12"),
        ("4.1",  "Block Diagram for QuickLearner AI",                 "15"),
        ("4.2",  "Level 0 Data Flow Diagram (Context Diagram)",       "17"),
        ("4.3",  "Level 1 Data Flow Diagram",                        "18"),
        ("4.4",  "Level 2 Data Flow Diagram – AI Feature Module",     "19"),
        ("4.5",  "UML Use Case Diagram",                              "20"),
        ("4.6",  "UML Activity Diagram",                              "21"),
        ("4.7",  "UML Sequence Diagram – Quiz Generation Flow",       "22"),
        ("4.8",  "Entity-Relationship (ER) Diagram",                  "23"),
        ("4.9",  "System Architecture Diagram",                       "24"),
        ("6.1",  "Dashboard – QuickLearner AI Home",                  "35"),
        ("6.2",  "AI Chat Assistant Interface",                       "36"),
        ("6.3",  "AI Quiz Generator",                                 "37"),
        ("6.4",  "AI Flashcard Module",                               "38"),
        ("6.5",  "AI Text Summariser",                                "39"),
        ("6.6",  "AI Notes Highlighter",                              "40"),
        ("6.7",  "Study Analytics Dashboard",                         "41"),
        ("6.8",  "Daily Goals and Streak Tracker",                    "42"),
        ("8.1",  "Dashboard Overview (Result Screenshot)",            "55"),
        ("8.2",  "AI Chat Response (Result Screenshot)",              "56"),
        ("8.3",  "Generated Quiz (Result Screenshot)",                "57"),
        ("8.4",  "Flashcard View (Result Screenshot)",                "58"),
        ("8.5",  "Analytics Graph (Result Screenshot)",               "59"),
    ]

    for num, caption, pg in figures:
        t = doc.add_table(rows=1, cols=3)
        t.style = 'Table Grid'
        # remove borders
        from docx.oxml import OxmlElement as OE
        from docx.oxml.ns import qn as QN
        for el in t._tbl.iter():
            if el.tag.endswith('}tbl'):
                tPr = el.find(QN('w:tblPr'))
                if tPr is None: tPr = OE('w:tblPr'); el.insert(0, tPr)
                tb = OE('w:tblBorders')
                for bn in ['top','left','bottom','right','insideH','insideV']:
                    b = OE(f'w:{bn}'); b.set(QN('w:val'),'none'); tb.append(b)
                tPr.append(tb); break
        t.rows[0].cells[0].width = Inches(0.7)
        t.rows[0].cells[1].width = Inches(4.5)
        t.rows[0].cells[2].width = Inches(0.8)
        c0 = t.rows[0].cells[0]; c0.text=''; _r(c0.paragraphs[0], num, size=11)
        c1 = t.rows[0].cells[1]; c1.text=''; _r(c1.paragraphs[0], caption, size=11)
        c2 = t.rows[0].cells[2]; c2.text=''
        c2.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
        _r(c2.paragraphs[0], pg, size=11)

    # ═══════════════════════════════════════════════
    # LIST OF TABLES  (page v)
    # ═══════════════════════════════════════════════
    big_title_page(doc, "List of Tables")
    _p(doc, sa=12)

    tables = [
        ("2.1",  "Literature Survey Summary",                        "9"),
        ("5.1",  "Risk Probability and Impact Matrix",               "30"),
        ("5.2",  "Project Timeline and Milestones",                  "31"),
        ("7.1",  "AI Chat Module Test Cases",                        "46"),
        ("7.2",  "Quiz Generator Test Cases",                        "47"),
        ("7.3",  "API Endpoint Test Cases",                          "47"),
        ("7.4",  "System Performance Evaluation",                    "48"),
    ]
    for num, caption, pg in tables:
        t = doc.add_table(rows=1, cols=3)
        t.style = 'Table Grid'
        from docx.oxml import OxmlElement as OE
        from docx.oxml.ns import qn as QN
        for el in t._tbl.iter():
            if el.tag.endswith('}tbl'):
                tPr = el.find(QN('w:tblPr'))
                if tPr is None: tPr = OE('w:tblPr'); el.insert(0, tPr)
                tb = OE('w:tblBorders')
                for bn in ['top','left','bottom','right','insideH','insideV']:
                    b = OE(f'w:{bn}'); b.set(QN('w:val'),'none'); tb.append(b)
                tPr.append(tb); break
        t.rows[0].cells[0].width = Inches(0.7)
        t.rows[0].cells[1].width = Inches(4.5)
        t.rows[0].cells[2].width = Inches(0.8)
        c0 = t.rows[0].cells[0]; c0.text=''; _r(c0.paragraphs[0], num, size=11)
        c1 = t.rows[0].cells[1]; c1.text=''; _r(c1.paragraphs[0], caption, size=11)
        c2 = t.rows[0].cells[2]; c2.text=''
        c2.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
        _r(c2.paragraphs[0], pg, size=11)

    # ═══════════════════════════════════════════════
    # CONTENTS  (page vi)
    # ═══════════════════════════════════════════════
    big_title_page(doc, "Contents")
    _p(doc, sa=8)

    toc_entries = [
        (0, "Acknowledgement",                    "i"),
        (0, "Abstract",                           "ii"),
        (0, "List of Abbreviations",              "iii"),
        (0, "List of Figures",                    "iv"),
        (0, "List of Tables",                     "v"),
        (1, "1   INTRODUCTION",                   "1"),
        (2, "1.1   Overview",                     "1"),
        (2, "1.2   Motivation",                   "2"),
        (2, "1.3   Problem Definition and Objectives", "2"),
        (2, "1.4   Project Scope and Limitations", "3"),
        (2, "1.5   Methodologies of Problem Solving", "4"),
        (1, "2   LITERATURE SURVEY",              "5"),
        (2, "2.1   Literature Survey",            "5"),
        (3, "2.1.1   AI Chatbots and Conversational Agents", "5"),
        (3, "2.1.2   Automated Quiz and Flashcard Generation", "6"),
        (3, "2.1.3   Text Summarisation using LLMs", "6"),
        (3, "2.1.4   Learning Analytics Platforms", "7"),
        (3, "2.1.5   Gamification in E-Learning", "7"),
        (2, "2.2   Summary of Literature Review", "8"),
        (1, "3   SOFTWARE REQUIREMENTS SPECIFICATION", "9"),
        (2, "3.1   Assumptions and Dependencies",  "9"),
        (2, "3.2   Functional Requirements",       "9"),
        (3, "3.2.1   Feature 1: AI Chat Assistant","9"),
        (3, "3.2.2   Feature 2: Quiz Generator",   "10"),
        (3, "3.2.3   Feature 3: Flashcards and Summariser", "10"),
        (2, "3.3   External Interface Requirements","10"),
        (2, "3.4   Non-Functional Requirements",   "11"),
        (1, "4   SYSTEM DESIGN",                   "13"),
        (2, "4.1   Block Diagram",                 "13"),
        (2, "4.2   Data Flow Diagrams",            "15"),
        (2, "4.3   UML Diagrams",                  "18"),
        (2, "4.4   ER Diagram",                    "21"),
        (2, "4.5   System Architecture",           "23"),
        (1, "5   PROJECT PLANNING",                "26"),
        (2, "5.1   SDLC Model",                    "26"),
        (2, "5.2   Risk Analysis",                 "28"),
        (2, "5.3   Project Timeline",              "30"),
        (1, "6   PROJECT IMPLEMENTATION",          "33"),
        (2, "6.1   Development Environment",       "33"),
        (2, "6.2   Backend Implementation",        "34"),
        (2, "6.3   Frontend Implementation",       "37"),
        (2, "6.4   AI Integration",                "40"),
        (2, "6.5   Screenshots",                   "42"),
        (1, "7   SOFTWARE TESTING",                "45"),
        (2, "7.1   Type of Testing",               "45"),
        (2, "7.2   Test Cases",                    "46"),
        (2, "7.3   System Evaluation",             "48"),
        (2, "7.4   Testing Execution",             "49"),
        (1, "8   RESULTS",                         "52"),
        (2, "8.1   Outcomes",                      "52"),
        (2, "8.2   Screenshots",                   "54"),
        (1, "9   CONCLUSIONS",                     "60"),
        (2, "9.1   Conclusions",                   "60"),
        (2, "9.2   Future Work",                   "61"),
        (2, "9.3   Applications",                  "62"),
        (0, "A   Appendix: Assignments",           "63"),
        (0, "B   Appendix: Publications",          "65"),
        (0, "C   Appendix: Certificates",          "67"),
        (0, "D   Appendix: Plagiarism Report",     "68"),
        (0, "Bibliography",                        "69"),
    ]

    for level, entry, pg in toc_entries:
        t = doc.add_table(rows=1, cols=2)
        t.style = 'Table Grid'
        from docx.oxml import OxmlElement as OE
        from docx.oxml.ns import qn as QN
        for el in t._tbl.iter():
            if el.tag.endswith('}tbl'):
                tPr = el.find(QN('w:tblPr'))
                if tPr is None: tPr = OE('w:tblPr'); el.insert(0, tPr)
                tb = OE('w:tblBorders')
                for bn in ['top','left','bottom','right','insideH','insideV']:
                    b = OE(f'w:{bn}'); b.set(QN('w:val'),'none'); tb.append(b)
                tPr.append(tb); break
        indent_inches = [0, 0, 0.3, 0.6]
        t.rows[0].cells[0].width = Inches(5.8)
        t.rows[0].cells[1].width = Inches(0.7)
        c0 = t.rows[0].cells[0]; c0.text = ''
        p0 = c0.paragraphs[0]
        p0.paragraph_format.left_indent = Inches(indent_inches[level])
        p0.paragraph_format.space_before = Pt(1)
        p0.paragraph_format.space_after  = Pt(1)
        sz = 12 if level <= 1 else 11
        _r(p0, entry, size=sz, bold=(level==1))
        c1 = t.rows[0].cells[1]; c1.text = ''
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p1.paragraph_format.space_before = Pt(1)
        p1.paragraph_format.space_after  = Pt(1)
        _r(p1, pg, size=sz)

