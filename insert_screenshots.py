# insert_screenshots.py
import sys
sys.path.insert(0, r'C:\ai-agent')
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from ql_helpers import _p, _r

SS = r"C:\Users\viraj\OneDrive\Desktop\project screenshots"

# Ordered list: (filename, fig_num, caption, description)
SCREENSHOTS = [
    ("Screenshot 2026-06-27 161108.png", "6.1",
     "Dashboard – QuickLearner AI Home",
     "The Dashboard displays key metrics: Study Time (127 min), Quizzes Completed (24), "
     "Cards Reviewed (156), and Current Streak (5 days). Today's Goals, Recent Activity, "
     "and Quick Action buttons (Quick Quiz, Flashcards, Summarize, Ask AI) are visible."),

    ("Screenshot 2026-06-27 161313.png", "6.2",
     "AI Quiz Generator",
     "The Advanced Quiz Generator interface allows the student to enter a topic, select "
     "number of questions (5/10/15/20), choose difficulty (Beginner to Expert), and pick "
     "question types (MCQ, True/False, Short Answer, Fill in Blank, Matching, Code)."),

    ("Screenshot 2026-06-27 161339.png", "6.3",
     "AI Flashcard Module",
     "The Flashcards module (Active Learning) lets students paste study material and "
     "generate 3, 5, 10, 15, or 20 AI-generated flashcards. The Generate Cards button "
     "triggers the Gemini API to produce question-answer pairs."),

    ("Screenshot 2026-06-27 161230.png", "6.4",
     "AI Text Summarizer",
     "The Advanced Summarization module offers 8 summary styles: Extractive, Abstractive, "
     "Bullet Points, Outline, Cornell Notes, ELI5, Academic, and Key Takeaways, with "
     "configurable summary length from Brief (~15%) to Detailed (~75%)."),

    ("Screenshot 2026-06-27 161202.png", "6.5",
     "AI Notes Highlighter",
     "The Smart Notes Highlighter extracts key concepts, definitions, and insights with "
     "AI-powered analysis. Category filters include Concepts, Definitions, Examples, "
     "Important, Formulas, Steps, and Questions."),

    ("Screenshot 2026-06-27 161408.png", "6.6",
     "Study Analytics Dashboard",
     "Study Analytics tracks: 47 Study Sessions, 32.5 Hours Studied, 87% Quiz Accuracy, "
     "and 14-day Current Streak. The AI Study Coach provides personalised insights and "
     "highlights weak areas for targeted practice."),

    ("Screenshot 2026-06-27 160944.png", "6.7",
     "Daily Streak Tracker",
     "The Daily Streak panel displays the current streak count (1 day), weekly activity "
     "calendar with today (Sat) marked green, and achievement stats: Best Streak, Total "
     "Days, and Badges. The 'First Steps' badge is awarded on the first active day."),

    ("Screenshot 2026-06-27 161029.png", "6.8",
     "Daily Goals Manager",
     "The Daily Goals module (Saturday, June 27) shows Overall Progress at 0%, with a "
     "goal card 'Quizzes Completed: 0/3 quizzes' and an '+ Add New Goal' button for "
     "adding custom daily study objectives."),
]

# ── Load document ─────────────────────────────────────────────────────────────
doc_path = r"C:\Users\viraj\OneDrive\Desktop\QuickLearner_AI_Blackbook_Report.docx"
doc = Document(doc_path)

# ── Find all placeholder paragraphs and replace with real images ──────────────
# We'll collect paragraph indices that contain "Screenshot Placeholder"
placeholders = []
for i, para in enumerate(doc.paragraphs):
    if "Screenshot Placeholder" in para.text or "screenshot" in para.text.lower():
        # check if it's in a table cell (ascii diagram) - skip those
        pass
    # Also scan tables for placeholder text
