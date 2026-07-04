import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

fig, ax = plt.subplots(figsize=(13, 7))
ax.set_xlim(0, 13); ax.set_ylim(0, 7)
ax.axis('off')
fig.patch.set_facecolor('white')

# ── helpers ──────────────────────────────────────────────────────────────────
def rect(ax, x, y, w, h, fc='#DDEEFF', ec='#2255AA', lw=1.5, r=0.15):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle=f"round,pad={r}", fc=fc, ec=ec, lw=lw, zorder=3))

def ellipse(ax, cx, cy, rx, ry, fc='#E8F8E8', ec='#226622', lw=1.5):
    ax.add_patch(mpatches.Ellipse((cx, cy), rx*2, ry*2,
        fc=fc, ec=ec, lw=lw, zorder=3))

def diamond(ax, cx, cy, w, h, fc='#FFF3CD', ec='#AA6600', lw=1.5):
    pts = [(cx, cy+h/2),(cx+w/2, cy),(cx, cy-h/2),(cx-w/2, cy)]
    poly = plt.Polygon(pts, closed=True, fc=fc, ec=ec, lw=lw, zorder=3)
    ax.add_patch(poly)

def dstore(ax, x, y, w, h, fc='#F0E6FF', ec='#553388', lw=1.5):
    """Open-ended rectangle (data store)."""
    ax.plot([x, x+w], [y+h, y+h], color=ec, lw=lw, zorder=3)
    ax.plot([x, x+w], [y,   y  ], color=ec, lw=lw, zorder=3)
    ax.plot([x,   x], [y,   y+h], color=ec, lw=lw, zorder=3)
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle="square,pad=0", fc=fc, ec='none', zorder=2))

def arrow(ax, x1, y1, x2, y2, label='', color='#333333'):
    ax.annotate('', xy=(x2,y2), xytext=(x1,y1),
        arrowprops=dict(arrowstyle='->', color=color, lw=1.4), zorder=4)
    mx, my = (x1+x2)/2, (y1+y2)/2
    if label:
        ax.text(mx, my+0.12, label, ha='center', va='bottom',
                fontsize=8, color='#333333', zorder=5,
                bbox=dict(fc='white', ec='none', pad=1))

def txt(ax, x, y, s, size=10, bold=False, color='#111111', ha='center', va='center'):
    w = 'bold' if bold else 'normal'
    ax.text(x, y, s, ha=ha, va=va, fontsize=size, fontweight=w, color=color, zorder=5)

# ── TITLE ────────────────────────────────────────────────────────────────────
txt(ax, 6.5, 6.65, 'Level 0 Data Flow Diagram (Context Diagram)', size=14, bold=True, color='#1a1a2e')
txt(ax, 6.5, 6.3,  'QuickLearner AI – AI Learning Agent', size=10, color='#555555')

# ── EXTERNAL ENTITIES ────────────────────────────────────────────────────────
# Student (left)
rect(ax, 0.3, 2.8, 2.2, 1.4, fc='#D6EAF8', ec='#1A5276')
txt(ax, 1.4, 3.5, 'STUDENT', size=11, bold=True, color='#1A5276')
txt(ax, 1.4, 3.15, '(User)', size=9, color='#555555')

# Gemini API (right)
rect(ax, 10.5, 2.8, 2.2, 1.4, fc='#D5F5E3', ec='#1E8449')
txt(ax, 11.6, 3.5, 'GOOGLE', size=10, bold=True, color='#1E8449')
txt(ax, 11.6, 3.22, 'GEMINI API', size=10, bold=True, color='#1E8449')
txt(ax, 11.6, 2.95, '(External AI)', size=8.5, color='#555555')

# ── CENTRAL PROCESS ──────────────────────────────────────────────────────────
ellipse(ax, 6.5, 3.5, 2.1, 1.1, fc='#FEF9E7', ec='#B7950B')
txt(ax, 6.5, 3.72, '0', size=13, bold=True, color='#7D6608')
txt(ax, 6.5, 3.38, 'QuickLearner AI', size=10, bold=True, color='#7D6608')
txt(ax, 6.5, 3.1,  'System', size=9, color='#7D6608')

# ── DATA STORES ──────────────────────────────────────────────────────────────
# SQLite DB (bottom centre)
dstore(ax, 4.5, 0.55, 4.0, 0.7, fc='#F5EEF8', ec='#6C3483')
txt(ax, 6.5, 0.9, 'D1   SQLite Database', size=9.5, bold=False, color='#4A235A')

# ── ARROWS: Student → System ─────────────────────────────────────────────────
# Study content / queries
arrow(ax, 2.5, 3.72, 4.4, 3.72, label='Study Content / Queries', color='#1A5276')
# AI responses back
arrow(ax, 4.4, 3.28, 2.5, 3.28, label='AI Responses / Reports', color='#1A5276')

# ── ARROWS: System ↔ Gemini ──────────────────────────────────────────────────
arrow(ax, 8.6, 3.72, 10.5, 3.72, label='AI Prompts (Quiz/Flash/Chat/Summ)', color='#1E8449')
arrow(ax, 10.5, 3.28, 8.6, 3.28, label='Generated Content (JSON)', color='#1E8449')

# ── ARROWS: System ↔ DB ──────────────────────────────────────────────────────
arrow(ax, 6.5, 2.4, 6.5, 1.25, label='Store / Retrieve Data', color='#6C3483')

# ── DATA FLOWS LEGEND ────────────────────────────────────────────────────────
# flows box bottom right
rect(ax, 8.8, 0.2, 3.9, 2.0, fc='#FDFEFE', ec='#AAAAAA', lw=1.0, r=0.1)
txt(ax, 10.75, 2.0, 'Data Flows', size=9, bold=True, color='#333333')
flows = [
    '• Study text, topic, questions',
    '• Quiz results, flashcard sets',
    '• Summaries, highlights',
    '• Analytics, goals, streak data',
    '• Session / chat messages',
]
for i, f in enumerate(flows):
    txt(ax, 10.75, 1.75 - i*0.28, f, size=8.5, color='#444444')

# ── LABELS FOR ENTITIES ──────────────────────────────────────────────────────
txt(ax, 1.4, 2.62, 'External Entity 1', size=7.5, color='#888888')
txt(ax, 11.6, 2.62, 'External Entity 2', size=7.5, color='#888888')

plt.tight_layout(pad=0.2)
out = r'C:\Users\viraj\OneDrive\Desktop\DFD_Level0_QuickLearnerAI.png'
plt.savefig(out, dpi=180, bbox_inches='tight', facecolor='white')
print('Saved:', out)
