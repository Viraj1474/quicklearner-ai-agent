# gen_diagrams.py - generate all 4 diagrams as clean PNG images
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe

OUT = r"C:\ai-agent\ppt_assets"

# ── color palette ─────────────────────────────────────────────────────────────
NAVY   = '#1F497D'
BLUE   = '#2E75B6'
GREEN  = '#37863D'
PURPLE = '#7B29C8'
ORANGE = '#FF6B00'
LGRAY  = '#F0F4FF'
MGRAY  = '#CCCCCC'
WHITE  = '#FFFFFF'
BLACK  = '#000000'

def savefig(name):
    plt.tight_layout(pad=0.3)
    plt.savefig(f"{OUT}\\{name}.png", dpi=180, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print(f"Saved: {name}.png")

# ═══════════════════════════════════════════════════════════════════════════════
# 1. SYSTEM ARCHITECTURE
# ═══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(13, 8))
ax.set_xlim(0,13); ax.set_ylim(0,8); ax.axis('off')

def fbox(ax, x, y, w, h, fc, ec, r=0.2, lw=1.5, label='', lsize=11, lbold=False, lcolor='white', sublabel=''):
    ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle=f"round,pad={r}",
                                fc=fc,ec=ec,lw=lw,zorder=3))
    if label:
        weight = 'bold' if lbold else 'normal'
        ax.text(x+w/2, y+h/2+(0.18 if sublabel else 0), label,
                ha='center', va='center', fontsize=lsize, fontweight=weight,
                color=lcolor, zorder=4)
    if sublabel:
        ax.text(x+w/2, y+h/2-0.22, sublabel, ha='center', va='center',
                fontsize=9, color=lcolor, alpha=0.85, zorder=4)

def harrow(ax, x1, y, x2, color=NAVY, label='', lside='top'):
    ax.annotate('', xy=(x2,y), xytext=(x1,y),
        arrowprops=dict(arrowstyle='->', color=color, lw=1.5,
                        connectionstyle='arc3,rad=0'), zorder=5)
    if label:
        dy = 0.18 if lside=='top' else -0.18
        ax.text((x1+x2)/2, y+dy, label, ha='center', va='center',
                fontsize=8.5, color=color, zorder=5,
                bbox=dict(fc='white', ec='none', pad=1))

def varrow(ax, x, y1, y2, color=NAVY, label='', lside='right'):
    ax.annotate('', xy=(x,y2), xytext=(x,y1),
        arrowprops=dict(arrowstyle='->', color=color, lw=1.5), zorder=5)
    if label:
        dx = 0.2 if lside=='right' else -0.2
        ax.text(x+dx, (y1+y2)/2, label, ha='left' if lside=='right' else 'right',
                va='center', fontsize=8.5, color=color, rotation=90, zorder=5,
                bbox=dict(fc='white', ec='none', pad=1))

# Title
ax.text(6.5, 7.6, 'QuickLearner AI – System Architecture', ha='center', va='center',
        fontsize=16, fontweight='bold', color=NAVY)

# Tier 1 – Frontend
fbox(ax, 0.3,6.0,12.4,1.2, LGRAY, NAVY, r=0.15, lw=2)
ax.text(0.7,6.9,'Tier 1', fontsize=9, color=NAVY, style='italic')
ax.text(6.5,6.85,'PRESENTATION LAYER  –  React.js 18  +  Tailwind CSS  +  Framer Motion',
        ha='center', fontsize=12, fontweight='bold', color=NAVY)
components = ['AI Chat','AI Quiz','Flashcards','Summariser','Notes\nHighlighter',
              'Analytics','Goals\n& Streak','Dashboard']
colors_c = [BLUE,BLUE,GREEN,GREEN,PURPLE,ORANGE,NAVY,BLUE]
for i,(comp,cc) in enumerate(zip(components, colors_c)):
    fbox(ax, 0.5+i*1.52, 6.08, 1.35, 0.62, cc, cc, r=0.1, lw=1,
         label=comp, lsize=9, lbold=True)

