# ppt_slides_a.py  (slides 1-10)
import sys; sys.path.insert(0, r'C:\ai-agent')
from ppt_helpers import *

def arrow_h(s, x1, y, x2, color=BLACK, lbl=''):
    """Horizontal arrow from x1 to x2."""
    ln = s.shapes.add_connector(1, x1, y, x2, y)
    ln.line.color.rgb = color; ln.line.width = Pt(1.5)
    if lbl:
        body_text(s, lbl, min(x1,x2)+Inches(0.05), y-Inches(0.28),
                  abs(x2-x1)-Inches(0.1), Inches(0.26), size=10, color=color)

def arrow_v(s, x, y1, y2, color=BLACK, lbl=''):
    ln = s.shapes.add_connector(1, x, y1, x, y2)
    ln.line.color.rgb = color; ln.line.width = Pt(1.5)
    if lbl:
        body_text(s, lbl, x+Inches(0.05), min(y1,y2)+Inches(0.05),
                  Inches(1.4), Inches(0.26), size=10, color=color)

def proc_box(s, x, y, w, h, label, fc=None, lc=None, tsize=13):
    fc = fc or LBLUE; lc = lc or BLUE
    bx = s.shapes.add_shape(1, x, y, w, h)
    bx.fill.solid(); bx.fill.fore_color.rgb = fc
    bx.line.color.rgb = lc; bx.line.width = Pt(1.5)
    body_text(s, label, x+Inches(0.06), y+Inches(0.05),
              w-Inches(0.12), h-Inches(0.1), size=tsize,
              bold=True, color=BLUE if fc==LBLUE else WHITE, align=PP_ALIGN.CENTER)

def proc_oval(s, x, y, w, h, label, fc=None, lc=None, tsize=13):
    fc = fc or BLUE; lc = lc or BLACK
    bx = s.shapes.add_shape(9, x, y, w, h)  # oval
    bx.fill.solid(); bx.fill.fore_color.rgb = fc
    bx.line.color.rgb = lc; bx.line.width = Pt(1.5)
    body_text(s, label, x+Inches(0.06), y+Inches(0.08),
              w-Inches(0.12), h-Inches(0.16), size=tsize,
              bold=True, color=WHITE, align=PP_ALIGN.CENTER)

