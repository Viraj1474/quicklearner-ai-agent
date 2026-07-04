# Part 3: Literature Review + Problem Statement

# ════════════════════════════════════════════════════════════════════════════
# II. LITERATURE REVIEW
# ════════════════════════════════════════════════════════════════════════════
sec_heading("II.", "LITERATURE REVIEW")
body(
    "The growing adoption of AI in education has spurred extensive research into intelligent "
    "tutoring systems, automated content generation, and personalized learning platforms. "
    "This section reviews existing research highlighting methodologies, contributions, and "
    "limitations relevant to this work."
)
sub_heading("A.", "The Problem: Limitations of Traditional Study Methods")
body(
    "Existing literature highlights that passive learning methods are significantly less "
    "effective than active, retrieval-based practices such as flashcards and self-testing [1]. "
    "Students often lack access to tools that generate personalized quizzes or summaries from "
    "their own notes, forcing reliance on generic textbooks and static resources. This gap is "
    "further widened by the absence of intelligent feedback mechanisms in traditional study "
    "environments, leading to reduced retention and poor academic performance."
)
sub_heading("B.", "Review of Extant Solutions: AI in Education and Chatbot Systems")
body(
    "Research into AI-driven tutoring systems has demonstrated the effectiveness of "
    "conversational agents in improving student engagement and comprehension [2]. Early "
    "chatbot-based tutoring tools used rule-based systems, which limited their ability to "
    "handle diverse or open-ended queries. The advent of transformer-based large language "
    "models such as GPT and Gemini has significantly advanced the capability of AI tutors "
    "to provide accurate, context-aware responses. However, most existing implementations "
    "remain standalone tools and do not integrate with a broader study workflow [3]."
)
sub_heading("C.", "The Identified Research Gap: Lack of Unified Learning Platforms")
body(
    "The literature reveals a significant gap in the integration of multiple AI-driven study "
    "tools into a single, cohesive platform. Most existing solutions address only one aspect "
    "of the study workflow, such as chat or flashcards or summaries, but very few combine "
    "all these features effectively. Additionally, existing platforms often lack real-time "
    "responsiveness, analytics dashboards, and user-friendly interfaces suitable for daily "
    "academic use. This highlights the need for a unified, efficient, and scalable AI study "
    "platform that can serve all student needs within a single application [4], [5]."
)
sub_heading("D.", "Automated Flashcard and Quiz Generation")
body(
    "Studies have shown that spaced repetition and active recall through flashcards "
    "significantly improve long-term retention [6]. Automated flashcard generation from "
    "text using NLP techniques has been explored in various tools; however, most existing "
    "solutions lack integration with a broader study platform and do not support dynamic "
    "quiz generation from user-provided content. The AI Study Assistant addresses this by "
    "using the Gemini API to generate both flashcards and quizzes from any text submitted "
    "by the student."
)
sub_heading("E.", "Text Summarization and Notes Highlighting Using LLMs")
body(
    "Automatic text summarization has been a well-researched NLP task, with modern approaches "
    "leveraging pre-trained transformer models to generate abstractive summaries [5]. The "
    "integration of LLMs like Gemini into study platforms enables high-quality, coherent "
    "summaries tailored to the student's specific material. Similarly, intelligent notes "
    "highlighting that identifies key concepts has practical value for students reviewing "
    "dense academic content. These capabilities are fully integrated into the AI Study "
    "Assistant platform."
)
sub_heading("F.", "Practical Constraints and System Usability")
body(
    "Beyond AI accuracy, practical deployment and usability play a crucial role in the "
    "adoption of educational technology. Many AI-powered tools are difficult to set up or "
    "require cloud subscriptions, making them inaccessible to students. The identified gap "
    "is the lack of solutions that balance technical sophistication with ease of use. The "
    "AI Study Assistant addresses this by providing a locally deployable, open-architecture "
    "platform with simple startup scripts and a responsive web interface accessible "
    "directly from the browser."
)
sub_heading("G.", "Limitations of Existing Study Platforms")
body(
    "The literature reveals a divide between high-capability AI services that are expensive "
    "or proprietary and basic open-source tools that lack comprehensive features. Existing "
    "platforms fail to provide both affordability and effectiveness simultaneously. The AI "
    "Study Assistant addresses this limitation by offering a cost-effective, modular, and "
    "integrated solution that combines multiple AI-driven study techniques within a single "
    "framework, making it suitable for everyday academic use."
)

# ════════════════════════════════════════════════════════════════════════════
# III. PROBLEM STATEMENT
# ════════════════════════════════════════════════════════════════════════════
sec_heading("III.", "PROBLEM STATEMENT")
body(
    "Ensuring effective and personalized learning for students has become a critical challenge "
    "in the digital age, creating a significant gap between the capabilities of modern AI "
    "technology and the study tools currently available to students. This issue is not only "
    "technical but also structural, arising from the fragmented and isolated nature of "
    "existing educational applications."
)
body(
    "Currently, the educational technology landscape consists of multiple isolated tools such "
    "as note-taking apps, flashcard generators, quiz platforms, and AI chatbots that operate "
    "independently. This fragmentation forces students to switch between multiple applications, "
    "creating a disjointed and inefficient study experience. The lack of integration leads to "
    "lost context, wasted time, and reduced learning effectiveness. As a result, there is an "
    "increased risk of incomplete study coverage and poor retention."
)
body(
    "The problem is further intensified by the absence of real-time AI responsiveness in many "
    "existing platforms, and the inability of most tools to generate personalized content from "
    "the student's own study material. Traditional tools rely on static, pre-built content "
    "that does not adapt to individual academic needs, limiting their practical value for "
    "exam preparation and self-directed learning."
)
body(
    "Therefore, there is a clear need for a unified, intelligent, and scalable study assistant "
    "that can accept student-provided content and automatically generate flashcards, quizzes, "
    "and summaries, while also providing an interactive AI chat interface and tracking learning "
    "progress — all within a single, responsive, and easy-to-use platform. The AI Study "
    "Assistant addresses this need by combining machine learning-based content generation "
    "with a full-stack web application, offering a comprehensive solution for modern "
    "student learning needs."
)

print("Part 3 done")
