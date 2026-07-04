# ppt_slides_b.py  (slides 11-19)
import sys; sys.path.insert(0, r'C:\ai-agent')
from ppt_slides_a import arrow_h, arrow_v, proc_box, proc_oval
from ppt_helpers import *

def build_slides_b(prs):

    # ── SLIDE 11: DFD Level 1 ────────────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Data Flow Diagram – Level 1", 10)

    # 4 process boxes
    proc_box(s, Inches(0.2),  Inches(2.15), Inches(2.0), Inches(1.1), "1.0\nUser Input\nManagement")
    proc_box(s, Inches(3.85), Inches(2.15), Inches(2.2), Inches(1.1), "2.0\nAI Feature\nEngine")
    proc_box(s, Inches(7.65), Inches(2.15), Inches(2.0), Inches(1.1), "3.0\nDatabase\nStorage")
    proc_box(s, Inches(3.85), Inches(4.8),  Inches(2.2), Inches(1.1), "4.0\nAnalytics\nEngine")

    # Gemini external
    proc_box(s, Inches(3.85), Inches(3.55), Inches(2.2), Inches(0.8),
             "Google Gemini API", fc=RGBColor(0xD9,0xEA,0xD3), lc=RGBColor(0x37,0x86,0x3D), tsize=12)

    # Student + DB external entities
    proc_box(s, Inches(0.2), Inches(4.8), Inches(2.0), Inches(0.72),
             "Student (User)", fc=RGBColor(0xD6,0xE4,0xF7), lc=BLUE, tsize=12)
    proc_box(s, Inches(7.65), Inches(4.8), Inches(2.0), Inches(0.72),
             "D1: SQLite DB", fc=RGBColor(0xEA,0xD1,0xF5), lc=RGBColor(0x7B,0x29,0xC8), tsize=12)

    # Arrows
    arrow_h(s, Inches(2.22), Inches(2.62), Inches(3.85), lbl="Query/Text →")
    arrow_h(s, Inches(6.07), Inches(2.62), Inches(7.65), lbl="Store Data →")
    arrow_v(s, Inches(4.95), Inches(3.27), Inches(3.55), lbl="Prompt")
    arrow_v(s, Inches(4.95), Inches(4.35), Inches(4.8),  lbl="Results")
    arrow_h(s, Inches(2.22), Inches(5.18), Inches(3.85), lbl="← Response")
    arrow_v(s, Inches(8.65), Inches(3.27), Inches(4.8), lbl="CRUD")

    body_text(s,
        "Level 1 DFD decomposes into 4 processes: (1) User Input Management validates and routes "
        "requests; (2) AI Feature Engine constructs prompts and calls Gemini; "
        "(3) Database Storage handles all CRUD operations; (4) Analytics Engine aggregates usage data.",
        Inches(0.4),Inches(6.12),Inches(9.2),Inches(0.72),size=12,color=BLACK)

    # ── SLIDE 12: DFD Level 2 ────────────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Data Flow Diagram – Level 2  (AI Feature Engine)", 11)

    proc_box(s, Inches(0.3), Inches(2.12), Inches(1.9), Inches(0.65),
             "Student Input", fc=RGBColor(0xD6,0xE4,0xF7), lc=BLUE, tsize=12)

    sub_procs = [
        ("2.1  Chat Handler",       Inches(3.0), Inches(1.95)),
        ("2.2  Quiz Generator",     Inches(3.0), Inches(2.72)),
        ("2.3  Flashcard Engine",   Inches(3.0), Inches(3.49)),
        ("2.4  Summariser",         Inches(3.0), Inches(4.26)),
        ("2.5  Notes Highlighter",  Inches(3.0), Inches(5.03)),
        ("2.6  Analytics Engine",   Inches(3.0), Inches(5.80)),
    ]
    outputs = [
        "Chat Response",
        "MCQ Questions (JSON)",
        "Q&A Flashcard Pairs",
        "Summary Text (8 Styles)",
        "Key Concepts / Highlights",
        "Charts & Metrics",
    ]
    gemini_x = Inches(6.8)
    for i,((label,bx,by),out) in enumerate(zip(sub_procs,outputs)):
        proc_box(s,bx,by,Inches(2.8),Inches(0.6),label,tsize=11)
        arrow_h(s,Inches(2.22),by+Inches(0.3),bx)
        if i<5:
            arrow_h(s,bx+Inches(2.8),by+Inches(0.3),gemini_x,lbl="Gemini →" if i==0 else "")
        else:
            arrow_h(s,bx+Inches(2.8),by+Inches(0.3),gemini_x,lbl="DB Query")
        proc_box(s,gemini_x,by,Inches(2.9),Inches(0.6),
                 f"→  {out}",
                 fc=RGBColor(0xD9,0xEA,0xD3) if i<5 else RGBColor(0xEA,0xD1,0xF5),
                 lc=RGBColor(0x37,0x86,0x3D) if i<5 else RGBColor(0x7B,0x29,0xC8),tsize=11)

    body_text(s,
        "Level 2 DFD expands Process 2.0 (AI Feature Engine) into 6 sub-processes, each "
        "corresponding to one AI-powered feature. Sub-processes 2.1–2.5 call Gemini API; "
        "2.6 (Analytics) queries the database directly.",
        Inches(0.4),Inches(6.55),Inches(9.2),Inches(0.68),size=12,color=BLACK)

    # ── SLIDE 13: Use Case Diagram ────────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Use Case Diagram", 12)

    # System boundary
    bx = s.shapes.add_shape(1,Inches(2.1),Inches(1.92),Inches(7.65),Inches(5.38))
    bx.fill.solid(); bx.fill.fore_color.rgb = RGBColor(0xF5,0xF8,0xFF)
    bx.line.color.rgb = BLUE; bx.line.width = Pt(1.5)
    body_text(s,"«  QuickLearner AI System  »",Inches(4.3),Inches(1.95),
              Inches(4.0),Inches(0.36),size=12,color=BLUE,italic=True,align=PP_ALIGN.CENTER)

    # Actor
    body_text(s,"👤\nStudent\n(Primary\nActor)",Inches(0.05),Inches(3.5),
              Inches(1.85),Inches(1.1),size=14,bold=True,color=BLACK,align=PP_ALIGN.CENTER)

    use_cases_l = ["Use AI Chat Assistant","Generate AI Quiz",
                   "Create AI Flashcards","Summarise Text","Highlight Notes"]
    use_cases_r = ["View Study Analytics","Set Daily Goal",
                   "Check Daily Streak","View Dashboard","Track Progress"]

    for i,uc in enumerate(use_cases_l):
        y = Inches(2.1)+i*Inches(0.98)
        bx2 = s.shapes.add_shape(9,Inches(2.4),y,Inches(3.4),Inches(0.72))
        bx2.fill.solid(); bx2.fill.fore_color.rgb = LBLUE
        bx2.line.color.rgb = BLUE; bx2.line.width = Pt(1)
        body_text(s,uc,Inches(2.45),y+Pt(8),Inches(3.3),Inches(0.58),size=12,color=BLACK,align=PP_ALIGN.CENTER)
        ln = s.shapes.add_connector(1,Inches(1.92),y+Inches(0.36),Inches(2.4),y+Inches(0.36))
        ln.line.color.rgb = BLACK; ln.line.width = Pt(1)

    for i,uc in enumerate(use_cases_r):
        y = Inches(2.1)+i*Inches(0.98)
        bx3 = s.shapes.add_shape(9,Inches(6.2),y,Inches(3.3),Inches(0.72))
        bx3.fill.solid(); bx3.fill.fore_color.rgb = LBLUE
        bx3.line.color.rgb = BLUE; bx3.line.width = Pt(1)
        body_text(s,uc,Inches(6.25),y+Pt(8),Inches(3.2),Inches(0.58),size=12,color=BLACK,align=PP_ALIGN.CENTER)
        ln2 = s.shapes.add_connector(1,Inches(1.92),y+Inches(0.36),Inches(6.2),y+Inches(0.36))
        ln2.line.color.rgb = BLACK; ln2.line.width = Pt(1)

    # Gemini secondary actor
    body_text(s,"🤖\nGemini API\n(Secondary\nActor)",Inches(9.5),Inches(3.5),
              Inches(0.4),Inches(1.1),size=9,bold=True,color=RGBColor(0x37,0x86,0x3D),align=PP_ALIGN.CENTER)

    # ── SLIDE 14: Sequence Diagram ────────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Sequence Diagram – AI Quiz Generation Flow", 13)

    actors = ["Student","Frontend\n(React.js)","Backend\n(FastAPI)","Gemini\nAPI","Database\n(SQLite)"]
    cols_x = [Inches(0.3),Inches(2.15),Inches(4.0),Inches(5.95),Inches(7.9)]
    for actor,x in zip(actors,cols_x):
        bx = s.shapes.add_shape(1,x,Inches(1.95),Inches(1.65),Inches(0.6))
        bx.fill.solid(); bx.fill.fore_color.rgb = BLUE; bx.line.fill.background()
        body_text(s,actor,x,Inches(1.97),Inches(1.65),Inches(0.58),
                  size=12,bold=True,color=WHITE,align=PP_ALIGN.CENTER)
        ln = s.shapes.add_shape(1,x+Inches(0.8),Inches(2.57),Pt(1.5),Inches(4.32))
        ln.fill.solid(); ln.fill.fore_color.rgb = RGBColor(0xCC,0xCC,0xCC); ln.line.fill.background()

    steps = [
        (Inches(0.3),  Inches(2.0),  Inches(2.15), Inches(2.75),  "1. Enter topic & settings"),
        (Inches(2.15), Inches(2.75), Inches(4.0),  Inches(3.1),   "2. POST /api/quiz/generate"),
        (Inches(4.0),  Inches(3.1),  Inches(5.95), Inches(3.45),  "3. Build Gemini prompt"),
        (Inches(5.95), Inches(3.8),  Inches(4.0),  Inches(3.45),  "4. Return MCQ JSON  ◄"),
        (Inches(4.0),  Inches(3.8),  Inches(7.9),  Inches(4.15),  "5. INSERT quiz result"),
        (Inches(7.9),  Inches(4.5),  Inches(4.0),  Inches(4.15),  "6. quiz_id returned  ◄"),
        (Inches(4.0),  Inches(4.5),  Inches(2.15), Inches(4.85),  "7. 200 OK + quiz JSON  ◄"),
        (Inches(2.15), Inches(5.2),  Inches(0.3),  Inches(4.85),  "8. Display quiz to student  ◄"),
        (Inches(0.3),  Inches(5.2),  Inches(2.15), Inches(5.55),  "9. Student submits answers"),
        (Inches(2.15), Inches(5.55), Inches(4.0),  Inches(5.9),   "10. POST /api/quiz/score"),
        (Inches(4.0),  Inches(5.9),  Inches(7.9),  Inches(6.25),  "11. UPDATE score in DB"),
        (Inches(2.15), Inches(6.6),  Inches(0.3),  Inches(6.25),  "12. Show score & answers  ◄"),
    ]
    for (x1,y1,x2,y2,label) in steps:
        ln = s.shapes.add_connector(1,x1+Inches(0.82),y1,x2+Inches(0.82),y2)
        ln.line.color.rgb = BLUE; ln.line.width = Pt(1)
        mx = (min(x1,x2)+Inches(0.85))
        body_text(s,label,mx,min(y1,y2)-Inches(0.22),Inches(2.2),Inches(0.24),size=9,color=BLACK)

    # ── SLIDE 15: Mathematical Model ──────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Mathematical Model", 14)
    body_text(s,"S  =  {  I,  O,  P,  U  }",Inches(0.5),Inches(2.02),
              Inches(9.0),Inches(0.5),size=24,bold=True,color=BLUE)
    rows = [
        ("S  (System)",
         "Complete QuickLearner AI: React.js frontend + FastAPI backend + Google Gemini API + SQLite DB"),
        ("I  (Input)\ni1, i2, i3, i4",
         "i1 = Student queries & study text   |   i2 = Quiz topic + difficulty + question count\n"
         "i3 = Notes/text for summarisation   |   i4 = Daily goal definitions + streak events"),
        ("O  (Output)\no1 – o5",
         "o1 = AI chat responses   |   o2 = MCQ quiz (JSON)   |   o3 = Flashcard Q&A pairs\n"
         "o4 = Text summaries (8 styles)   |   o5 = Analytics metrics + streak + progress data"),
        ("P  (Process)\np1 – p4",
         "p1 = Input validation (Pydantic)   |   p2 = Gemini prompt construction & API call\n"
         "p3 = SQLAlchemy ORM CRUD   |   p4 = Analytics aggregation & goal/streak tracking"),
        ("U  (Constraints)",
         "Stable internet required for Gemini   |   SQLite for dev; PostgreSQL recommended for production\n"
         "Single-user session in current version   |   Gemini API free-tier rate limits apply"),
    ]
    for i,(key,val) in enumerate(rows):
        y = Inches(2.62)+i*Inches(0.88)
        bk = s.shapes.add_shape(1,Inches(0.35),y,Inches(2.2),Inches(0.8))
        bk.fill.solid(); bk.fill.fore_color.rgb = BLUE; bk.line.fill.background()
        body_text(s,key,Inches(0.4),y+Pt(3),Inches(2.1),Inches(0.76),size=12,bold=True,color=WHITE)
        bv = s.shapes.add_shape(1,Inches(2.6),y,Inches(7.12),Inches(0.8))
        bv.fill.solid(); bv.fill.fore_color.rgb = LBLUE if i%2==0 else WHITE
        bv.line.color.rgb = BLUE; bv.line.width = Pt(0.5)
        body_text(s,val,Inches(2.7),y+Pt(3),Inches(6.95),Inches(0.76),size=12,color=BLACK)

    # ── SLIDE 16: Proposed Algorithm ─────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Proposed Algorithm – QuickLearner AI Workflow", 15)
    body_text(s,"Algorithm: QuickLearner AI Feature Execution",
              Inches(0.5),Inches(2.05),Inches(9.0),Inches(0.38),size=16,bold=True,color=BLUE)
    steps_algo = [
        "Step 1: Student opens QuickLearner AI in browser at localhost:3000.",
        "Step 2: Student selects a feature (Chat / Quiz / Flashcards / Summarise / Notes).",
        "Step 3: Student inputs study text or topic into the feature interface.",
        "Step 4: Frontend sends HTTP POST request to FastAPI backend endpoint.",
        "Step 5: Backend validates input using Pydantic schema; rejects if invalid.",
        "Step 6: Backend constructs a feature-specific prompt for Google Gemini API.",
        "Step 7: Gemini API returns AI-generated content (MCQ / Q&A / Summary / Highlights).",
        "Step 8: Backend parses response, stores result in SQLite via SQLAlchemy ORM.",
        "Step 9: Backend returns structured JSON response to frontend (200 OK).",
        "Step 10: Frontend renders result; updates Analytics, Goals, Streak counters.",
        "Step 11: Student reviews content, submits answers / flips cards / copies summary.",
        "Step 12: System logs activity; streak increments if daily goal is met. END.",
    ]
    for i,step in enumerate(steps_algo):
        y = Inches(2.52)+i*Inches(0.37)
        fc = LBLUE if i%2==0 else WHITE
        bx = s.shapes.add_shape(1,Inches(0.4),y,Inches(9.2),Inches(0.32))
        bx.fill.solid(); bx.fill.fore_color.rgb = fc
        bx.line.color.rgb = BLUE; bx.line.width = Pt(0.3)
        body_text(s,step,Inches(0.52),y+Pt(2),Inches(9.0),Inches(0.3),size=12,color=BLACK)

    # ── SLIDE 17: Objectives & Scope ─────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Objectives & Scope", 16)
    objectives = [
        "Design and develop a full-stack web app with AI-powered FastAPI backend and React.js frontend.",
        "Integrate Google Gemini API for Chat, Quiz Generation, Flashcards, Summarisation, Notes Highlighting.",
        "Implement SQLite with SQLAlchemy ORM to persist sessions, quizzes, flashcards, analytics.",
        "Build Study Analytics dashboard showing sessions, hours, quiz accuracy, and streak data.",
        "Implement Daily Goals and Daily Streak gamification for consistent study motivation.",
        "Deliver responsive, accessible UI with dark mode support and Framer Motion animations.",
        "Maintain modular codebase with clean separation of AI, API, database, and UI layers.",
    ]
    for i,obj in enumerate(objectives):
        y = Inches(2.05)+i*Inches(0.72)
        nb = s.shapes.add_shape(9,Inches(0.3),y+Inches(0.06),Inches(0.52),Inches(0.52))
        nb.fill.solid(); nb.fill.fore_color.rgb = BLUE; nb.line.fill.background()
        body_text(s,str(i+1),Inches(0.3),y+Inches(0.06),Inches(0.52),Inches(0.52),
                  size=14,bold=True,color=WHITE,align=PP_ALIGN.CENTER)
        bx = s.shapes.add_shape(1,Inches(0.9),y,Inches(8.75),Inches(0.62))
        bx.fill.solid(); bx.fill.fore_color.rgb = LBLUE if i%2==0 else WHITE
        bx.line.color.rgb = BLUE; bx.line.width = Pt(0.5)
        body_text(s,obj,Inches(1.02),y+Pt(5),Inches(8.55),Inches(0.55),size=13,color=BLACK)

    # ── SLIDE 18: Implementation Results ─────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Implementation Results", 17)
    body_text(s,
        "All 10 features implemented and tested on localhost:3000.  "
        "47 test cases executed — all passed.  AI response time < 5 sec.",
        Inches(0.5),Inches(2.02),Inches(9.0),Inches(0.42),size=14,bold=False,color=BLACK)
    results = [
        ("Dashboard",        "127 min study · 24 quizzes\n156 cards · 5-day streak\nToday's Goals: 1/3 done"),
        ("Quiz Generator",   "Topic-based · 5-20 Qs\nBeginner to Expert difficulty\nMCQ/T-F/Fill/Code types"),
        ("AI Flashcards",    "Active Learning mode\nGenerate 3–20 AI cards\nPaste any study material"),
        ("Text Summarizer",  "8 styles: Extractive,\nAbstractive, Cornell Notes,\nELI5, Key Takeaways…"),
        ("Notes Highlighter","Category filters:\nConcepts, Definitions,\nFormulas, Steps, Questions"),
        ("Study Analytics",  "47 sessions · 32.5 hrs\n87% quiz accuracy\n14-day streak · AI Coach"),
    ]
    for i,(title,desc) in enumerate(results):
        col = Inches(0.3)+(i%3)*Inches(3.25)
        row = Inches(2.55)+(i//3)*Inches(2.3)
        bx = s.shapes.add_shape(1,col,row,Inches(3.05),Inches(2.0))
        bx.fill.solid(); bx.fill.fore_color.rgb = LBLUE
        bx.line.color.rgb = BLUE; bx.line.width = Pt(1)
        bar = s.shapes.add_shape(1,col,row,Inches(3.05),Inches(0.4))
        bar.fill.solid(); bar.fill.fore_color.rgb = BLUE; bar.line.fill.background()
        body_text(s,title,col+Inches(0.07),row+Pt(5),Inches(2.9),Inches(0.34),
                  size=13,bold=True,color=WHITE,align=PP_ALIGN.CENTER)
        body_text(s,"[ Screenshot ]",col+Inches(0.07),row+Inches(0.48),
                  Inches(2.9),Inches(0.52),size=11,color=LGRAY,italic=True,align=PP_ALIGN.CENTER)
        body_text(s,desc,col+Inches(0.07),row+Inches(1.08),
                  Inches(2.9),Inches(0.86),size=12,color=BLACK,align=PP_ALIGN.CENTER)

    # ── SLIDE 19: Conclusion ──────────────────────────────────────────────────
    s = blank_slide(prs)
    std_slide_top(s, "Conclusion", 18)
    body_text(s,
        "QuickLearner AI successfully demonstrates that Google Gemini LLM can be practically "
        "integrated into a full-stack educational web application to deliver personalised, "
        "real-time study assistance — replacing fragmented tools with a single intelligent platform.",
        Inches(0.5),Inches(2.05),Inches(9.0),Inches(0.92),size=16,color=BLACK)
    points = [
        ("✔  Problem Solved",    "Unified platform with 10 features eliminates need for 5–6 disconnected study apps."),
        ("✔  AI Integration",    "Gemini API delivers personalised quizzes, flashcards, summaries, and chat from student's own material."),
        ("✔  Full-Stack Built",  "React.js + FastAPI + SQLite stack with 15 REST API endpoints — fully functional."),
        ("✔  Tested & Verified", "47/47 test cases passed. AI response < 5 sec. Frontend loads in < 3 sec."),
        ("🔮  Future Work",       "JWT authentication · Cloud deployment (AWS) · Spaced repetition · React Native mobile app · Voice input."),
    ]
    for i,(tag,text) in enumerate(points):
        y = Inches(3.08)+i*Inches(0.82)
        tb = s.shapes.add_shape(1,Inches(0.3),y,Inches(2.1),Inches(0.68))
        tb.fill.solid(); tb.fill.fore_color.rgb = BLUE if "✔" in tag else RGBColor(0x2E,0x75,0xB6)
        tb.line.fill.background()
        body_text(s,tag,Inches(0.33),y+Pt(5),Inches(2.0),Inches(0.62),
                  size=13,bold=True,color=WHITE,align=PP_ALIGN.CENTER)
        vb = s.shapes.add_shape(1,Inches(2.48),y,Inches(7.2),Inches(0.68))
        vb.fill.solid(); vb.fill.fore_color.rgb = LBLUE if i%2==0 else WHITE
        vb.line.color.rgb = BLUE; vb.line.width = Pt(0.5)
        body_text(s,text,Inches(2.58),y+Pt(5),Inches(7.0),Inches(0.62),size=14,color=BLACK)

    # ── SLIDE 20: Thank You ───────────────────────────────────────────────────
    s = blank_slide(prs)
    add_logos(s); add_header_line(s); add_college_text(s)
    div = s.shapes.add_shape(1,Inches(1.5),Inches(3.15),Inches(7.0),Pt(2))
    div.fill.solid(); div.fill.fore_color.rgb = BLUE; div.line.fill.background()
    body_text(s,"Thank You!",Inches(0.5),Inches(3.3),Inches(9.0),Inches(1.15),
              size=54,bold=True,color=BLUE,align=PP_ALIGN.CENTER)
    div2 = s.shapes.add_shape(1,Inches(1.5),Inches(4.48),Inches(7.0),Pt(2))
    div2.fill.solid(); div2.fill.fore_color.rgb = BLUE; div2.line.fill.background()
    body_text(s,"QuickLearner AI  —  AI Learning Agent",
              Inches(0.5),Inches(4.62),Inches(9.0),Inches(0.44),
              size=18,color=BLACK,align=PP_ALIGN.CENTER)
    body_text(s,"Viraj Kulye  |  Pranav Lawand  |  Janhavi Lande  |  Kunal Khopade",
              Inches(0.5),Inches(5.18),Inches(9.0),Inches(0.4),
              size=15,color=BLACK,align=PP_ALIGN.CENTER)
    body_text(s,"Guide: Mrs. S. S. Navale   |   Sinhgad Institute of Technology & Science, Pune   |   2025-26",
              Inches(0.5),Inches(5.68),Inches(9.0),Inches(0.38),
              size=13,color=LGRAY,align=PP_ALIGN.CENTER)
    add_footer(s,"28/6/2026")
    return prs
