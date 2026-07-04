# ch04_design.py
import sys
sys.path.insert(0, r'C:\ai-agent')
from ql_helpers import *
from ql_helpers import _p, _r, _sup

def write_ch4(doc):
    chapter_heading(doc, "4", "System Design")

    body(doc,
        "The QuickLearner AI system is designed using a modular, layered architecture "
        "that separates the presentation layer, application logic layer, AI integration "
        "layer, and data persistence layer. This design ensures that each layer can be "
        "developed, tested, and maintained independently while communicating through "
        "well-defined interfaces. The design diagrams presented in this chapter use "
        "standard UML notation and include Block Diagram, Data Flow Diagrams (Level 0, "
        "1, and 2), Use Case Diagram, Activity Diagram, Sequence Diagram, and "
        "ER Diagram.")

    section(doc, "4.1", "Block Diagram")
    body(doc,
        "The block diagram illustrates the high-level components of the QuickLearner AI "
        "system and the data flow between them. The system is composed of four major "
        "blocks: the React.js Frontend, the FastAPI Backend, the Google Gemini AI "
        "Service, and the SQLite Database.")

    ascii_diagram(doc, [
        "  +------------------+         HTTP/REST          +--------------------+",
        "  |   REACT.JS       |  <---------------------->  |   FASTAPI BACKEND  |",
        "  |   FRONTEND       |                            |   (Python 3.10+)   |",
        "  |                  |                            |                    |",
        "  |  - Dashboard     |                            |  - /api/chat       |",
        "  |  - Chat UI       |                            |  - /api/quiz       |",
        "  |  - Quiz UI       |                            |  - /api/flashcards |",
        "  |  - Flashcards    |                            |  - /api/summarize  |",
        "  |  - Summariser    |                            |  - /api/notes      |",
        "  |  - Analytics     |                            |  - /api/analytics  |",
        "  |  - Goals/Streak  |                            |  - /api/goals      |",
        "  +------------------+                            +--------------------+",
        "                                                          |        |",
        "                                              Gemini SDK  |        | SQLAlchemy",
        "                                                          v        v",
        "                                          +-------------+  +-------------+",
        "                                          | GOOGLE      |  | SQLITE DB   |",
        "                                          | GEMINI API  |  |             |",
        "                                          | (LLM)       |  | - sessions  |",
        "                                          +-------------+  | - messages  |",
        "                                                           | - quizzes   |",
        "                                                           | - flashcards|",
        "                                                           | - notes     |",
        "                                                           | - analytics |",
        "                                                           +-------------+",
    ], caption=("4.1", "Block Diagram for QuickLearner AI"))

    section(doc, "4.2", "Data Flow Diagrams")
    subsection(doc, "4.2.1", "Level 0 DFD (Context Diagram)")
    body(doc,
        "The Level 0 DFD shows the system as a single process interacting with the "
        "external entities: the Student (user) and the Google Gemini API service. "
        "The student provides study content and queries, and receives AI-generated "
        "study material and analytics in return.")

    ascii_diagram(doc, [
        "                    Study Content / Queries",
        "   +----------+  ---------------------------------->  +------------------+",
        "   |          |                                       |                  |",
        "   | STUDENT  |       QuickLearner AI System         |  QUICKLEARNER AI |",
        "   |  (User)  |  <----------------------------------  |    SYSTEM        |",
        "   +----------+   AI Responses / Analytics / Reports  +------------------+",
        "                                                              |",
        "                                   AI Prompts                |",
        "                          +-------------------------------+   |",
        "                          | GOOGLE GEMINI API (External) | <-+",
        "                          +-------------------------------+",
        "                                   AI Responses",
    ], caption=("4.2", "Level 0 Data Flow Diagram (Context Diagram)"))

    subsection(doc, "4.2.2", "Level 1 DFD")
    body(doc,
        "The Level 1 DFD decomposes the system into its main functional processes: "
        "User Interaction Management, AI Feature Processing, Data Storage, and "
        "Analytics Generation.")

    ascii_diagram(doc, [
        " Student                                                   Gemini API",
        "    |                                                           |",
        "    | Input Text / Query           Prompt                      |",
        "    v                                                           |",
        " [1.0 User Input         ] ----> [2.0 AI Feature Engine ] <----+",
        "   Management              Query   (Chat/Quiz/Flash/Summ)  AI Response",
        "    |                               |           |",
        "    |                       Store   |           | Analytics Data",
        "    |                               v           v",
        "    |                       [3.0 Database  ] [4.0 Analytics]",
        "    |                        Storage Layer     Engine",
        "    |                               |           |",
        "    +<-----------Results / UI data--+-----------+",
        "                Response to Student",
    ], caption=("4.3", "Level 1 Data Flow Diagram"))

    subsection(doc, "4.2.3", "Level 2 DFD – AI Feature Module")
    body(doc,
        "The Level 2 DFD expands Process 2.0 (AI Feature Engine) into its individual "
        "sub-processes corresponding to each AI-powered feature.")

    ascii_diagram(doc, [
        "  Input Text / Query",
        "         |",
        "         +--------> [2.1 Chat Handler]      --> Gemini Chat API --> Chat Response",
        "         |",
        "         +--------> [2.2 Quiz Generator]    --> Gemini Gen API  --> MCQ Questions",
        "         |",
        "         +--------> [2.3 Flashcard Engine]  --> Gemini Gen API  --> Q&A Pairs",
        "         |",
        "         +--------> [2.4 Summariser]         --> Gemini Gen API --> Summary Text",
        "         |",
        "         +--------> [2.5 Notes Highlighter] --> Gemini Gen API  --> Key Concepts",
        "         |",
        "         +--------> [2.6 Analytics Engine]  --> DB Queries      --> Charts/Metrics",
    ], caption=("4.4", "Level 2 Data Flow Diagram – AI Feature Module"))

    section(doc, "4.3", "UML Diagrams")
    subsection(doc, "4.3.1", "Use Case Diagram")
    body(doc,
        "The Use Case Diagram identifies the actors and use cases of the QuickLearner AI "
        "system. The primary actor is the Student. The secondary actor is the Gemini AI "
        "Service. The system use cases include: Start AI Chat, Generate Quiz, Create "
        "Flashcards, Summarise Text, Highlight Notes, View Analytics, Set Daily Goal, "
        "Check Streak, and View Dashboard.")

    ascii_diagram(doc, [
        "  +-------------------------------------------------------------+",
        "  |                  QuickLearner AI System                     |",
        "  |                                                             |",
        "  |   (Use Chat Assistant)     (Generate Quiz)                  |",
        "  |   (Create Flashcards)      (Summarise Text)                 |",
        "  |   (Highlight Notes)        (View Analytics)                 |",
        "  |   (Set Daily Goal)         (Check Streak)                   |",
        "  |   (View Dashboard)         (Track Progress)                 |",
        "  |                                                             |",
        "  +-------------------------------------------------------------+",
        "       Student (Actor) ---<<uses>>--- All above use cases",
        "       Gemini API      ---<<uses>>--- Chat, Quiz, Flash, Summ, Notes",
    ], caption=("4.5", "UML Use Case Diagram"))

    subsection(doc, "4.3.2", "Activity Diagram")
    body(doc,
        "The Activity Diagram below describes the flow of a typical student interaction "
        "with the Quiz Generator feature — from text input through AI processing to "
        "quiz presentation and score recording.")

    ascii_diagram(doc, [
        "  [START]",
        "     |",
        "     v",
        "  Student opens Quiz Generator",
        "     |",
        "     v",
        "  Student enters study text",
        "     |",
        "     v",
        "  Student clicks Generate Quiz",
        "     |",
        "     v",
        "  System sends prompt to Gemini API",
        "     |",
        "     v",
        "  [Gemini returns MCQ questions?] ---NO---> Display error, retry",
        "     |YES",
        "     v",
        "  Display quiz questions to student",
        "     |",
        "     v",
        "  Student answers questions",
        "     |",
        "     v",
        "  System calculates score",
        "     |",
        "     v",
        "  Store quiz result in database",
        "     |",
        "     v",
        "  Update Analytics dashboard",
        "     |",
        "     v",
        "  [END]",
    ], caption=("4.6", "UML Activity Diagram – Quiz Generator Flow"))

    subsection(doc, "4.3.3", "Sequence Diagram")
    body(doc,
        "The Sequence Diagram illustrates the interaction between the Student, "
        "React.js Frontend, FastAPI Backend, Gemini API, and SQLite Database during "
        "a quiz generation request.")

    ascii_diagram(doc, [
        "  Student    Frontend      Backend        Gemini API     Database",
        "    |           |             |               |              |",
        "    |--Submit--->|             |               |              |",
        "    |  text      |--POST /quiz->|               |              |",
        "    |            |             |--build prompt->|              |",
        "    |            |             |<--MCQ JSON ----|              |",
        "    |            |             |--INSERT quiz------------------>|",
        "    |            |             |<--quiz_id---------------------|",
        "    |            |<-200 + JSON-|               |              |",
        "    |<--show quiz-|             |               |              |",
        "    |            |             |               |              |",
        "    |--submit ans->|            |               |              |",
        "    |            |--POST score->|               |              |",
        "    |            |             |--UPDATE score--------------->|",
        "    |            |<-score resp-|               |              |",
        "    |<--show score|             |               |              |",
    ], caption=("4.7", "UML Sequence Diagram – Quiz Generation Flow"))

    section(doc, "4.4", "ER Diagram")
    body(doc,
        "The Entity-Relationship Diagram models the database schema of QuickLearner AI. "
        "The primary entities are: User, ChatSession, Message, Quiz, FlashcardSet, "
        "Flashcard, Summary, Note, Goal, and Analytics.")

    ascii_diagram(doc, [
        "  +----------+       +-------------+      +----------+",
        "  |  USER    |------>| CHAT_SESSION|----->| MESSAGE  |",
        "  | user_id  | 1:N   | session_id  | 1:N  | msg_id   |",
        "  | username |       | created_at  |      | role     |",
        "  | created  |       | title       |      | content  |",
        "  +----------+       +-------------+      +----------+",
        "       |",
        "       | 1:N",
        "  +----------+     +-------------+     +--------------+",
        "  |  QUIZ    |     | FLASHCARD   |     |   SUMMARY    |",
        "  | quiz_id  |     | SET         |     | summary_id   |",
        "  | score    |     | set_id      |     | input_text   |",
        "  | questions|     | flashcards  |     | summary_text |",
        "  | created  |     | created_at  |     | created_at   |",
        "  +----------+     +-------------+     +--------------+",
        "       |",
        "       | 1:N",
        "  +----------+     +----------+     +---------------+",
        "  |  GOAL    |     | ANALYTICS|     |     NOTE      |",
        "  | goal_id  |     | event_id |     | note_id       |",
        "  | title    |     | feature  |     | original_text |",
        "  | target   |     | count    |     | highlights    |",
        "  | streak   |     | date     |     | created_at    |",
        "  +----------+     +----------+     +---------------+",
    ], caption=("4.8", "Entity-Relationship (ER) Diagram"))

    section(doc, "4.5", "System Architecture Diagram")
    body(doc,
        "The system architecture of QuickLearner AI follows a three-tier client-server "
        "model with an additional AI service tier. The frontend tier (React.js) "
        "communicates with the application tier (FastAPI) via REST APIs. The application "
        "tier processes requests, orchestrates AI calls, and manages database transactions.")

    ascii_diagram(doc, [
        "  +-----------------------------------------------------------------+",
        "  |  TIER 1: PRESENTATION LAYER                                     |",
        "  |  React.js + Tailwind CSS + Framer Motion                        |",
        "  |  Components: Chat, Quiz, Flashcards, Summariser, Notes,         |",
        "  |              Analytics, Goals, Streak, Dashboard, Progress      |",
        "  +-----------------------------------------------------------------+",
        "                          | REST API (HTTP/JSON)",
        "                          v",
        "  +-----------------------------------------------------------------+",
        "  |  TIER 2: APPLICATION LAYER                                      |",
        "  |  FastAPI + Python 3.10 + Pydantic + Uvicorn                     |",
        "  |  Routers: /api/chat  /api/quiz  /api/flashcards                 |",
        "  |           /api/summarize  /api/notes  /api/analytics            |",
        "  |           /api/goals  /api/streak  /health                      |",
        "  +-----------------------------------------------------------------+",
        "            |  Gemini SDK              |  SQLAlchemy ORM",
        "            v                          v",
        "  +-------------------+    +---------------------------+",
        "  |  TIER 3a: AI SVC  |    |  TIER 3b: DATA LAYER      |",
        "  |  Google Gemini    |    |  SQLite Database          |",
        "  |  gemini-pro-latest|    |  7 tables, persistent     |",
        "  +-------------------+    +---------------------------+",
    ], caption=("4.9", "System Architecture Diagram"))