for i, table in enumerate(doc.tables):
    for row in table.rows:
        for cell in row.cells:
            for para in cell.paragraphs:
                for run in para.runs:
                    if "Screenshot Placeholder" in run.text or "screenshot" in run.text.lower():
                        placeholders.append(('table', i, cell, para, run))

# ── Better approach: rebuild the Screenshots section in Ch6 and Ch8 ──────────
# Find the paragraph "The following figures illustrate the key screens"
# and delete everything after it until we hit next section, replacing with real images

def add_screenshot_block(doc, img_path, fig_num, caption, description):
    """Add image + caption + description paragraph to document."""
    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_before = Pt(8)
    p_img.paragraph_format.space_after  = Pt(4)
    try:
        run = p_img.add_run()
        run.add_picture(img_path, width=Inches(5.8))
    except Exception as e:
        r = p_img.add_run(f"[Image: {caption}]")
        r.font.size = Pt(10)

    # Caption
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(2)
    p_cap.paragraph_format.space_after  = Pt(4)
    r = p_cap.add_run(f"Figure {fig_num}: {caption}")
    r.font.name = "Times New Roman"
    r.font.size = Pt(11)

    # Description
    p_desc = doc.add_paragraph()
    p_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_desc.paragraph_format.space_before = Pt(0)
    p_desc.paragraph_format.space_after  = Pt(12)
    p_desc.paragraph_format.first_line_indent = Pt(18)
    r2 = p_desc.add_run(description)
    r2.font.name = "Times New Roman"
    r2.font.size = Pt(12)

# ── Find the "Screenshots" section heading paragraphs and insert after them ───
# Strategy: find "6.5  Screenshots" paragraph index, then find the next
# chapter heading, delete all paragraphs/tables between them, insert real images.

from docx.oxml.ns import qn
from lxml import etree
import copy

body = doc.element.body
children = list(body)

# Find indices of key markers
ch6_screenshots_idx = None
ch7_idx = None

for i, child in enumerate(children):
    text = ''.join(t.text or '' for t in child.iter(qn('w:t')))
    if '6.5' in text and 'Screenshots' in text and ch6_screenshots_idx is None:
        ch6_screenshots_idx = i
    if 'Chapter' in text and '7' in text and ch6_screenshots_idx is not None and ch7_idx is None:
        ch7_idx = i

print(f"Ch6 screenshots section at body index: {ch6_screenshots_idx}")
print(f"Chapter 7 starts at body index: {ch7_idx}")

# Remove all elements between ch6_screenshots_idx+1 and ch7_idx (exclusive)
if ch6_screenshots_idx and ch7_idx:
    # collect elements to remove
    to_remove = children[ch6_screenshots_idx+1 : ch7_idx]
    for el in to_remove:
        body.remove(el)

    # Now insert screenshots before ch7 (which is now at ch6_screenshots_idx+1)
    # We need to insert after ch6_screenshots_idx
    # Use a temporary doc to build the screenshot paragraphs, then move them
    from docx import Document as DocX
    tmp = DocX()

    # Add intro paragraph
    p_intro = tmp.add_paragraph()
    p_intro.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_intro.paragraph_format.first_line_indent = Pt(18)
    p_intro.paragraph_format.space_after = Pt(8)
    r = p_intro.add_run(
        "The following figures present the actual screenshots of the QuickLearner AI "
        "system demonstrating each key feature in its operational state."
    )
    r.font.name = "Times New Roman"; r.font.size = Pt(12)

    for fname, fig_num, caption, description in SCREENSHOTS:
        img_path = f"{SS}\\{fname}"
        add_screenshot_block(tmp, img_path, fig_num, caption, description)

    # Move elements from tmp into main doc after ch6_screenshots_idx
    insert_after = children[ch6_screenshots_idx]
    for el in list(tmp.element.body):
        if el.tag.endswith('}sectPr'):
            continue
        insert_after.addnext(el)
        insert_after = el

# ── Similarly fix Ch8 Results screenshots section ────────────────────────────
# Refresh children list
children = list(body)
ch8_screenshots_idx = None
ch9_idx = None