# Arrow down
varrow(ax, 6.5, 5.98, 5.35, BLUE, 'HTTP / REST API (JSON)', 'right')

# Tier 2 – Backend
fbox(ax, 0.3,4.1,12.4,1.1, LGRAY, BLUE, r=0.15, lw=2)
ax.text(0.7,5.0,'Tier 2', fontsize=9, color=BLUE, style='italic')
ax.text(6.5,4.92,'APPLICATION LAYER  –  FastAPI 0.104  +  Python 3.13  +  Pydantic  +  Uvicorn',
        ha='center', fontsize=12, fontweight='bold', color=BLUE)
endpoints = ['/api/chat','/api/quiz','/api/flashcards','/api/summarize',
             '/api/notes','/api/analytics','/api/goals','/health']
for i,ep in enumerate(endpoints):
    fbox(ax, 0.5+i*1.52, 4.18, 1.35, 0.55, BLUE, BLUE, r=0.1, lw=1,
         label=ep, lsize=8.5, lbold=True)

# Arrows to Tier 3a and 3b
varrow(ax, 3.5, 4.08, 3.25, GREEN, 'Gemini SDK', 'left')
varrow(ax, 9.5, 4.08, 3.25, PURPLE, 'SQLAlchemy ORM', 'right')

# Tier 3a – Gemini
fbox(ax, 0.3,2.0,5.8,1.1, '#E8F5E9', GREEN, r=0.15, lw=2)
ax.text(0.7,2.9,'Tier 3a', fontsize=9, color=GREEN, style='italic')
ax.text(3.2,2.82,'AI SERVICE LAYER  –  Google Gemini API',
        ha='center', fontsize=12, fontweight='bold', color=GREEN)
ax.text(3.2,2.42,'gemini-pro-latest  |  Prompt Engineering  |  JSON Response Parsing',
        ha='center', fontsize=10, color=GREEN)

# Tier 3b – Database
fbox(ax, 7.1,2.0,5.5,1.1, '#F3E5F5', PURPLE, r=0.15, lw=2)
ax.text(7.5,2.9,'Tier 3b', fontsize=9, color=PURPLE, style='italic')
ax.text(9.85,2.82,'DATA LAYER  –  SQLite + SQLAlchemy',
        ha='center', fontsize=12, fontweight='bold', color=PURPLE)
ax.text(9.85,2.42,'7 Tables: sessions · messages · quizzes · flashcards · notes · goals · analytics',
        ha='center', fontsize=9.5, color=PURPLE)

# Legend
ax.text(0.5,0.7,'Legend:', fontsize=10, fontweight='bold', color=BLACK)
for i,(lbl,lc) in enumerate([('Frontend (React)',BLUE),('Backend (FastAPI)',BLUE),
                               ('AI Service (Gemini)',GREEN),('Database (SQLite)',PURPLE)]):
    ax.add_patch(FancyBboxPatch((1.5+i*2.8,0.45),0.35,0.3,boxstyle='round,pad=0.05',fc=lc,ec=lc))
    ax.text(1.95+i*2.8,0.6,lbl,fontsize=9,color=BLACK,va='center')

savefig('arch')


# ═══════════════════════════════════════════════════════════════════════════════
# 2. DFD LEVEL 0 (Context Diagram)
# ═══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(13, 7))
ax.set_xlim(0,13); ax.set_ylim(0,7); ax.axis('off')
ax.text(6.5,6.65,'Data Flow Diagram – Level 0 (Context Diagram)',
        ha='center',fontsize=15,fontweight='bold',color=NAVY)
ax.text(6.5,6.3,'QuickLearner AI – AI Learning Agent',
        ha='center',fontsize=10,color='gray',style='italic')

# External entity: Student (left)
ax.add_patch(FancyBboxPatch((0.2,2.5),2.2,1.4,boxstyle='round,pad=0.1',
                             fc='#D6E4F7',ec=NAVY,lw=2,zorder=3))