def build_slides_a(prs):

    # ── SLIDE 1: Title ────────────────────────────────────────────────────────
    s = blank_slide(prs)
    add_logos(s); add_header_line(s); add_college_text(s)
    body_text(s, "QUICKLEARNER AI", Inches(0.3), Inches(1.25),
              Inches(9.4), Inches(0.95), size=46, bold=True, color=BLUE, align=PP_ALIGN.CENTER)
    body_text(s, "(AI Learning Agent)", Inches(0.3), Inches(2.2),
              Inches(9.4), Inches(0.5), size=22, color=BLACK, align=PP_ALIGN.CENTER)
    div = s.shapes.add_shape(1, Inches(1.2), Inches(2.82), Inches(7.6), Pt(2))
    div.fill.solid(); div.fill.fore_color.rgb = BLUE; div.line.fill.background()
    body_text(s, "By", Inches(4.5), Inches(2.98), Inches(1), Inches(0.38),
              size=15, bold=True, color=BLACK, align=PP_ALIGN.CENTER)
    members = [("Mr. Viraj Kulye","B400570243"),("Mr. Pranav Lawand","B400570308"),
               ("Ms. Janhavi Lande","B400570319"),("Mr. Kunal Khopade","B400570353")]
    for i,(name,seat) in enumerate(members):
        y = Inches(3.42)+i*Inches(0.38)
        body_text(s, name, Inches(2.0), y, Inches(3.4), Inches(0.36), size=14, color=BLACK)
        body_text(s, f"Exam Seat No  {seat}", Inches(5.5), y, Inches(3.5), Inches(0.36), size=14, color=BLACK)
    body_text(s, "Guide : Mrs. S. S. Navale", Inches(3.2), Inches(5.05),
              Inches(3.6), Inches(0.38), size=15, bold=True, color=BLACK, align=PP_ALIGN.CENTER)
    add_footer(s, "28/6/2026")

    # ── SLIDE 2: Contents ────────────────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Content", 1)
    col1 = ["01  Introduction of Group Members","02  Introduction of Project Topic",
            "03  Problem Statement","04  Literature Survey","05  Motivation",
            "06  Software & Hardware Requirements","07  System Architecture"]
    col2 = ["08  Data Flow Diagram (Level 0, 1, 2)","09  Use Case Diagram",
            "10  Sequence Diagram","11  Mathematical Model",
            "12  Proposed Algorithm","13  Objectives & Scope",
            "14  Implementation Results","15  Conclusion"]
    for i,it in enumerate(col1):
        y = Inches(2.08)+i*Inches(0.66)
        bx = s.shapes.add_shape(1, Inches(0.4), y, Inches(4.4), Inches(0.56))
        bx.fill.solid(); bx.fill.fore_color.rgb = LBLUE if i%2==0 else WHITE
        bx.line.color.rgb = BLUE; bx.line.width = Pt(0.5)
        body_text(s, it, Inches(0.55), y+Pt(5), Inches(4.2), Inches(0.48), size=15, color=BLACK)
    for i,it in enumerate(col2):
        y = Inches(2.08)+i*Inches(0.58)
        bx = s.shapes.add_shape(1, Inches(5.1), y, Inches(4.5), Inches(0.48))
        bx.fill.solid(); bx.fill.fore_color.rgb = LBLUE if i%2==0 else WHITE
        bx.line.color.rgb = BLUE; bx.line.width = Pt(0.5)
        body_text(s, it, Inches(5.25), y+Pt(4), Inches(4.3), Inches(0.4), size=14, color=BLACK)

    # ── SLIDE 3: Group Members ────────────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Introduction of Group Members", 2)
    members_full = [
        ("Mr. Viraj Kulye",   "B400570243", "Full-Stack Dev & AI Integration"),
        ("Mr. Pranav Lawand", "B400570308", "Backend API & Database Design"),
        ("Ms. Janhavi Lande", "B400570319", "Frontend UI/UX & React"),
        ("Mr. Kunal Khopade", "B400570353", "Testing & Documentation"),
    ]
    hdrs = ["Name","Exam Seat No.","Role","Dept."]
    col_x = [Inches(0.3),Inches(3.0),Inches(5.2),Inches(7.7)]
    col_w = [Inches(2.65),Inches(2.15),Inches(2.45),Inches(2.0)]
    for j,(h,x,w) in enumerate(zip(hdrs,col_x,col_w)):
        bx = s.shapes.add_shape(1,x,Inches(2.05),w,Inches(0.44))
        bx.fill.solid(); bx.fill.fore_color.rgb = BLUE; bx.line.fill.background()
        body_text(s,h,x+Inches(0.05),Inches(2.07),w,Inches(0.4),size=14,bold=True,color=WHITE,align=PP_ALIGN.CENTER)
    for i,(name,seat,role) in enumerate(members_full):
        y = Inches(2.55)+i*Inches(0.75)
        fc = LBLUE if i%2==0 else WHITE
        row_vals = [name, seat, role, "B.E. Comp.Engg"]
        for j,(v,x,w) in enumerate(zip(row_vals,col_x,col_w)):
            bx = s.shapes.add_shape(1,x,y,w,Inches(0.68))
            bx.fill.solid(); bx.fill.fore_color.rgb = fc
            bx.line.color.rgb = BLUE; bx.line.width = Pt(0.5)
            body_text(s,v,x+Inches(0.06),y+Pt(4),w-Inches(0.1),Inches(0.62),size=13,color=BLACK)
    body_text(s,"Guide: Mrs. S. S. Navale   |   HOD: Mrs. A. R. Kamble   |   Principal: Dr. S. D. Markande",
              Inches(0.3),Inches(6.45),Inches(9.4),Inches(0.38),size=13,color=BLUE,align=PP_ALIGN.CENTER)

    # ── SLIDE 4: Introduction ─────────────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Introduction", 3)
    body_text(s,
        "QuickLearner AI is an intelligent, full-stack AI learning agent that transforms the way "
        "students study. It integrates Google Gemini large language model with a React.js frontend "
        "and FastAPI backend to deliver 10 personalised study tools in a single unified platform — "
        "replacing fragmented, passive study methods with adaptive, AI-powered learning.",
        Inches(0.5),Inches(2.02),Inches(9.0),Inches(1.1),size=16,color=BLACK)
    features = [
        "AI Chat Assistant  |  AI Quiz Generator  |  AI Flashcards  |  AI Text Summarizer",
        "AI Notes Highlighter  |  Study Analytics  |  Daily Goals  |  Daily Streak",
        "Unified Dashboard  |  Progress Tracking",
    ]
    for i,feat in enumerate(features):
        y = Inches(3.25)+i*Inches(0.58)
        bx = s.shapes.add_shape(1,Inches(0.5),y,Inches(9.0),Inches(0.5))
        bx.fill.solid(); bx.fill.fore_color.rgb = LBLUE if i%2==0 else WHITE
        bx.line.color.rgb = BLUE; bx.line.width = Pt(0.5)
        body_text(s,feat,Inches(0.65),y+Pt(5),Inches(8.7),Inches(0.42),size=15,bold=True,color=BLUE,align=PP_ALIGN.CENTER)
    body_text(s,"Tech Stack:  React.js  |  FastAPI  |  Python 3.13  |  Google Gemini API  |  SQLite  |  Tailwind CSS",
              Inches(0.5),Inches(5.1),Inches(9.0),Inches(0.42),size=14,color=BLACK,align=PP_ALIGN.CENTER)
    body_text(s,"Institute:  Sinhgad Institute of Technology & Science, Pune  |  Dept. of Computer Engineering",
              Inches(0.5),Inches(5.6),Inches(9.0),Inches(0.38),size=13,color=LGRAY,align=PP_ALIGN.CENTER)

    # ── SLIDE 5: Problem Statement ────────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Problem Statement", 4)
    body_text(s,
        "Students in higher education depend on 5–6 disconnected tools for studying. "
        "No single platform generates personalised AI content from the student's own material "
        "while also providing motivation tracking, progress analytics, and active recall in one place.",
        Inches(0.5),Inches(2.02),Inches(9.0),Inches(0.88),size=15,color=BLACK)
    problems = [
        ("No Personalisation",    "Generic tools cannot create quizzes or summaries from a student's own notes — every student gets identical static content."),
        ("Fragmented Workflow",   "Switching between 5–6 apps (chat, flashcards, quizzes, notes, analytics) wastes 30+ minutes of study time daily."),
        ("No Motivation Layer",   "Without daily goals, streaks, and progress dashboards, students struggle to maintain consistent study habits."),
        ("Static Content",        "Existing tools do not adapt to individual academic subjects or provide intelligent feedback on student performance."),
        ("No Unified Dashboard",  "Students manually track progress across multiple platforms with no single view of their overall academic activity."),
    ]
    for i,(title,desc) in enumerate(problems):
        y = Inches(3.0)+i*Inches(0.78)
        # number circle
        nb = s.shapes.add_shape(9,Inches(0.3),y+Inches(0.08),Inches(0.52),Inches(0.52))
        nb.fill.solid(); nb.fill.fore_color.rgb = BLUE; nb.line.fill.background()
        body_text(s,str(i+1),Inches(0.3),y+Inches(0.08),Inches(0.52),Inches(0.52),
                  size=14,bold=True,color=WHITE,align=PP_ALIGN.CENTER)
        bx = s.shapes.add_shape(1,Inches(0.92),y,Inches(8.75),Inches(0.68))
        bx.fill.solid(); bx.fill.fore_color.rgb = LBLUE if i%2==0 else WHITE
        bx.line.color.rgb = BLUE; bx.line.width = Pt(0.5)
        body_text(s,f"{title}: {desc}",Inches(1.02),y+Pt(5),Inches(8.55),Inches(0.6),size=13,color=BLACK)

    # ── SLIDE 6: Literature Survey ────────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Literature Survey", 5)
    papers = [
        ("Winkler & Söllner\n2018","AI Chatbots","Rule-based bots improved engagement but could not handle open-ended queries → QuickLearner uses Google Gemini LLM for accurate, context-aware AI chat responses."),
        ("Roediger & Karpicke\n2006","Active Recall","Practice testing yields 50% better long-term retention than re-reading → QuickLearner's AI Flashcard module enables spaced-repetition style active recall."),
        ("See, Liu & Manning\n2017","Summarisation","Abstractive summarisation using neural networks outperforms extractive methods → QuickLearner offers 8 Gemini-powered summary styles including Cornell Notes."),
        ("Hamari et al.\n2014","Gamification","Daily streaks and goal-setting increase course completion by 40% → QuickLearner implements Daily Goals and Streak badges for motivational engagement."),
        ("Siemens & Long\n2011","Learning Analytics","Dashboards improve metacognitive awareness and self-regulated study → QuickLearner's Analytics module tracks sessions, accuracy, hours, and streak data."),
    ]
    hdrs2 = ["Reference","Domain","Finding → QuickLearner AI Response"]
    col_x2 = [Inches(0.3),Inches(2.5),Inches(4.55)]
    col_w2 = [Inches(2.15),Inches(2.0),Inches(5.12)]
    for j,(h,x,w) in enumerate(zip(hdrs2,col_x2,col_w2)):
        bx = s.shapes.add_shape(1,x,Inches(2.02),w,Inches(0.42))
        bx.fill.solid(); bx.fill.fore_color.rgb = BLUE; bx.line.fill.background()
        body_text(s,h,x+Inches(0.05),Inches(2.04),w,Inches(0.38),size=13,bold=True,color=WHITE,align=PP_ALIGN.CENTER)
    for i,(ref,dom,finding) in enumerate(papers):
        y = Inches(2.5)+i*Inches(0.92)
        fc = LBLUE if i%2==0 else WHITE
        for v,x,w in zip([ref,dom,finding],col_x2,col_w2):
            bx = s.shapes.add_shape(1,x,y,w,Inches(0.84))
            bx.fill.solid(); bx.fill.fore_color.rgb = fc
            bx.line.color.rgb = BLUE; bx.line.width = Pt(0.5)
            body_text(s,v,x+Inches(0.06),y+Pt(3),w-Inches(0.1),Inches(0.78),size=12,color=BLACK)

    # ── SLIDE 7: Motivation ───────────────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Motivation", 6)
    motives = [
        ("Fragmented Study Tools",
         "Students waste 30+ min/day switching between disconnected apps. No single platform covers "
         "chat, quiz, flashcards, summaries, notes, analytics, and motivation together."),
        ("No Personalisation",
         "Generic tools serve static content regardless of what the student is studying. "
         "QuickLearner generates content directly from the student's own pasted notes or topic."),
        ("Lack of Motivation & Consistency",
         "Without daily goals, streak rewards, and visible progress, students lose motivation quickly. "
         "Gamification research shows streaks improve completion rates by 40%."),
        ("Google Gemini Opportunity",
         "Gemini's free LLM API makes it possible to build a powerful AI study tool accessible to "
         "every student — no subscription, no external platform dependency."),
    ]
    for i,(title,text) in enumerate(motives):
        col = Inches(0.35) if i%2==0 else Inches(5.12)
        row = Inches(2.05) if i<2 else Inches(4.55)
        bx = s.shapes.add_shape(1,col,row,Inches(4.45),Inches(2.25))
        bx.fill.solid(); bx.fill.fore_color.rgb = LBLUE
        bx.line.color.rgb = BLUE; bx.line.width = Pt(1)
        bar = s.shapes.add_shape(1,col,row,Inches(4.45),Inches(0.4))
        bar.fill.solid(); bar.fill.fore_color.rgb = BLUE; bar.line.fill.background()
        body_text(s,title,col+Inches(0.1),row+Pt(4),Inches(4.25),Inches(0.35),size=14,bold=True,color=WHITE)
        body_text(s,text,col+Inches(0.1),row+Inches(0.48),Inches(4.25),Inches(1.68),size=13,color=BLACK)

    # ── SLIDE 8: Software & Hardware Requirements ─────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Software & Hardware Requirements", 7)
    sw = ["Frontend: React.js 18, Tailwind CSS, Framer Motion",
          "Backend: FastAPI 0.104.1, Python 3.13, Uvicorn 0.24",
          "Database: SQLite 3 + SQLAlchemy 2.0.23 ORM",
          "AI Service: Google Generative AI SDK 0.3.2 (Gemini)",
          "Data Validation: Pydantic v2 schemas",
          "API Docs: Swagger UI auto-generated at /docs",
          "Dev Tools: VS Code, Git, npm 10, pip, PowerShell"]
    hw = ["Processor: Intel Core i3 (4th Gen) or higher",
          "RAM: Minimum 4 GB (8 GB recommended)",
          "Storage: 500 MB free space for project",
          "Network: Stable internet (required for Gemini API)",
          "Browser: Chrome 110+ / Firefox 110+ / Edge 110+",
          "Display: 1280×720 resolution or higher",
          "OS: Windows 10/11, Ubuntu 20.04+, macOS 12+"]
    body_text(s,"Software Requirements",Inches(0.4),Inches(2.02),Inches(4.35),Inches(0.42),size=17,bold=True,color=BLUE)
    d1=s.shapes.add_shape(1,Inches(0.4),Inches(2.48),Inches(4.35),Pt(2)); d1.fill.solid(); d1.fill.fore_color.rgb=BLUE; d1.line.fill.background()
    bullet_list(s,sw,Inches(0.4),Inches(2.58),Inches(4.35),Inches(4.1),size=14)
    body_text(s,"Hardware Requirements",Inches(5.25),Inches(2.02),Inches(4.35),Inches(0.42),size=17,bold=True,color=BLUE)
    d2=s.shapes.add_shape(1,Inches(5.25),Inches(2.48),Inches(4.35),Pt(2)); d2.fill.solid(); d2.fill.fore_color.rgb=BLUE; d2.line.fill.background()
    bullet_list(s,hw,Inches(5.25),Inches(2.58),Inches(4.35),Inches(4.1),size=14)

    # ── SLIDE 9: System Architecture ─────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "System Architecture", 8)
    body_text(s,
        "QuickLearner AI follows a 4-tier architecture: Presentation → Application → AI Service → Data Layer. "
        "Each tier communicates through well-defined interfaces (REST API / Gemini SDK / SQLAlchemy ORM).",
        Inches(0.5),Inches(2.02),Inches(9.0),Inches(0.75),size=14,color=BLACK)
    layers = [
        (BLUE,                        "TIER 1  –  PRESENTATION LAYER",
         "React.js 18  |  Tailwind CSS  |  Framer Motion  |  10 Feature Components  |  Axios/Fetch API"),
        (RGBColor(0x2E,0x75,0xB6),    "TIER 2  –  APPLICATION LAYER",
         "FastAPI 0.104  |  Python 3.13  |  Pydantic  |  15 REST API Endpoints  |  Uvicorn ASGI"),
        (RGBColor(0x37,0x86,0x3D),    "TIER 3a –  AI SERVICE",
         "Google Gemini API  |  gemini-pro-latest  |  Prompt Engineering  |  google-generativeai SDK"),
        (RGBColor(0x7B,0x29,0xC8),    "TIER 3b –  DATA LAYER",
         "SQLite Database  |  SQLAlchemy 2.0 ORM  |  7 Tables  |  Persistent Storage  |  Pydantic Schemas"),
    ]
    for i,(color,title,desc) in enumerate(layers):
        y = Inches(2.88)+i*Inches(0.98)
        bx = s.shapes.add_shape(1,Inches(0.4),y,Inches(9.2),Inches(0.86))
        bx.fill.solid(); bx.fill.fore_color.rgb = LBLUE
        bx.line.color.rgb = color; bx.line.width = Pt(2)
        bar = s.shapes.add_shape(1,Inches(0.4),y,Inches(0.22),Inches(0.86))
        bar.fill.solid(); bar.fill.fore_color.rgb = color; bar.line.fill.background()
        body_text(s,title,Inches(0.75),y+Pt(5),Inches(2.9),Inches(0.38),size=12,bold=True,color=color)
        body_text(s,desc,Inches(3.65),y+Pt(5),Inches(5.8),Inches(0.75),size=12,color=BLACK)
        if i<3:
            body_text(s,"▼",Inches(4.8),y+Inches(0.88),Inches(0.4),Inches(0.28),size=12,color=BLUE,align=PP_ALIGN.CENTER)

    # ── SLIDE 10: DFD Level 0 ────────────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Data Flow Diagram – Level 0  (Context Diagram)", 9)

    # Student entity (left rectangle)
    proc_box(s, Inches(0.25), Inches(2.9), Inches(1.85), Inches(0.95),
             "STUDENT\n(User)", fc=RGBColor(0xD6,0xE4,0xF7), lc=BLUE)
    # Gemini entity (right rectangle)
    proc_box(s, Inches(7.9), Inches(2.9), Inches(1.85), Inches(0.95),
             "GEMINI API\n(External AI)", fc=RGBColor(0xD9,0xEA,0xD3), lc=RGBColor(0x37,0x86,0x3D))
    # Central process (oval)
    proc_oval(s, Inches(3.7), Inches(2.5), Inches(2.6), Inches(1.7),
              "  0  \nQuickLearner\nAI System")
    # DB store (open rect style)
    proc_box(s, Inches(3.7), Inches(5.35), Inches(2.6), Inches(0.62),
             "D1  :  SQLite Database", fc=RGBColor(0xEA,0xD1,0xF5), lc=RGBColor(0x7B,0x29,0xC8))

    # Arrows using connectors
    arrow_h(s, Inches(2.12), Inches(2.95), Inches(3.7), lbl="Study Text / Queries →")
    arrow_h(s, Inches(3.7), Inches(3.3), Inches(2.12), lbl="← AI Responses / Reports")
    arrow_h(s, Inches(6.3), Inches(2.95), Inches(7.9), lbl="AI Prompts →")
    arrow_h(s, Inches(7.9), Inches(3.3), Inches(6.3), lbl="← Generated Content (JSON)")
    arrow_v(s, Inches(5.0), Inches(4.22), Inches(5.35), lbl="Store/Retrieve")

    body_text(s,
        "Context Diagram: The entire QuickLearner AI system is represented as a single process (0). "
        "Two external entities interact with it — the Student who provides input and receives AI output, "
        "and the Google Gemini API which generates all AI content. All data is persisted in SQLite (D1).",
        Inches(0.4),Inches(6.12),Inches(9.2),Inches(0.72),size=12,color=BLACK)
    return prs
