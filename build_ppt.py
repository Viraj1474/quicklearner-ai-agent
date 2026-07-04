import sys; sys.path.insert(0, r'C:\ai-agent')
from ppt_helpers import new_prs
from ppt_slides_a import build_slides_a
from ppt_slides_b import build_slides_b

prs = new_prs()
prs = build_slides_a(prs)
prs = build_slides_b(prs)

out = r"C:\Users\viraj\OneDrive\Desktop\QuickLearner_AI_PPT_v3.pptx"
prs.save(out)
print(f"Saved: {out}  ({len(prs.slides)} slides)")