ax.text(1.3,3.45,'STUDENT',ha='center',fontsize=13,fontweight='bold',color=NAVY,zorder=4)
ax.text(1.3,3.1,'(Primary Actor)',ha='center',fontsize=9.5,color=NAVY,zorder=4)
ax.text(1.3,2.78,'End User / Learner',ha='center',fontsize=9,color='gray',zorder=4)

# External entity: Gemini (right)
ax.add_patch(FancyBboxPatch((10.6,2.5),2.2,1.4,boxstyle='round,pad=0.1',
                             fc='#E8F5E9',ec=GREEN,lw=2,zorder=3))
ax.text(11.7,3.45,'GEMINI API',ha='center',fontsize=13,fontweight='bold',color=GREEN,zorder=4)
ax.text(11.7,3.1,'(External AI)',ha='center',fontsize=9.5,color=GREEN,zorder=4)
ax.text(11.7,2.78,'Google AI Service',ha='center',fontsize=9,color='gray',zorder=4)

# Central process (circle)
circle = plt.Circle((6.5,3.2),1.55,fc='#FFF3CD',ec=ORANGE,lw=2.5,zorder=3)
ax.add_patch(circle)
ax.text(6.5,3.55,'  0  ',ha='center',fontsize=18,fontweight='bold',color=ORANGE,zorder=4)
ax.text(6.5,3.15,'QuickLearner',ha='center',fontsize=12,fontweight='bold',color=NAVY,zorder=4)
ax.text(6.5,2.8,'AI System',ha='center',fontsize=12,fontweight='bold',color=NAVY,zorder=4)

# Data store (open-ended rectangle)
ax.plot([4.5,8.5],[1.2,1.2],color=PURPLE,lw=2)
ax.plot([4.5,8.5],[0.55,0.55],color=PURPLE,lw=2)
ax.plot([4.5,4.5],[0.55,1.2],color=PURPLE,lw=2)
ax.add_patch(FancyBboxPatch((4.52,0.57),3.96,0.61,boxstyle='square,pad=0',
                             fc='#F3E5F5',ec='none',zorder=2))
ax.text(6.5,0.88,'D1   :   SQLite Database',ha='center',
        fontsize=11,fontweight='bold',color=PURPLE,zorder=4)

# Arrows Student ↔ System
ax.annotate('',xy=(4.96,3.5),xytext=(2.4,3.5),
    arrowprops=dict(arrowstyle='->', color=NAVY, lw=2,
                    connectionstyle='arc3,rad=0'),zorder=5)
ax.text(3.68,3.7,'Study Content / Queries',ha='center',fontsize=9.5,color=NAVY,
        bbox=dict(fc='white',ec='none',pad=1))

ax.annotate('',xy=(2.4,3.0),xytext=(4.96,3.0),
    arrowprops=dict(arrowstyle='->', color=BLUE, lw=2),zorder=5)
ax.text(3.68,2.78,'AI Responses / Reports',ha='center',fontsize=9.5,color=BLUE,
        bbox=dict(fc='white',ec='none',pad=1))

# Arrows System ↔ Gemini
ax.annotate('',xy=(10.6,3.5),xytext=(8.04,3.5),
    arrowprops=dict(arrowstyle='->', color=GREEN, lw=2),zorder=5)
ax.text(9.32,3.7,'AI Prompts (Quiz/Chat/Flash)',ha='center',fontsize=9.5,color=GREEN,
        bbox=dict(fc='white',ec='none',pad=1))

ax.annotate('',xy=(8.04,3.0),xytext=(10.6,3.0),
    arrowprops=dict(arrowstyle='->', color=GREEN, lw=2),zorder=5)
ax.text(9.32,2.78,'Generated Content (JSON)',ha='center',fontsize=9.5,color=GREEN,
        bbox=dict(fc='white',ec='none',pad=1))

