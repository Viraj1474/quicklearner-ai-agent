# Part 2: content helpers and abstract/intro

def body(text, sb=0, sa=4):
    """Justified body paragraph with no first-line indent (matching reference)."""
    p = add_para(WD_ALIGN_PARAGRAPH.JUSTIFY, sb=sb, sa=sa)
    r = p.add_run(text)
    set_run(r, 10)
    return p

def sec_heading(roman, title):
    """Centered section heading: 'I. INTRODUCTION'"""
    p = add_para(WD_ALIGN_PARAGRAPH.CENTER, sb=8, sa=4)
    r = p.add_run(roman + " " + title)
    set_run(r, 10, bold=True)
    return p

def sub_heading(letter, title):
    """Sub-heading like reference: 'A. The Problem: ...' bold, left-aligned"""
    p = add_para(WD_ALIGN_PARAGRAPH.LEFT, sb=6, sa=2)
    r = p.add_run(letter + " " + title)
    set_run(r, 10, bold=True)
    return p

# ════════════════════════════════════════════════════════════════════════════
# ABSTRACT
# ════════════════════════════════════════════════════════════════════════════
p = add_para(WD_ALIGN_PARAGRAPH.JUSTIFY, sb=0, sa=4)
r = p.add_run("Abstract")
set_run(r, 10, bold=True, italic=True)
r = p.add_run(
    "\u2014The AI-Powered Study Assistant is an advanced intelligent learning platform "
    "designed to enhance the academic performance of students by integrating Google Gemini "
    "large language models with a modern full-stack architecture. The system combines a "
    "React.js frontend with a FastAPI backend and SQLite database to deliver a comprehensive "
    "suite of study tools including AI-powered chat, automated flashcard generation, quiz "
    "creation, text summarization, notes highlighting, and learning analytics. The platform "
    "addresses the limitations of fragmented and passive study methods by providing a unified, "
    "interactive, and intelligent learning environment. The AI component utilizes Google "
    "Gemini (gemini-pro-latest) to generate contextually accurate and educationally relevant "
    "responses in real-time. The system incorporates libraries such as React, Tailwind CSS, "
    "Framer Motion, FastAPI, SQLAlchemy, and Pydantic, ensuring a robust, scalable, and "
    "user-friendly experience. The platform provides a unified dashboard that seamlessly "
    "integrates all study features, enabling students to learn efficiently, track their "
    "progress, and interact with AI-generated content proactively."
)
set_run(r, 10, bold=True)

p = add_para(WD_ALIGN_PARAGRAPH.JUSTIFY, sb=0, sa=10)
r = p.add_run("Index Terms")
set_run(r, 10, bold=True, italic=True)
r = p.add_run(
    "\u2014AI Study Assistant, Large Language Models (LLM), Google Gemini, FastAPI, React.js, "
    "Flashcard Generation, Quiz Generator, Text Summarization, Natural Language Processing, "
    "Personalized Learning, Full-Stack Web Application."
)
set_run(r, 10, italic=True)

# ════════════════════════════════════════════════════════════════════════════
# I. INTRODUCTION
# ════════════════════════════════════════════════════════════════════════════
sec_heading("I.", "INTRODUCTION")
body(
    "In the modern era of digital education, students face significant challenges in "
    "effectively managing and processing large volumes of academic material. Traditional "
    "study methods such as passive reading, manual note-taking, and rote memorization "
    "are increasingly insufficient for the demands of contemporary curricula. The rapid "
    "advancement of Artificial Intelligence and Natural Language Processing has created "
    "new opportunities to develop intelligent tools that assist students in a personalized, "
    "interactive, and efficient manner [1], [3]."
)
body(
    "Existing educational tools often operate in isolation, offering either a chat interface "
    "or a flashcard generator, but rarely a fully integrated platform covering the complete "
    "spectrum of student study needs. Furthermore, most tools rely on static content and "
    "fail to adapt to specific material provided by individual students. This creates a "
    "critical gap between the potential of AI-driven personalized learning and the reality "
    "of tools currently available to students."
)
body(
    "To address these challenges, the AI Study Assistant has been developed as a full-stack "
    "intelligent learning platform. It combines a React.js frontend with a FastAPI backend "
    "and integrates Google Gemini AI to deliver real-time, context-aware educational support. "
    "The system offers chat-based Q&A, automated flashcard generation, quiz creation, text "
    "summarization, notes highlighting, and learning analytics within a single unified interface."
)
body(
    "The platform was built using Python and JavaScript, leveraging libraries such as "
    "SQLAlchemy for database management, Pydantic for data validation, Tailwind CSS for "
    "responsive design, and Framer Motion for smooth UI animations. The system architecture "
    "follows a modular, layered design that allows for independent development and future "
    "scalability. The AI Study Assistant provides a practical, intelligent, and scalable "
    "solution for modern student learning needs."
)

print("Part 2 done")