for i, child in enumerate(children):
    text = ''.join(t.text or '' for t in child.iter(qn('w:t')))
    if '8.2' in text and 'Screenshots' in text and ch8_screenshots_idx is None:
        ch8_screenshots_idx = i
    if 'Chapter' in text and '9' in text and ch8_screenshots_idx is not None and ch9_idx is None:
        ch9_idx = i

print(f"Ch8 screenshots section at body index: {ch8_screenshots_idx}")
print(f"Chapter 9 starts at body index: {ch9_idx}")

if ch8_screenshots_idx and ch9_idx:
    to_remove = list(body)[ch8_screenshots_idx+1 : ch9_idx]
    for el in to_remove:
        body.remove(el)

    children = list(body)
    insert_after = children[ch8_screenshots_idx]

    # Result screenshots captions (same images, figure numbers 8.x)
    RESULT_SCREENSHOTS = [
        ("Screenshot 2026-06-27 161108.png", "8.1",
         "Dashboard Overview – QuickLearner AI",
         "The Dashboard home screen showing 127 minutes of study time, 24 quizzes completed, "
         "156 cards reviewed, and a 5-day current streak. Today's Goals show 1 of 3 completed "
         "(Review flashcards). Quick Action buttons provide one-tap access to all AI features."),

        ("Screenshot 2026-06-27 161313.png", "8.2",
         "AI Quiz Generator – Feature in Operation",
         "The Quiz Generator allows topic-based quiz creation with configurable parameters. "
         "The student selected Medium difficulty, 5 questions, with Multiple Choice, True/False, "
         "Short Answer, Fill in Blank, Matching, Ordering, and Code question type options."),

        ("Screenshot 2026-06-27 161339.png", "8.3",
         "AI Flashcard Generator – Active Learning",
         "The Flashcards module successfully generates AI-powered flashcards from pasted study "
         "material. The student can select card count (3, 5, 10, 15, 20) before generation. "
         "The interface uses an orange Active Learning theme for quick visual identification."),

        ("Screenshot 2026-06-27 161230.png", "8.4",
         "AI Text Summarizer – Multiple Summary Styles",
         "The Text Summarizer result demonstrating the Extractive summary style (currently "
         "selected). Eight styles are available: Extractive, Abstractive, Bullet Points, "
         "Outline, Cornell Notes, ELI5, Academic, and Key Takeaways."),

        ("Screenshot 2026-06-27 161408.png", "8.5",
         "Study Analytics – Performance Metrics",
         "Analytics results showing 47 study sessions, 32.5 hours studied, 87% quiz accuracy "
         "over the last 10 quizzes, and a 14-day streak. The AI Study Coach identified a weak "
         "area (Literature score dropped 12%) and recommended 30 minutes daily practice."),
    ]

    from docx import Document as DocX2
    tmp2 = DocX2()
    p_intro2 = tmp2.add_paragraph()
    p_intro2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_intro2.paragraph_format.first_line_indent = Pt(18)
    p_intro2.paragraph_format.space_after = Pt(8)
    r = p_intro2.add_run(
        "The following figures present the actual screenshots of the QuickLearner AI "
        "system demonstrating the key features in their operational states, as captured "
        "during system testing and evaluation."
    )
    r.font.name = "Times New Roman"; r.font.size = Pt(12)

    for fname, fig_num, caption, description in RESULT_SCREENSHOTS:
        img_path = f"{SS}\\{fname}"
        add_screenshot_block(tmp2, img_path, fig_num, caption, description)

    for el in list(tmp2.element.body):
        if el.tag.endswith('}sectPr'):
            continue
        insert_after.addnext(el)
        insert_after = el

# ── Save ─────────────────────────────────────────────────────────────────────
out = r"C:\Users\viraj\OneDrive\Desktop\QuickLearner_AI_Blackbook_Report_Final.docx"
doc.save(out)
print(f"Saved: {out}")