# Arrow System ↔ DB
ax.annotate('',xy=(6.7,1.22),xytext=(6.7,1.65),
    arrowprops=dict(arrowstyle='->', color=PURPLE, lw=2),zorder=5)
ax.annotate('',xy=(6.3,1.65),xytext=(6.3,1.22),
    arrowprops=dict(arrowstyle='->', color=PURPLE, lw=2),zorder=5)
ax.text(7.0,1.42,'Store / Retrieve',fontsize=9.5,color=PURPLE)

savefig('dfd0')

# ═══════════════════════════════════════════════════════════════════════════════
# 3. USE CASE DIAGRAM
# ═══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(13, 9))
ax.set_xlim(0,13); ax.set_ylim(0,9); ax.axis('off')
ax.text(6.5,8.65,'Use Case Diagram – QuickLearner AI',
        ha='center',fontsize=15,fontweight='bold',color=NAVY)

# System boundary
ax.add_patch(FancyBboxPatch((2.0,0.3),9.8,8.1,boxstyle='round,pad=0.1',
                             fc='#F5F8FF',ec=NAVY,lw=2,zorder=1))
ax.text(6.9,8.2,'« QuickLearner AI System »',ha='center',fontsize=11,
        color=NAVY,style='italic',zorder=2)

# Actor – Student (left)
ax.text(0.65,4.5,'Student',ha='center',fontsize=13,fontweight='bold',color=NAVY)
# stick figure
ax.add_patch(plt.Circle((0.65,6.2),0.35,fc='none',ec=NAVY,lw=2,zorder=3))
ax.plot([0.65,0.65],[5.85,5.0],color=NAVY,lw=2)
ax.plot([0.15,1.15],[5.65,5.65],color=NAVY,lw=2)
ax.plot([0.65,0.2],[5.0,4.2],color=NAVY,lw=2)
ax.plot([0.65,1.1],[5.0,4.2],color=NAVY,lw=2)

# Actor – Gemini (right)
ax.text(12.3,4.5,'Gemini\nAPI',ha='center',fontsize=11,fontweight='bold',color=GREEN)
ax.add_patch(plt.Circle((12.3,6.2),0.35,fc='none',ec=GREEN,lw=2,zorder=3))
ax.plot([12.3,12.3],[5.85,5.0],color=GREEN,lw=2)
ax.plot([11.8,12.8],[5.65,5.65],color=GREEN,lw=2)
ax.plot([12.3,11.85],[5.0,4.2],color=GREEN,lw=2)
ax.plot([12.3,12.75],[5.0,4.2],color=GREEN,lw=2)

# Use cases – left column (student primary)
uc_left = [
    (3.2, 7.1, 'Use AI Chat Assistant',    BLUE),
    (3.2, 5.9, 'Generate AI Quiz',          BLUE),
    (3.2, 4.7, 'Create AI Flashcards',      GREEN),
    (3.2, 3.5, 'Summarise Text',            GREEN),
    (3.2, 2.3, 'Highlight Notes',           PURPLE),
]
uc_right = [
    (8.2, 7.1, 'View Study Analytics',     ORANGE),
    (8.2, 5.9, 'Set Daily Goal',            NAVY),
    (8.2, 4.7, 'Check Daily Streak',        NAVY),
    (8.2, 3.5, 'View Dashboard',            BLUE),
    (8.2, 2.3, 'Track Progress',            PURPLE),
]

for x,y,label,color in uc_left + uc_right:
    ax.add_patch(mpatches.Ellipse((x+1.5,y),3.0,0.72,fc='white',ec=color,lw=1.8,zorder=3))
    ax.text(x+1.5,y,label,ha='center',va='center',fontsize=10.5,color=color,zorder=4)
    # connect student
    ax.plot([1.0,x],[5.5 if y>5 else 4.5 if y>3.5 else 3.8, y],
            color='gray',lw=0.9,ls='--',zorder=2,alpha=0.6)

