# ch02_literature.py
import sys
sys.path.insert(0, r'C:\ai-agent')
from ql_helpers import *
from ql_helpers import _p, _r, _sup

def write_ch2(doc):
    chapter_heading(doc, "2", "Literature Survey")

    section(doc, "2.1", "Literature Survey")
    body(doc,
        "The growing adoption of artificial intelligence in education has generated "
        "substantial research into intelligent tutoring systems, automated content "
        "generation, and personalised learning platforms. This section reviews key "
        "works in five relevant domains and identifies the research gaps that "
        "QuickLearner AI is designed to address.")

    subsection(doc, "2.1.1", "AI Chatbots and Conversational Agents in Education")
    body(doc,
        "Conversational AI agents have been extensively studied as tools for improving "
        "student engagement and providing on-demand academic support. Winkler and "
        "Soellner [1] reviewed 26 educational chatbot deployments and found that "
        "rule-based bots significantly improved student interaction frequency but "
        "struggled with open-ended queries. The transition to transformer-based LLMs "
        "has dramatically improved the quality of conversational agents. Koedinger "
        "et al. [2] demonstrated that AI tutors providing immediate, context-sensitive "
        "feedback produced learning gains equivalent to one-on-one human tutoring. "
        "However, most existing implementations are standalone tools embedded within "
        "specific LMS platforms and do not form part of a broader, integrated study "
        "workflow. QuickLearner AI addresses this by embedding the AI Chat Assistant "
        "within a unified platform that connects it to the student's own study "
        "material, quiz history, and analytics.")

    subsection(doc, "2.1.2", "Automated Quiz and Flashcard Generation")
    body(doc,
        "Active recall and spaced repetition are among the most empirically supported "
        "strategies for long-term memory retention [3]. Roediger and Karpicke "
        "demonstrated that practice testing produces significantly better retention "
        "than re-reading, yet most digital tools still default to passive content "
        "consumption. Automated question generation from text using NLP has been "
        "explored extensively; Du et al. [4] proposed a sequence-to-sequence model "
        "for reading-comprehension question generation that achieves near-human "
        "quality for factual questions. More recently, GPT-4 and Gemini have been "
        "used to generate pedagogically sound multiple-choice questions with "
        "distractors. QuickLearner AI exploits this capability through its Quiz "
        "Generator and Flashcard modules, allowing students to generate personalised "
        "assessment material from any text they provide.")

    subsection(doc, "2.1.3", "Text Summarisation Using Large Language Models")
    body(doc,
        "Automatic text summarisation has been an active NLP research area for over "
        "two decades. Early extractive approaches selected salient sentences from "
        "source documents, while modern abstractive models generate novel summary "
        "text. See, Liu, and Manning [5] introduced the pointer-generator network "
        "that combines extraction and abstraction for coherent summaries. The "
        "availability of large pre-trained models such as BART, T5, and Gemini has "
        "raised the quality ceiling dramatically. Goyal et al. [6] showed that "
        "LLM-generated summaries are preferred by readers over human-written ones "
        "in 72% of cases for news-domain text. In educational contexts, summarisation "
        "reduces cognitive load by condensing lengthy lecture notes or textbook "
        "chapters into concise study guides. QuickLearner AI's Text Summariser "
        "leverages Gemini for this purpose, and the Notes Highlighter extends it "
        "by identifying key sentences within the original text.")

    subsection(doc, "2.1.4", "Learning Analytics Platforms")
    body(doc,
        "Learning analytics refers to the measurement, collection, analysis, and "
        "reporting of data about learners and their contexts, with the purpose of "
        "understanding and optimising learning and the environments in which it "
        "occurs [7]. Research by Siemens and Long demonstrated that dashboards "
        "providing students with visibility into their own learning behaviour "
        "significantly increased metacognitive awareness and study consistency. "
        "Commercial platforms such as Duolingo and Khan Academy have demonstrated "
        "that streak-based gamification and daily goal tracking significantly "
        "increase daily active usage and course completion rates. QuickLearner AI "
        "incorporates a full Analytics dashboard along with Daily Goals and Daily "
        "Streak features, implementing findings from this research in the context "
        "of higher-education self-study.")

    subsection(doc, "2.1.5", "Gamification in E-Learning")
    body(doc,
        "Gamification — the application of game-design elements in non-game contexts "
        "— has been shown to significantly improve motivation and engagement in "
        "educational settings. Hamari, Koivisto, and Sarsa [8] conducted a "
        "meta-analysis of 24 empirical studies on gamification and found that the "
        "majority reported positive effects on engagement and motivation, with streak "
        "counters and goal-setting mechanisms being particularly effective. Despite "
        "these findings, most AI-powered study tools focus exclusively on content "
        "generation and neglect the motivational layer. QuickLearner AI bridges this "
        "gap by combining AI-generated study content with gamified engagement "
        "features, creating a platform that is both intellectually powerful and "
        "behaviourally motivating.")

    section(doc, "2.2", "Summary of Literature Review")
    body(doc,
        "The reviewed literature confirms that AI-powered educational tools, "
        "automated content generation, learning analytics, and gamification each "
        "independently produce measurable improvements in student outcomes. However, "
        "very few systems integrate all of these capabilities into a single, cohesive "
        "platform. The dominant trend in existing research is to address one aspect "
        "of the learning problem in isolation — either a chatbot, or a summariser, "
        "or an analytics dashboard — without considering the holistic student "
        "learning workflow.")
    body(doc,
        "QuickLearner AI directly addresses this gap by providing a unified platform "
        "that combines AI Chat, Quiz Generation, Flashcards, Text Summarisation, "
        "Notes Highlighting, Analytics, Daily Goals, Daily Streak, Dashboard, and "
        "Progress Tracking within a single application. This integrated approach, "
        "validated by the research surveyed above, forms the core innovation of "
        "the QuickLearner AI project.")

    # Literature survey table
    _p(doc, sa=8)
    table_caption(doc, "2.1", "Literature Survey Summary")
    make_table(doc,
        headers=["Ref", "Domain", "Method", "Limitation", "QL AI Contribution"],
        rows=[
            ("[1]", "AI Chatbots", "Rule-based NLP", "No open-ended answers", "Gemini LLM chat"),
            ("[2]", "AI Tutoring", "RL feedback", "LMS-specific only", "Standalone platform"),
            ("[3]", "Active Recall", "Spaced repetition", "Manual card creation", "AI Flashcard gen"),
            ("[4]", "Quiz Gen", "Seq2Seq NLP", "Domain-limited", "Gemini quiz gen"),
            ("[5]", "Summarisation", "Pointer-generator", "Extractive only", "Abstractive LLM"),
            ("[6]", "LLM Summary", "GPT-4 eval", "No study integration", "Notes Highlighter"),
            ("[7]", "Analytics", "Dashboard metrics", "No AI content", "Full analytics + AI"),
            ("[8]", "Gamification", "Meta-analysis", "No content tools", "Goals + Streak"),
        ],
        col_widths=[0.5, 1.2, 1.3, 1.5, 1.7]
    )

