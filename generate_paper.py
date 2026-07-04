from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

doc = Document()

# ── Page margins (narrow, like IJIRT) ──────────────────────────────────────
for section in doc.sections:
    section.top_margin    = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin   = Inches(0.75)
    section.right_margin  = Inches(0.75)

# ── Helper: set font ────────────────────────────────────────────────────────
def fmt(run, size, bold=False, italic=False, color=None):
    run.font.name  = "Times New Roman"
    run.font.size  = Pt(size)
    run.font.bold  = bold
    run.font.italic = italic
    if color:
        run.font.color.rgb = RGBColor(*color)

def para(text, align=WD_ALIGN_PARAGRAPH.LEFT, size=10, bold=False,
         italic=False, space_before=0, space_after=6, color=None):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after  = Pt(space_after)
    run = p.add_run(text)
    fmt(run, size, bold, italic, color)
    return p

def heading(text, level_label):
    """Section heading like 'I. INTRODUCTION'"""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after  = Pt(4)
    run = p.add_run(level_label + "  " + text)
    fmt(run, 10, bold=True)
    return p

def sub_heading(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after  = Pt(2)
    run = p.add_run(text)
    fmt(run, 10, bold=True)
    return p

def body(text, space_before=0, space_after=4, italic=False):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after  = Pt(space_after)
    p.paragraph_format.first_line_indent = Pt(14)
    run = p.add_run(text)
    fmt(run, 10, italic=italic)
    return p

def bullet(text):
    p = doc.add_paragraph(style='List Bullet')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(text)
    fmt(run, 10)
    return p

# ── Enable two-column layout via sectPr ─────────────────────────────────────
def enable_two_columns(section):
    sectPr = section._sectPr
    cols = OxmlElement('w:cols')
    cols.set(qn('w:num'), '2')
    cols.set(qn('w:space'), '720')  # ~0.5 inch gap
    sectPr.append(cols)

# ══════════════════════════════════════════════════════════════════════════════
# HEADER LINE
# ══════════════════════════════════════════════════════════════════════════════
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(6)
run = p.add_run("© June 2026 | IJIRT | Volume 13 Issue 1 | ISSN: 2349-6002")
fmt(run, 10)

# Horizontal rule
p2 = doc.add_paragraph()
p2.paragraph_format.space_after = Pt(0)
pPr = p2._p.get_or_add_pPr()
pBdr = OxmlElement('w:pBdr')
bottom = OxmlElement('w:bottom')
bottom.set(qn('w:val'), 'single')
bottom.set(qn('w:sz'), '6')
bottom.set(qn('w:space'), '1')
bottom.set(qn('w:color'), '000000')
pBdr.append(bottom)
pPr.append(pBdr)

# ── TITLE ────────────────────────────────────────────────────────────────────
para("AI-Powered Study Assistant: An Intelligent Full-Stack Platform\nfor Personalized Learning Using Large Language Models",
     WD_ALIGN_PARAGRAPH.CENTER, size=18, bold=True, space_before=12, space_after=10)

# ── AUTHORS ──────────────────────────────────────────────────────────────────
para("Viraj Kulye¹, Pranav Lawand², Janhavi Lande³, Kunal Khopade⁴, Mrs. Sucheta Navale⁵",
     WD_ALIGN_PARAGRAPH.CENTER, size=10, space_after=2)
para("¹·²·³ Sinhgad Institute of Technology and Science, Pune Narhe, Pune, India",
     WD_ALIGN_PARAGRAPH.CENTER, size=10, italic=True, space_after=2)
para("⁴ Guide, Sinhgad Institute of Technology and Science, Pune, Narhe, Pune, India",
     WD_ALIGN_PARAGRAPH.CENTER, size=10, italic=True, space_after=12)

# ══════════════════════════════════════════════════════════════════════════════
# TWO-COLUMN SECTION STARTS HERE
# ══════════════════════════════════════════════════════════════════════════════
enable_two_columns(doc.sections[0])

# ── ABSTRACT ─────────────────────────────────────────────────────────────────
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
p.paragraph_format.space_after = Pt(4)
r1 = p.add_run("Abstract")
fmt(r1, 10, bold=True, italic=True)
r2 = p.add_run(
    "—The AI-Powered Study Assistant is an advanced, full-stack intelligent learning "
    "platform designed to enhance the academic performance of students by leveraging "
    "the capabilities of Google Gemini large language models. The system integrates a "
    "React.js frontend with a FastAPI backend and a SQLite database to deliver a "
    "comprehensive suite of study tools including an AI chat interface, automated "
    "flashcard generation, quiz creation, text summarization, notes highlighting, and "
    "learning analytics. The platform is designed to address the limitations of passive "
    "and fragmented study methods by providing a unified, intelligent, and interactive "
    "learning environment. The AI component utilizes Google Gemini (gemini-pro-latest) "
    "to generate contextually accurate and educationally relevant responses, achieving "
    "real-time performance with minimal latency. The system incorporates libraries and "
    "frameworks such as React, Tailwind CSS, Framer Motion, FastAPI, SQLAlchemy, and "
    "Pydantic to ensure a robust, scalable, and user-friendly experience. The platform "
    "provides a unified dashboard that seamlessly integrates all study features, "
    "enabling students to learn efficiently, track their progress, and interact with "
    "AI-generated content proactively."
)
fmt(r2, 10)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
p.paragraph_format.space_after = Pt(10)
r1 = p.add_run("Index Terms")
fmt(r1, 10, bold=True, italic=True)
r2 = p.add_run(
    "—AI Study Assistant, Large Language Models (LLM), Google Gemini, FastAPI, "
    "React.js, Flashcard Generation, Quiz Generator, Text Summarization, "
    "Natural Language Processing, Personalized Learning, Full-Stack Application."
)
fmt(r2, 10, italic=True)

# ── I. INTRODUCTION ──────────────────────────────────────────────────────────
heading("INTRODUCTION", "I.")
body(
    "In the modern era of digital education, students face significant challenges in "
    "effectively managing and processing large volumes of study material. Traditional "
    "study methods—such as passive reading, manual note-taking, and rote "
    "memorization—are increasingly insufficient for the demands of contemporary "
    "academic curricula. The rapid advancement of Artificial Intelligence and Natural "
    "Language Processing has created new opportunities to develop intelligent tools "
    "that can assist students in a personalized, interactive, and efficient manner."
)
body(
    "Existing educational tools often operate in silos, offering either a chat "
    "interface or a flashcard generator, but rarely an integrated platform that covers "
    "the full spectrum of study needs. Furthermore, most tools rely on static content "
    "and fail to adapt to the specific queries or material provided by individual "
    "students. This creates a critical gap between the potential of AI-driven "
    "personalized learning and the reality of tools currently available to students."
)
body(
    "To address these challenges, the AI Study Assistant has been developed as a "
    "full-stack intelligent learning platform. It combines a React.js frontend with a "
    "FastAPI backend and integrates Google Gemini AI to deliver real-time, context-aware "
    "educational support. The system offers chat-based Q&A, automated flashcard "
    "generation, quiz creation, text summarization, notes highlighting, and "
    "learning analytics within a single unified interface."
)
body(
    "The platform was built using Python and JavaScript, leveraging libraries such as "
    "SQLAlchemy for database management, Pydantic for data validation, Tailwind CSS "
    "for responsive design, and Framer Motion for smooth UI animations. The system "
    "architecture follows a modular, layered design that allows for independent "
    "development and future scalability. Overall, the AI Study Assistant provides a "
    "practical, intelligent, and scalable solution for modern student learning needs."
)

# ── II. LITERATURE REVIEW ────────────────────────────────────────────────────
heading("LITERATURE REVIEW", "II.")
body(
    "The growing adoption of AI in education has spurred extensive research into "
    "intelligent tutoring systems, automated content generation, and personalized "
    "learning platforms. This section reviews existing research and highlights "
    "the methodologies, contributions, and limitations relevant to this work."
)
sub_heading("A. The Problem: Limitations of Traditional Study Methods")
body(
    "Existing literature highlights that passive learning methods are significantly "
    "less effective than active, retrieval-based practices such as flashcards and "
    "self-testing [1]. Students often lack access to tools that can generate "
    "personalized quizzes or summaries from their own notes, forcing reliance on "
    "generic textbooks and static resources. This gap is further widened by the "
    "absence of intelligent feedback mechanisms in traditional study environments."
)
sub_heading("B. Review of AI in Education: Chatbots and Tutoring Systems")
body(
    "Research into AI-driven tutoring systems has demonstrated the effectiveness of "
    "conversational agents in improving student engagement and comprehension [2]. "
    "Early chatbot-based tutoring tools used rule-based systems, which limited their "
    "ability to handle diverse or open-ended queries. The advent of transformer-based "
    "large language models (LLMs) such as GPT and Gemini has significantly advanced "
    "the capability of AI tutors to provide accurate, context-aware responses [3]."
)
sub_heading("C. Automated Flashcard and Quiz Generation")
body(
    "Studies have shown that spaced repetition and active recall through flashcards "
    "significantly improve long-term retention [4]. Automated flashcard generation "
    "from text using NLP techniques has been explored in tools such as Anki plugins "
    "and AI-based generators. However, most existing solutions lack integration with "
    "a broader study platform and do not support dynamic quiz generation from "
    "user-provided content."
)
sub_heading("D. Text Summarization Using LLMs")
body(
    "Automatic text summarization has been a well-researched NLP task, with modern "
    "approaches leveraging pre-trained transformer models to generate extractive and "
    "abstractive summaries [5]. The integration of LLMs like Gemini into study "
    "platforms enables high-quality, coherent summaries tailored to the student's "
    "specific material, which is a significant improvement over generic summarization "
    "tools."
)
sub_heading("E. The Identified Research Gap: Lack of Unified Platforms")
body(
    "The literature reveals a significant gap in the integration of multiple AI-driven "
    "study tools into a single, cohesive platform. Most existing solutions address "
    "only one aspect of the study workflow—either chat, or flashcards, or "
    "summaries—but very few combine all these features effectively. Additionally, "
    "existing platforms often lack real-time responsiveness, analytics, and a "
    "user-friendly interface suitable for daily academic use."
)
sub_heading("F. Contribution of This Work")
body(
    "The AI Study Assistant addresses these limitations by introducing a unified, "
    "full-stack platform that integrates chat-based Q&A, flashcard generation, quiz "
    "creation, summarization, notes highlighting, and learning analytics. By "
    "combining these features with the power of Google Gemini AI and a modern "
    "React.js frontend, the platform offers a comprehensive and practical solution "
    "for student learning."
)

# ── III. PROBLEM STATEMENT ───────────────────────────────────────────────────
heading("PROBLEM STATEMENT", "III.")
body(
    "Ensuring effective and personalized learning for students has become a critical "
    "challenge in the digital age. The current educational technology landscape "
    "consists of multiple isolated tools—note-taking apps, flashcard generators, "
    "quiz platforms, and AI chatbots—that operate independently. This fragmentation "
    "forces students to switch between multiple applications, creating a disjointed "
    "and inefficient study experience. The lack of integration leads to lost context, "
    "wasted time, and reduced learning effectiveness."
)
body(
    "Furthermore, most available tools rely on static content or require manual input "
    "for every task. They fail to intelligently adapt to the specific study material "
    "provided by the student, and none offer a unified dashboard that combines AI "
    "chat, content generation, and progress analytics. The problem is further "
    "intensified by the lack of real-time AI responsiveness in many existing platforms, "
    "leading to slow feedback loops that disrupt the study flow."
)
body(
    "Therefore, there is a clear need for a unified, intelligent, and scalable study "
    "assistant that can accept student-provided content and automatically generate "
    "flashcards, quizzes, and summaries, while also providing an interactive AI chat "
    "interface and tracking learning progress—all within a single, responsive platform."
)

# ── IV. SYSTEM DESIGN AND METHODOLOGY ────────────────────────────────────────
heading("SYSTEM DESIGN AND METHODOLOGY", "IV.")
body(
    "The AI Study Assistant was designed and implemented using a structured, modular "
    "approach to ensure scalability, maintainability, and real-time performance. The "
    "development process followed a layered architecture, integrating a React.js "
    "frontend, a FastAPI backend, a SQLite database, and the Google Gemini AI API."
)
sub_heading("A. System Overview")
bullet("The AI Study Assistant is a full-stack intelligent learning platform designed to assist students with AI-powered chat, flashcard generation, quiz creation, text summarization, and notes highlighting.")
bullet("The architecture follows a modular, client-server design, allowing independent development and integration of all features.")
bullet("Technologies used include React.js (frontend), FastAPI (backend), SQLAlchemy ORM (database), Google Gemini API (AI), and SQLite (data storage).")
bullet("The core objectives include accurate AI responses, real-time performance, ease of use, and a unified study dashboard.")

sub_heading("B. System Architecture")
bullet("The Presentation Layer (Frontend) is built with React.js and Tailwind CSS, providing a responsive, dark-mode-enabled UI with Framer Motion animations.")
bullet("The Application Layer (Backend) is built with FastAPI, exposing approximately 15 RESTful API endpoints for chat, flashcards, quizzes, summaries, notes, and analytics.")
bullet("The Data Layer uses SQLAlchemy ORM with a SQLite database, managing 7 tables for sessions, messages, flashcards, quizzes, notes, summaries, and analytics.")
bullet("The AI Integration Layer uses the Google Gemini API (gemini-pro-latest model) for all AI-driven content generation and chat responses.")

sub_heading("C. Methodology")
bullet("Requirement analysis defined functional (chat, flashcards, quizzes, summaries, notes, analytics) and non-functional (performance, scalability, usability) needs.")
bullet("System design included API contract definition, database schema design, and React component architecture.")
bullet("Implementation used Python with FastAPI for the backend and JavaScript with React.js for the frontend.")
bullet("Data validation was handled using Pydantic schemas for all API request and response models.")
bullet("CORS was configured to allow secure cross-origin communication between the frontend (port 3000) and backend (port 8000).")
bullet("Testing included unit testing of API endpoints, integration testing of AI responses, and UI testing of all frontend components.")

sub_heading("D. Workflow of the System")
bullet("The student submits a query or study content via the React.js frontend.")
bullet("The request is sent to the FastAPI backend via REST API.")
bullet("The backend processes the request, calls the Gemini AI API, and stores results in the SQLite database.")
bullet("The AI-generated response (chat reply, flashcards, quiz, summary, or highlighted notes) is returned to the frontend.")
bullet("The frontend displays the results in real-time within the appropriate UI component.")
bullet("All interactions are logged for analytics and progress tracking.")

# ── V. EXPERIMENTATION AND IMPLEMENTATION ────────────────────────────────────
heading("EXPERIMENTATION AND IMPLEMENTATION", "V.")
sub_heading("A. Implementation Process")
bullet("The implementation began with setting up the Python virtual environment and installing required libraries including FastAPI, SQLAlchemy, Google Generative AI, and Uvicorn.")
bullet("The React frontend was initialized with Create React App and configured with Tailwind CSS and Framer Motion.")
bullet("The backend exposes 15 API endpoints covering chat, Q&A, flashcards, quizzes, summaries, notes highlighting, and analytics.")
bullet("The Google Gemini AI client was implemented in a dedicated gemini_client.py module for clean separation of concerns.")
bullet("PowerShell startup scripts (start.ps1, start-backend.ps1, start-frontend.ps1) were created for reliable Windows deployment.")
bullet("Exception handling and logging were implemented throughout the backend to ensure system stability.")

sub_heading("B. Experimentation and Analysis")
bullet("Testing was conducted in a local development environment with the backend running on port 8000 and the frontend on port 3000.")
bullet("Initial experiments focused on validating AI response quality for chat, flashcard generation, quiz creation, and summarization tasks.")
bullet("The Gemini AI model consistently generated contextually accurate and educationally relevant responses across all tested use cases.")
bullet("Real-time performance testing confirmed that API responses were delivered with minimal latency during normal usage.")
bullet("Integration testing verified seamless communication between the React frontend and FastAPI backend across all 15 endpoints.")
bullet("The SQLite database correctly persisted all user data including chat history, flashcards, quizzes, summaries, and notes.")

sub_heading("C. System Performance and Responsiveness")
body("The lightweight architecture of the AI Study Assistant was validated through system performance and real-time interaction tests.")
body(
    "Quantitative Performance: API response times for AI-generated content (flashcards, quizzes, summaries) were measured during testing. "
    "The system delivered responses within acceptable latency bounds for real-time student interaction. "
    "The health check endpoint consistently returned a healthy status, confirming backend stability."
)
body(
    "Qualitative Performance: The React frontend remained highly responsive during AI interactions. "
    "Framer Motion animations rendered smoothly without degrading UI performance. "
    "The modular component architecture allowed independent features to operate without interfering with each other."
)

# ── VI. RESULTS AND DISCUSSION ────────────────────────────────────────────────
heading("RESULTS AND DISCUSSION", "VI.")
body(
    "The implementation and testing of the AI Study Assistant produced positive and "
    "reliable results. The system successfully integrated Google Gemini AI with a "
    "full-stack React and FastAPI architecture to deliver a comprehensive, "
    "intelligent study platform."
)
sub_heading("A. Successful Implementation of All Study Features")
body("All seven core study features were implemented and tested successfully.")
bullet("The AI Chat interface correctly handled multi-turn conversations with session management and a 'New Chat' reset feature.")
bullet("The Flashcard Generator produced accurate, topic-relevant question-answer pairs from student-provided text.")
bullet("The Quiz Generator created well-structured multiple-choice questions with correct answer identification.")
bullet("The Text Summarizer generated concise, coherent summaries preserving key information from input content.")
bullet("The Notes Highlighter identified and emphasized the most important concepts within student notes.")
bullet("The Analytics dashboard correctly tracked and visualized student activity and usage patterns.")

sub_heading("B. Proven Real-Time AI Integration")
body(
    "This is the most significant result of the project. All AI features operated in "
    "real-time, with the Gemini API delivering responses without noticeable delay during testing."
)
bullet("The FastAPI backend correctly routed all requests to the Gemini AI client and returned structured responses.")
bullet("Session management correctly maintained chat history, enabling coherent multi-turn conversations.")
bullet("Pydantic schemas successfully validated all API inputs and outputs, preventing malformed data errors.")

sub_heading("C. Addressing the Problem of Fragmented Study Tools")
body(
    "Fragmented study tools were identified as a major limitation of existing educational platforms. "
    "The AI Study Assistant addresses this by providing a single unified dashboard that integrates "
    "all study features. Students no longer need to switch between multiple applications, "
    "significantly improving study workflow efficiency."
)

sub_heading("D. Limitations of the Current Study")
bullet("The system was tested in a local development environment and was not deployed on a cloud-based production server.")
bullet("The AI response quality depends on the Google Gemini API, which may occasionally produce imprecise answers for highly specialized topics.")
bullet("The SQLite database is suitable for development but is not recommended for high-concurrency production use.")
bullet("User authentication and multi-user session isolation have not been implemented in the current version.")

sub_heading("E. Future Work and Recommendations")
bullet("Deploying the application to a cloud platform (e.g., AWS, GCP) with a PostgreSQL database for production-scale use.")
bullet("Implementing JWT-based user authentication to support personalized profiles and isolated user data.")
bullet("Integrating spaced repetition algorithms into the flashcard system for optimized long-term retention.")
bullet("Adding speech-to-text input for voice-based interaction with the AI study assistant.")
bullet("Expanding analytics to include detailed performance metrics such as quiz scores, study time, and topic mastery tracking.")

# ── VII. CONCLUSION ──────────────────────────────────────────────────────────
heading("CONCLUSION", "VII.")
body(
    "This project successfully addressed the challenge of fragmented and inefficient "
    "student study tools by developing a unified, AI-powered study assistant. The "
    "central objective was to design, implement, and validate a full-stack intelligent "
    "learning platform that combines Google Gemini AI with a modern React.js frontend "
    "and FastAPI backend."
)
body(
    "The outcome is a functional and efficient platform that successfully delivers "
    "AI-powered chat, flashcard generation, quiz creation, text summarization, notes "
    "highlighting, and learning analytics within a single interface. Testing confirmed "
    "that the system responds accurately and in real-time across all features. The "
    "modular architecture ensures clean separation of concerns and straightforward "
    "future extensibility."
)
body(
    "The primary contribution of this work lies in the development of an integrated, "
    "practical, and user-friendly AI study platform that demonstrates the potential of "
    "large language models in personalized education. The project addresses limitations "
    "found in existing standalone educational tools by providing a real-time, scalable, "
    "and comprehensive learning solution. Future enhancements including cloud deployment, "
    "user authentication, and spaced repetition algorithms will further strengthen the "
    "platform's capabilities and real-world applicability."
)

# ── REFERENCES ────────────────────────────────────────────────────────────────
heading("REFERENCES", "")
refs = [
    "[1] H. L. Roediger and J. D. Karpicke, \"The Power of Testing Memory: Basic Research and Implications for Educational Practice,\" Perspectives on Psychological Science, vol. 1, no. 3, pp. 181–210, 2006.",
    "[2] K. VanLehn, \"The Relative Effectiveness of Human Tutoring, Intelligent Tutoring Systems, and Other Tutoring Systems,\" Educational Psychologist, vol. 46, no. 4, pp. 197–221, 2011.",
    "[3] T. Brown et al., \"Language Models are Few-Shot Learners,\" Advances in Neural Information Processing Systems, vol. 33, pp. 1877–1901, 2020.",
    "[4] P. Pimsleur, \"A Memory Schedule,\" The Modern Language Journal, vol. 51, no. 2, pp. 73–75, 1967.",
    "[5] A. See, P. J. Liu, and C. D. Manning, \"Get To The Point: Summarization with Pointer-Generator Networks,\" in Proc. 55th Annual Meeting of the Association for Computational Linguistics, 2017, pp. 1073–1083.",
    "[6] S. Abramovich, C. Schunn, and R. S. Higashi, \"Are badges useful in education? It depends upon the type of badge and expertise of learner,\" Educational Technology Research and Development, vol. 61, no. 2, pp. 217–232, 2013.",
    "[7] S. Tiong and Y.-W. Lim, \"AI-Powered Personalized Learning: A Review,\" International Journal of Advanced Computer Science and Applications, vol. 13, no. 4, 2022.",
    "[8] T. Akiba et al., \"Optuna: A Next-generation Hyperparameter Optimization Framework,\" in Proc. 25th ACM SIGKDD, 2019, pp. 2623–2631.",
    "[9] Google, \"Gemini API Documentation,\" Google AI for Developers. Available: https://ai.google.dev",
    "[10] S. Raschka and V. Mirjalili, Python Machine Learning, 3rd ed. Packt Publishing, 2019.",
]
for ref in refs:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.first_line_indent = Pt(-14)
    p.paragraph_format.left_indent = Pt(14)
    run = p.add_run(ref)
    fmt(run, 9)

# ── Save ──────────────────────────────────────────────────────────────────────
out = r"C:\Users\viraj\OneDrive\Desktop\AI_Study_Assistant_Paper_IJIRT.docx"
doc.save(out)
print("Saved:", out)