# connect Gemini to AI use cases
for x,y,label,color in uc_left[:5]:
    ax.plot([x+3.0,11.95],[y,5.5],color=GREEN,lw=0.8,ls=':',alpha=0.5,zorder=2)

savefig('usecase')

# ═══════════════════════════════════════════════════════════════════════════════
# 4. SEQUENCE DIAGRAM
# ═══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(14, 9.5))
ax.set_xlim(0,14); ax.set_ylim(0,9.5); ax.axis('off')
ax.text(7.0,9.2,'Sequence Diagram – AI Quiz Generation Flow',
        ha='center',fontsize=15,fontweight='bold',color=NAVY)

actors_seq = [
    (1.0,  'Student',       NAVY),
    (3.5,  'Frontend\n(React.js)', BLUE),
    (6.5,  'Backend\n(FastAPI)', '#2E75B6'),
    (9.5,  'Gemini\nAPI',   GREEN),
    (12.5, 'Database\n(SQLite)', PURPLE),
]
lifeline_y_top = 8.7
lifeline_y_bot = 0.4

for x,name,color in actors_seq:
    ax.add_patch(FancyBboxPatch((x-0.75,lifeline_y_top-0.55),1.5,0.55,
                                boxstyle='round,pad=0.08',fc=color,ec=color,lw=1.5,zorder=3))
    ax.text(x,lifeline_y_top-0.28,name,ha='center',va='center',
            fontsize=10,fontweight='bold',color='white',zorder=4)
    ax.plot([x,x],[lifeline_y_top-0.55,lifeline_y_bot],
            color=MGRAY,lw=1.5,ls='--',zorder=2)

messages = [
    (1.0,  3.5,  8.1, True,  'Enter topic, select difficulty & question count'),
    (3.5,  6.5,  7.5, True,  'POST /api/quiz/generate  {topic, num_q, difficulty}'),
    (6.5,  9.5,  6.9, True,  'Construct Gemini prompt with context'),
    (9.5,  6.5,  6.3, False, 'Return MCQ questions as JSON array'),
    (6.5,  12.5, 5.7, True,  'INSERT quiz record to database'),
    (12.5, 6.5,  5.1, False, 'Return quiz_id (auto-increment)'),
    (6.5,  3.5,  4.5, False, '200 OK  +  quiz JSON response'),
    (3.5,  1.0,  3.9, False, 'Render quiz UI with questions & options'),
    (1.0,  3.5,  3.3, True,  'Student selects answers, clicks Submit'),
    (3.5,  6.5,  2.7, True,  'POST /api/quiz/score  {quiz_id, answers}'),
    (6.5,  12.5, 2.1, True,  'UPDATE quiz score in database'),
    (6.5,  3.5,  1.5, False, '200 OK  +  {score, correct_answers, feedback}'),
    (3.5,  1.0,  0.9, False, 'Display score, highlight correct/wrong answers'),
]

for x1,x2,y,forward,label in messages:
    color = NAVY if forward else BLUE
    style = '->' if forward else '<-'
    ax.annotate('',xy=(x2,y),xytext=(x1,y),
        arrowprops=dict(arrowstyle=style,color=color,lw=1.6,
                        mutation_scale=14),zorder=5)
    lx = (x1+x2)/2
    ly = y+0.18
    ax.text(lx,ly,label,ha='center',va='bottom',fontsize=8.5,color=color,zorder=5,
            bbox=dict(fc='white',ec='none',pad=0.5))

# activation boxes
for x,y_start,y_end in [(6.5,7.5,1.5),(9.5,6.9,6.3),(12.5,5.7,5.1)]:
    ax.add_patch(FancyBboxPatch((x-0.12,y_end),0.24,y_start-y_end,
                                boxstyle='square,pad=0',fc='#D6E4F7',ec=BLUE,lw=1,zorder=3))

savefig('sequence')
print("All diagrams generated.")
