# ch01_introduction.py
import sys
sys.path.insert(0, r'C:\ai-agent')
from ql_helpers import *
from ql_helpers import _p, _r, _sup
from docx.enum.text import WD_ALIGN_PARAGRAPH

def write_ch1(doc):
    chapter_heading(doc, "1", "Introduction")

    body(doc,
        "In the era of rapidly evolving digital technologies, the way students learn and "
        "interact with academic content is undergoing a profound transformation. The "
        "proliferation of the internet, mobile devices, and artificial intelligence has "
        "created an unprecedented opportunity to redesign the learning experience from "
        "the ground up. Despite this opportunity, the majority of students still rely on "
        "fragmented and passive study methods — reading textbooks, copying notes by hand, "
        "and using static flashcard applications — none of which leverage the power of "
        "modern AI to personalise or adapt the learning experience.")

    body(doc,
        "QuickLearner AI is an intelligent, full-stack AI learning agent developed to "
        "address this gap. It combines a React.js frontend with a FastAPI backend and "
        "integrates Google Gemini's generative AI to deliver a comprehensive suite of "
        "study tools within a single, unified platform. The system provides ten core "
        "features: an AI Chat Assistant, AI Quiz Generator, AI Flashcards, AI Notes "
        "Highlighter, AI Text Summariser, Study Analytics, Daily Goals, Daily Streak, "
        "Dashboard, and Progress Tracking. Together, these features enable students "
        "to study more efficiently, retain information better, and monitor their own "
        "academic progress in real time.")

    body(doc,
        "The project is motivated by the real-world challenges that students face in "
        "self-directed learning environments. Without intelligent feedback, adaptive "
        "content, or motivational tools, many students struggle to maintain consistency "
        "and depth in their studies. QuickLearner AI addresses each of these pain points "
        "through a carefully designed combination of AI-generated content, gamified "
        "engagement features, and data-driven analytics.")

    section(doc, "1.1", "Overview")
    body(doc,
        "QuickLearner AI is a web-based intelligent learning platform that acts as a "
        "personal AI study companion for students. The project focuses on replacing "
        "fragmented, static study tools with a smart, integrated, and adaptive platform. "
        "The system is built around three main layers:")
    bullet(doc, "Frontend: A React.js SPA with Tailwind CSS providing a responsive, dark-mode-enabled interface with smooth Framer Motion animations.")
    bullet(doc, "Backend: A FastAPI server with SQLAlchemy ORM and SQLite database exposing RESTful API endpoints for all features.")
    bullet(doc, "AI Layer: Google Gemini API (gemini-pro-latest) for natural language understanding, content generation, and intelligent responses.")
    body(doc,
        "The main goal of QuickLearner AI is to integrate all AI-powered study features "
        "into a single platform, making it easier for students to learn, self-assess, "
        "and track their academic growth.")

    section(doc, "1.2", "Motivation")
    body(doc,
        "The motivation behind developing QuickLearner AI arises from the practical "
        "challenges faced by students in managing their study activities effectively. "
        "Modern students are overwhelmed with large volumes of content across multiple "
        "subjects. Traditional tools like printed notes, physical flashcards, and "
        "generic online quizzes are disconnected from each other and offer no "
        "personalisation or intelligent feedback.")
    body(doc,
        "There is a strong need for a centralised AI-powered system that can bring all "
        "study activities under one platform. QuickLearner AI is motivated by the idea "
        "of transforming passive learning into an active, intelligent, and engaging "
        "experience. By using Google Gemini to generate quizzes, summaries, and "
        "flashcards from any text the student provides, the system ensures that every "
        "student gets personalised study material tailored to their own content.")
    body(doc,
        "Another key motivation is to improve study consistency through gamification. "
        "Daily Goals and Daily Streak features encourage students to maintain regular "
        "study habits, while the Analytics dashboard provides data-driven insights "
        "into their learning patterns. Overall, the motivation of this project is to "
        "create an efficient, intelligent, and engaging digital learning environment "
        "that helps students achieve better academic outcomes.")

    section(doc, "1.3", "Problem Definition and Objectives")
    body(doc,
        "Students in higher education rely on fragmented tools — note-taking apps, "
        "static flashcard websites, generic online quiz platforms, and unconnected AI "
        "chatbots — that operate in isolation. This fragmentation forces students to "
        "switch between multiple applications, disrupting focus and wasting valuable "
        "study time. Furthermore, none of these tools adapt to the student's own study "
        "material, and most lack motivational features or progress tracking.")
    body(doc,
        "The objective of QuickLearner AI is to develop a unified, intelligent learning "
        "agent that integrates AI-powered content generation, active recall mechanisms, "
        "and learning analytics into a single web application. The system aims to "
        "automate content creation from student-provided text, provide real-time "
        "intelligent assistance, and track learning progress — all within one platform. "
        "The specific objectives of the proposed work are:")
    numbered(doc, "To design and develop a full-stack web application with an AI-powered backend and a responsive React.js frontend.")
    numbered(doc, "To integrate Google Gemini API for AI Chat, Quiz Generation, Flashcard Creation, Text Summarisation, and Notes Highlighting.")
    numbered(doc, "To implement a persistent SQLite database using SQLAlchemy ORM to store all user-generated content and session data.")
    numbered(doc, "To provide a Study Analytics dashboard that visualises learning activity, quiz scores, and study time trends.")
    numbered(doc, "To implement Daily Goals and Daily Streak features for motivational engagement and consistent study habits.")
    numbered(doc, "To provide a unified Dashboard with Progress Tracking for longitudinal performance monitoring.")
    numbered(doc, "To ensure a user-friendly, responsive, and accessible interface suitable for daily academic use.")

    # Problem-Solution ASCII diagram
    _p(doc, sa=8)
    ascii_diagram(doc, [
        "  PROBLEM                           SOLUTION",
        "  ---------------------------------+----------------------------------",
        "  Fragmented study tools            Unified AI Learning Agent",
        "  No AI-generated content           Gemini-powered Quiz/Flash/Summary",
        "  No personalised feedback          AI Chat Assistant with context",
        "  Lack of motivation tracking       Daily Goals + Streak system",
        "  No progress visibility            Analytics + Progress Dashboard",
        "  Passive note-reading              Active recall with Flashcards",
    ], caption=("1.1", "Problem Definition for QuickLearner AI"))

    section(doc, "1.4", "Project Scope and Limitations")
    body(doc,
        "The scope of QuickLearner AI is to develop a fully functional, browser-based "
        "intelligent learning agent accessible via any modern web browser without "
        "installation. The system includes an AI chat interface, content generation "
        "tools, gamification features, and an analytics dashboard — all within a single "
        "full-stack web application. The project covers all functionalities required for "
        "self-directed student learning, from initial content ingestion through "
        "AI-generated study material to progress monitoring.")
    body(doc,
        "The system is designed to be modular and scalable, allowing new AI features "
        "to be added without restructuring the existing codebase. It is suitable for "
        "individual students in higher education and can be extended to institutional "
        "deployment with minor modifications.")
    body(doc,
        "The system has certain limitations. The quality of AI-generated content "
        "depends on the Google Gemini API, which may occasionally produce imprecise "
        "answers for highly specialised academic topics. The current implementation "
        "uses SQLite, which is appropriate for single-user or small-group use but "
        "is not recommended for large-scale concurrent deployments. The system "
        "requires an active internet connection for all AI features. User "
        "authentication and multi-user isolation have not been implemented in "
        "the current version.")

    section(doc, "1.5", "Methodologies of Problem Solving")
    body(doc,
        "The development of QuickLearner AI follows a structured Agile-Iterative "
        "methodology to solve the problem of fragmented and passive student learning. "
        "The methodology begins with requirements gathering through analysis of student "
        "learning challenges and review of existing educational tools. Based on this "
        "analysis, the system requirements are defined and the architecture is designed.")
    body(doc,
        "The implementation follows iterative sprints, with each sprint delivering a "
        "working set of features. The AI integration layer is developed first to "
        "validate the core value proposition, followed by the UI components and "
        "database layer. Each feature is unit-tested before integration, and the "
        "system is evaluated end-to-end after each sprint. This approach ensures "
        "early detection of issues and allows for continuous refinement of the "
        "user experience based on feedback.")
    body(doc,
        "The final system is validated through functional testing, integration testing, "
        "performance testing, and usability evaluation. The modular architecture "
        "ensures that each component — AI layer, backend API, database, and "
        "frontend — can be developed, tested, and maintained independently.")

