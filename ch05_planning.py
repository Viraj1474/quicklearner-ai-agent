# ch05_planning.py
import sys
sys.path.insert(0, r'C:\ai-agent')
from ql_helpers import *
from ql_helpers import _p, _r, _sup

def write_ch5(doc):
    chapter_heading(doc, "5", "Project Planning")

    body(doc,
        "Effective project planning is essential to ensure that all features of "
        "QuickLearner AI are delivered on time, within scope, and with consistent "
        "quality. This chapter describes the SDLC model adopted, the risk analysis "
        "performed, and the project timeline with milestones.")

    section(doc, "5.1", "SDLC Model")
    body(doc,
        "QuickLearner AI is developed using an Agile Iterative SDLC model. This "
        "model was chosen because the project involves an AI integration layer whose "
        "behaviour is difficult to fully specify upfront, requiring iterative "
        "refinement based on testing and feedback. The development is organised into "
        "four two-week sprints, each delivering a functional increment of the system.")

    ascii_diagram(doc, [
        "  +-------------------+",
        "  |  1. REQUIREMENTS  |",
        "  |  Analysis &       |<---+",
        "  |  Planning         |    |",
        "  +-------------------+    |",
        "          |                |",
        "          v                |",
        "  +-------------------+    |",
        "  |  2. SYSTEM DESIGN |    |",
        "  |  Architecture,    |    | Iterate",
        "  |  DB Schema, UML   |    |",
        "  +-------------------+    |",
        "          |                |",
        "          v                |",
        "  +-------------------+    |",
        "  |  3. IMPLEMENTATION|    |",
        "  |  Backend, Frontend|    |",
        "  |  AI Integration   |    |",
        "  +-------------------+    |",
        "          |                |",
        "          v                |",
        "  +-------------------+    |",
        "  |  4. TESTING &     |    |",
        "  |  EVALUATION       +----+",
        "  +-------------------+",
        "          |",
        "          v",
        "  +-------------------+",
        "  |  5. DEPLOYMENT &  |",
        "  |  DOCUMENTATION    |",
        "  +-------------------+",
    ], caption=("3.1", "QuickLearner AI SDLC Model"))

    body(doc,
        "Sprint 1 focuses on backend setup, database schema design, and core API "
        "skeleton. Sprint 2 delivers the AI Chat and Quiz Generator features with "
        "end-to-end testing. Sprint 3 adds Flashcards, Summariser, Notes Highlighter, "
        "and the Analytics module. Sprint 4 implements Daily Goals, Streak, Dashboard, "
        "Progress Tracking, and performs comprehensive system testing and documentation.")

    section(doc, "5.2", "Risk Analysis")
    body(doc,
        "The following risks were identified during planning. Each risk is assessed "
        "for probability and impact, and a mitigation strategy is defined.")

    table_caption(doc, "5.1", "Risk Probability and Impact Matrix")
    make_table(doc,
        headers=["#", "Risk", "Probability", "Impact", "Mitigation"],
        rows=[
            ("R1", "Gemini API rate limit exceeded", "Medium", "High", "Cache responses; implement retry logic"),
            ("R2", "SQLite performance bottleneck", "Low", "Medium", "Migrate to PostgreSQL for production"),
            ("R3", "AI generates inaccurate content", "Medium", "High", "Prompt engineering; user feedback loop"),
            ("R4", "Frontend-backend CORS issues", "Low", "Medium", "Configure CORS in FastAPI settings"),
            ("R5", "Scope creep adding new features", "High", "Medium", "Strict sprint scope management"),
            ("R6", "Gemini API key exposure", "Low", "High", "Store in .env; never commit to VCS"),
            ("R7", "React state management complexity", "Medium", "Low", "Use Context API; isolate components"),
        ],
        col_widths=[0.3, 1.8, 1.0, 0.8, 2.3]
    )

    section(doc, "5.3", "Project Timeline")
    body(doc,
        "The project is planned over an eight-week period from October to November "
        "2025. The timeline is divided into five phases as shown in the table below.")

    table_caption(doc, "5.2", "Project Timeline and Milestones")
    make_table(doc,
        headers=["Phase", "Activities", "Duration", "Milestone"],
        rows=[
            ("1 – Planning",      "Requirements, architecture design, tech stack selection", "Week 1–2",  "SRS document approved"),
            ("2 – Backend",       "FastAPI setup, DB schema, API endpoints, Gemini client",  "Week 3–4",  "All APIs functional"),
            ("3 – Frontend",      "React components, Tailwind styling, API integration",     "Week 5",    "UI connected to backend"),
            ("4 – AI Features",   "Gemini integration for all 5 AI features",               "Week 6",    "All AI features working"),
            ("5 – Testing & Docs","Unit tests, integration tests, report writing",           "Week 7–8",  "Final report submitted"),
        ],
        col_widths=[1.2, 2.5, 1.0, 1.5]
    )

