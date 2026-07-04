# Part 4: System Design and Methodology

# ════════════════════════════════════════════════════════════════════════════
# IV. SYSTEM DESIGN AND METHODOLOGY
# ════════════════════════════════════════════════════════════════════════════
sec_heading("IV.", "SYSTEM DESIGN AND METHODOLOGY")
body(
    "The AI Study Assistant was designed and implemented using a structured, modular approach "
    "to ensure efficiency, scalability, and real-time performance. The development process "
    "followed a stepwise methodology, starting from requirements analysis through system "
    "design, implementation, and testing. The overall architecture is based on a layered "
    "design, integrating AI-based content generation with a responsive web interface and "
    "persistent data storage."
)
sub_heading("A.", "System Overview")
body(
    "The AI Study Assistant is a full-stack intelligent learning platform designed to assist "
    "students with personalized, AI-powered study tools. The architecture follows a modular "
    "design, allowing independent development and integration of all features and components."
)
body(
    "Technologies used include React.js as the core frontend framework, FastAPI as the backend "
    "web framework, SQLAlchemy ORM for database management, Google Gemini API for AI content "
    "generation, and SQLite as the database engine. Supporting libraries include Tailwind CSS "
    "for styling, Framer Motion for animations, Pydantic for data validation, and Uvicorn as "
    "the ASGI server."
)
body(
    "The core objectives include accurate AI-generated study content, real-time responsiveness, "
    "low computational overhead, ease of use, and a unified interface for all study activities."
)
sub_heading("B.", "System Architecture")
body(
    "The Presentation Layer is built with React.js and Tailwind CSS, providing a responsive, "
    "dark-mode-enabled user interface with Framer Motion animations across all components."
)
body(
    "The Application Layer is built with FastAPI, exposing approximately 15 RESTful API "
    "endpoints covering chat, flashcard generation, quiz creation, summarization, notes "
    "highlighting, and analytics. All request and response models are validated using "
    "Pydantic schemas."
)
body(
    "The Data Layer uses SQLAlchemy ORM with a SQLite database, managing 7 tables for "
    "chat sessions, messages, flashcards, quizzes, notes, summaries, and user analytics. "
    "Network data is stored and retrieved efficiently for both real-time use and "
    "historical analysis."
)
body(
    "The AI Integration Layer uses the Google Gemini API (gemini-pro-latest model) encapsulated "
    "in a dedicated gemini_client.py module. This module handles all prompt construction, "
    "API calls, error handling, and response parsing for every AI-powered feature."
)
sub_heading("C.", "Methodology")
body(
    "Requirement analysis defined functional needs (chat, flashcards, quizzes, summaries, "
    "notes, analytics) and non-functional needs (performance, scalability, usability)."
)
body(
    "System design included API contract definition, database schema design, React component "
    "architecture, and feature selection for the AI integration layer."
)
body(
    "Implementation used Python with FastAPI for the backend and JavaScript with React.js "
    "for the frontend. Data preprocessing and validation were performed using Pydantic. "
    "CORS was configured to allow secure cross-origin communication between the frontend "
    "on port 3000 and the backend on port 8000."
)
body(
    "Testing included unit testing of all API endpoints, integration testing of AI response "
    "flows, and UI testing of all frontend components. Evaluation focused on response "
    "accuracy, performance under load, and overall usability."
)
sub_heading("D.", "Workflow of the System")
body(
    "Network packets are captured when the student submits a query or study content via the "
    "React.js frontend interface. The request is transmitted to the FastAPI backend through "
    "a REST API call."
)
body(
    "The backend processes the request, constructs the appropriate prompt, and calls the "
    "Google Gemini API to generate the AI response. The result is stored in the SQLite "
    "database and returned to the frontend."
)
body(
    "The frontend displays the AI-generated content — chat response, flashcards, quiz "
    "questions, summary, or highlighted notes — within the appropriate UI component in "
    "real-time. All interactions are logged for analytics and progress tracking."
)
sub_heading("E.", "Validation and Evaluation")
body(
    "Functional validation ensured all modules (AI chat, flashcard generation, quiz "
    "creation, summarization, notes highlighting, and analytics) operated correctly as "
    "per defined requirements."
)
body(
    "Usability testing verified clear dashboards and easy navigation across all features. "
    "Security validation confirmed safe API handling and protection of stored data. "
    "Performance evaluation analyzed AI response time and real-time processing capability. "
    "System logs were maintained for monitoring and future improvements."
)

print("Part 4 done")
