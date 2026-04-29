from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime

# === Chat Models ===
class ChatMessageCreate(BaseModel):
    """Schema for creating a chat message"""
    content: str = Field(..., min_length=1, max_length=5000)
    sender: Literal["user", "ai"]

class ChatMessageResponse(BaseModel):
    """Schema for chat message response"""
    id: int
    content: str
    sender: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    """Schema for chat request"""
    message: str = Field(..., min_length=1, max_length=5000)
    session_id: Optional[int] = None

class ChatResponse(BaseModel):
    """Schema for chat response"""
    message: str
    session_id: int
    timestamp: datetime

# === Summary Models ===
class SummaryRequest(BaseModel):
    """Schema for summary generation request"""
    text: str = Field(..., min_length=10, max_length=50000)
    title: Optional[str] = None

class SummaryResponse(BaseModel):
    """Schema for summary response"""
    id: int
    summary: str
    original_length: int
    summary_length: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# === Notes Highlighting Models ===
class NotesHighlightRequest(BaseModel):
    """Schema for notes highlighting request"""
    text: str = Field(..., min_length=10, max_length=50000)

class Highlight(BaseModel):
    """Schema for a single highlight"""
    text: str
    importance: Literal["high", "medium", "low"]
    category: Optional[str] = None

class NotesHighlightResponse(BaseModel):
    """Schema for notes highlighting response"""
    highlights: List[Highlight]
    key_concepts: List[str]
    summary: str

# === Quiz Models ===
class QuizQuestion(BaseModel):
    """Schema for a quiz question"""
    question: str
    options: List[str]
    correct_answer: int  # Index of correct option
    explanation: Optional[str] = None

class QuizRequest(BaseModel):
    """Schema for quiz generation request"""
    topic: str = Field(..., min_length=1, max_length=200)
    text: Optional[str] = None  # Optional context text
    num_questions: int = Field(default=5, ge=1, le=20)
    difficulty: Literal["easy", "medium", "hard"] = "medium"

class QuizResponse(BaseModel):
    """Schema for quiz response"""
    id: int
    title: str
    questions: List[QuizQuestion]
    created_at: datetime
    
    class Config:
        from_attributes = True

class QuizSubmission(BaseModel):
    """Schema for quiz submission"""
    quiz_id: int
    answers: List[int]  # User's answers (indices)

class QuizResult(BaseModel):
    """Schema for quiz results"""
    score: int
    total: int
    percentage: float
    correct_answers: List[int]
    explanations: List[str]

# === Flashcard Models ===
class FlashcardCreate(BaseModel):
    """Schema for creating a flashcard"""
    front: str = Field(..., min_length=1, max_length=1000)
    back: str = Field(..., min_length=1, max_length=2000)
    deck_name: str = Field(default="Default", max_length=100)

class FlashcardResponse(BaseModel):
    """Schema for flashcard response"""
    id: int
    front: str
    back: str
    deck_name: str
    created_at: datetime
    ease_factor: float
    interval: int
    
    class Config:
        from_attributes = True

class FlashcardGenerateRequest(BaseModel):
    """Schema for automatic flashcard generation"""
    text: str = Field(..., min_length=10, max_length=50000)
    num_cards: int = Field(default=10, ge=1, le=50)
    deck_name: str = Field(default="Generated", max_length=100)

class FlashcardReview(BaseModel):
    """Schema for flashcard review (spaced repetition)"""
    flashcard_id: int
    quality: int = Field(..., ge=0, le=5)  # 0-5 rating

# === Analytics Models ===
class AnalyticsResponse(BaseModel):
    """Schema for analytics response"""
    total_study_time: int  # in minutes
    questions_answered: int
    quizzes_completed: int
    flashcards_reviewed: int
    summaries_generated: int
    weekly_progress: List[dict]
    productivity_score: int
    streak_days: int

class StudySessionCreate(BaseModel):
    """Schema for logging a study session"""
    duration_minutes: int = Field(..., ge=1, le=1440)
    activity_type: Literal["reading", "quiz", "flashcards", "notes"]

# === User Models ===
class UserCreate(BaseModel):
    """Schema for user registration"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)

class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str

class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    username: str
    email: str
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    """Schema for authentication token"""
    access_token: str
    token_type: str = "bearer"


# === Extended Authentication Models ===
class UserRegister(BaseModel):
    """Schema for user registration"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    role: Optional[str] = Field(default="user", pattern="^(user|client)$")


class UserLoginRequest(BaseModel):
    """Schema for user login request"""
    email: EmailStr
    password: str = Field(..., min_length=1)
    remember_me: bool = False


class TokenResponse(BaseModel):
    """Schema for token response with user info"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserProfileResponse"


class RefreshTokenRequest(BaseModel):
    """Schema for refreshing access token"""
    refresh_token: str


class UserProfileResponse(BaseModel):
    """Schema for user profile response"""
    id: int
    username: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    profile_picture: Optional[str]
    role: str
    auth_provider: str
    created_at: datetime
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime]
    subscription_tier: str = "free"
    billing_cycle: Optional[str] = None
    subscription_status: str = "free"
    subscription_provider: Optional[str] = None
    subscription_started_at: Optional[datetime] = None
    subscription_ends_at: Optional[datetime] = None
    subscription_canceled_at: Optional[datetime] = None
    is_premium: bool = False
    
    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile"""
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    username: Optional[str] = Field(None, min_length=3, max_length=50)


class ChangePasswordRequest(BaseModel):
    """Schema for password change"""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for password reset"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)


class VerifyEmailRequest(BaseModel):
    """Schema for email verification"""
    token: str


class BillingPlanResponse(BaseModel):
    """Schema for premium billing plan metadata"""
    plan_code: str
    billing_cycle: Optional[str]
    name: str
    description: str
    price_cents: int
    price_display: str
    currency: str
    interval: Optional[str]
    features: List[str]
    recommended: bool = False
    annualized_price_cents: Optional[int] = None
    monthly_equivalent_cents: Optional[int] = None
    savings_percent: Optional[int] = None
    badge_text: Optional[str] = None


class BillingPlansResponse(BaseModel):
    """Schema for the available billing plans list"""
    plans: List[BillingPlanResponse]


class SubscriptionUpdateRequest(BaseModel):
    """Schema for selecting or changing a subscription"""
    billing_cycle: Literal["monthly", "yearly"]


class StripeCheckoutRequest(BaseModel):
    """Schema for creating a Stripe checkout session"""
    billing_cycle: Optional[Literal["monthly", "yearly"]] = None
    plan: Optional[Literal["pro_monthly", "pro_yearly"]] = None
    provider: Optional[Literal["stripe", "razorpay"]] = None
    plan_code: Optional[Literal["pro_monthly", "pro_yearly"]] = None
    country: Optional[str] = None
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class StripeCheckoutResponse(BaseModel):
    """Schema for Stripe checkout session response"""
    provider: str = "stripe"
    session_id: Optional[str] = None
    checkout_url: Optional[str] = None
    url: Optional[str] = None
    redirect_url: Optional[str] = None
    order_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    amount: Optional[int] = None
    currency: Optional[str] = None
    key: Optional[str] = None
    billing_cycle: Optional[str] = None
    plan_code: Optional[str] = None


class StripeWebhookResponse(BaseModel):
    """Schema for Stripe webhook acknowledgement"""
    received: bool = True
    provider: Optional[str] = None
    event: Optional[str] = None


class SubscriptionStatusResponse(BaseModel):
    """Schema for a user's subscription status"""
    user: UserProfileResponse
    is_premium: bool
    subscription_tier: str
    billing_cycle: Optional[str]
    status: str
    started_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    canceled_at: Optional[datetime] = None
    provider: Optional[str] = None
    plan: BillingPlanResponse
    quota: Optional[dict] = None
    usage: Optional[Dict[str, Any]] = None
    usage_by_feature: Optional[List[Dict[str, Any]]] = None
    next_billing_date: Optional[datetime] = None
    cancel_at_period_end: Optional[bool] = None
    active_until: Optional[datetime] = None


class QuotaStatusResponse(BaseModel):
    """Schema for a free-tier premium usage quota"""
    usage_scope: str
    usage_date: str
    daily_limit: int
    used_count: int
    remaining_count: int
    is_exhausted: bool
    is_premium: bool = False
    unlimited: bool = False


class RazorpayVerifyRequest(BaseModel):
    """Schema for Razorpay payment verification."""
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_code: Optional[Literal["pro_monthly", "pro_yearly"]] = None
    plan: Optional[Literal["pro_monthly", "pro_yearly"]] = None


class BillingPortalRequest(BaseModel):
    """Schema for billing customer portal session request."""
    return_url: Optional[str] = None


class BillingPortalResponse(BaseModel):
    """Schema for billing customer portal response."""
    provider: str
    portal_url: str
    url: Optional[str] = None


class BillingHistoryItem(BaseModel):
    """Single billing history row."""
    id: int
    provider: str
    amount: int
    amount_cents: int
    currency: str
    status: str
    external_invoice_id: Optional[str] = None
    external_payment_id: Optional[str] = None
    invoice_url: Optional[str] = None
    created_at: datetime


class BillingHistoryResponse(BaseModel):
    """Billing history response for profile views."""
    items: List[BillingHistoryItem]


class UsageSummaryResponse(BaseModel):
    """Detailed usage response for dashboard widgets."""
    date: str
    month: str
    daily: Dict[str, int]
    monthly: Dict[str, int]


class GenericBillingActionResponse(BaseModel):
    """Generic action response for cancel/resume/sync endpoints."""
    success: bool = True
    message: str
    subscription: Optional[SubscriptionStatusResponse] = None


class GoogleAuthRequest(BaseModel):
    """Schema for Google OAuth login"""
    credential: str  # Google ID token


class GoogleAuthResponse(BaseModel):
    """Schema for Google OAuth response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfileResponse
    is_new_user: bool


class OAuthAccountResponse(BaseModel):
    """Schema for OAuth account info"""
    provider: str
    provider_email: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AuthStatusResponse(BaseModel):
    """Schema for auth status check"""
    is_authenticated: bool
    user: Optional[UserProfileResponse] = None


# === Advanced Highlighting Models ===
class AdvancedHighlightRequest(BaseModel):
    """Schema for advanced highlighting request"""
    text: str = Field(..., min_length=10, max_length=50000)
    categories: Optional[List[str]] = None  # concepts, examples, definitions, formulas, questions, important, steps
    with_summary: bool = True
    max_highlights: int = Field(default=25, ge=1, le=100)
    min_confidence: float = Field(default=0.4, ge=0.0, le=1.0)

class AdvancedHighlightItem(BaseModel):
    """Schema for a single highlighted item"""
    text: str
    category: str
    importance: Literal["high", "medium", "low"]
    confidence: float = Field(..., ge=0.0, le=1.0)
    start_pos: int = Field(default=0, ge=0)
    end_pos: int = Field(default=0, ge=0)
    word_count: int = Field(default=0, ge=0)
    color: Optional[str] = None
    icon: Optional[str] = None
    matched_keywords: Optional[List[str]] = None
    matched_patterns: Optional[List[str]] = None

class HighlightStatistics(BaseModel):
    """Statistics for highlights"""
    total_words: int = 0
    highlighted_words: int = 0
    coverage_percent: float = 0.0
    avg_confidence: float = 0.0
    category_distribution: dict = {}
    importance_distribution: dict = {"high": 0, "medium": 0, "low": 0}

class AdvancedHighlightResponse(BaseModel):
    """Schema for advanced highlighting response"""
    highlights: List[AdvancedHighlightItem]
    key_concepts: List[str]
    related_concepts: List[dict]
    summary: Optional[str] = None
    readability_score: int = 0
    readability_level: str = "medium"
    avg_sentence_length: float = 0.0
    total_highlights: int = 0
    by_category: dict = {}
    statistics: Optional[HighlightStatistics] = None
    category_colors: Optional[dict] = None
    error: Optional[str] = None

# === Advanced Summarizer Models ===
class AdvancedSummaryRequest(BaseModel):
    """Schema for advanced summary request"""
    text: str = Field(..., min_length=10, max_length=50000)
    style: Literal["extractive", "abstractive", "bullet_points", "outline", "cornell", "eli5", "academic", "key_takeaways"] = "abstractive"
    length: Literal["brief", "short", "medium", "long", "detailed"] = "medium"
    with_keywords: bool = True
    with_outline: bool = False
    with_takeaways: bool = True
    preserve_citations: bool = False
    target_audience: Literal["general", "academic", "technical", "beginner"] = "general"

class KeywordItem(BaseModel):
    """Schema for a keyword with metadata"""
    word: str
    score: float
    frequency: int
    importance: Literal["high", "medium", "low"]

class TakeawayItem(BaseModel):
    """Schema for a key takeaway"""
    rank: int
    text: str
    importance_score: float
    word_count: int

class OutlineSection(BaseModel):
    """Schema for an outline section"""
    section: int
    title: str
    key_points: List[str]
    word_count: Optional[int] = None

class ReadabilityMetrics(BaseModel):
    """Schema for readability analysis"""
    flesch_score: float
    grade_level: str
    reading_time_minutes: float
    avg_words_per_sentence: float
    avg_syllables_per_word: float
    complex_word_percentage: float
    difficulty: str
    total_words: Optional[int] = None
    total_sentences: Optional[int] = None

class QualityMetrics(BaseModel):
    """Schema for summary quality metrics"""
    keyword_coverage: float
    content_retention: float
    length_appropriateness: float
    overall_score: float

class SentenceCount(BaseModel):
    """Schema for sentence counts"""
    original: int
    summary: int

class AdvancedSummaryResponse(BaseModel):
    """Schema for advanced summary response"""
    summary: str
    style: str
    length: str
    word_count: int
    original_word_count: int
    compression_ratio: float
    reduction_percent: float = 0.0
    keywords: List[KeywordItem] = []
    topics: List[str] = []
    takeaways: List[TakeawayItem] = []
    outline: Optional[List[OutlineSection]] = None
    citations: Optional[List[dict]] = None
    readability: ReadabilityMetrics
    original_readability: Optional[ReadabilityMetrics] = None
    sentence_count: Optional[SentenceCount] = None
    quality_score: Optional[QualityMetrics] = None
    error: Optional[str] = None

# === Advanced Quiz Models ===
class QuizHint(BaseModel):
    """Progressive hint for a question"""
    level: int = Field(ge=1, le=3)
    text: str
    penalty_percent: int = Field(default=10, ge=0, le=50)

class QuizRubric(BaseModel):
    """Grading rubric for short answer questions"""
    excellent: str
    good: str
    partial: str
    incorrect: str

class AdvancedQuizQuestion(BaseModel):
    """Schema for an advanced quiz question with multiple types"""
    id: int
    question_id: str
    type: Literal["multiple_choice", "true_false", "short_answer", "fill_in_blank", "matching", "ordering", "code_completion"]
    question: str
    difficulty: Literal["beginner", "easy", "medium", "hard", "expert"]
    
    # Common fields
    options: Optional[Dict[str, str]] = None  # For MCQ, T/F, fill-in-blank
    correct_answer: Optional[str] = None
    hints: Optional[List[str]] = []
    explanation: Optional[str] = None
    time_estimate: int = 60
    points: int = 10
    concept: Optional[str] = None
    concepts: Optional[List[str]] = []
    confidence_weight: float = 1.0
    
    # Matching question fields
    column_a: Optional[List[str]] = None
    column_b: Optional[List[str]] = None
    correct_matches: Optional[Dict[str, int]] = None
    
    # Ordering question fields
    items: Optional[List[str]] = None
    original_items: Optional[List[str]] = None
    correct_order: Optional[List[int]] = None
    order_type: Optional[str] = None
    
    # Short answer fields
    model_answer: Optional[str] = None
    key_points: Optional[List[str]] = None
    rubric: Optional[QuizRubric] = None
    requires_manual_grading: bool = False
    
    # Code completion fields
    code_before: Optional[str] = None
    code_after: Optional[str] = None
    blank_description: Optional[str] = None
    language: Optional[str] = None
    
    # True/False specific
    statement: Optional[str] = None
    misconception: Optional[str] = None
    
    # Category/metadata
    category: Optional[str] = None
    hints_used: int = 0

class AdvancedQuizRequest(BaseModel):
    """Schema for advanced quiz generation request"""
    topic: str = Field(..., min_length=1, max_length=200)
    num_questions: int = Field(default=10, ge=1, le=50)
    difficulty: Literal["beginner", "easy", "medium", "hard", "expert"] = "medium"
    question_types: Optional[List[Literal["multiple_choice", "true_false", "short_answer", "fill_in_blank", "matching", "ordering", "code_completion"]]] = None
    with_hints: bool = True
    with_explanations: bool = True
    with_takeaways: bool = False
    adaptive_difficulty: bool = True
    bloom_level: Optional[Literal["remember", "understand", "apply", "analyze", "evaluate", "create"]] = None
    time_limit_minutes: Optional[int] = Field(default=None, ge=1, le=180)
    shuffle_questions: bool = True
    shuffle_options: bool = True

class DifficultyPoint(BaseModel):
    """Point on difficulty curve"""
    question_number: int
    difficulty: str
    difficulty_value: int
    progress: float
    question_type: str
    points: int

class ReviewRecommendation(BaseModel):
    """Study recommendation"""
    type: str
    title: str
    priority: str
    estimated_time: str

class KeyTakeaway(BaseModel):
    """Key learning takeaway"""
    id: int
    concept: str
    importance: str
    review_priority: int

class QuizMetadata(BaseModel):
    """Quiz generation metadata"""
    generated_at: str
    version: str
    adaptive: bool

class AdvancedQuizResponse(BaseModel):
    """Schema for advanced quiz response"""
    topic: str
    difficulty: str
    total_questions: int
    questions: List[AdvancedQuizQuestion]
    total_points: int
    passing_score: int
    estimated_time_minutes: int
    estimated_time_seconds: int
    time_limit_minutes: Optional[int] = None
    question_type_distribution: Dict[str, int]
    difficulty_distribution: Dict[str, int]
    difficulty_curve: List[DifficultyPoint]
    concepts_covered: List[str]
    subject_category: str
    bloom_level: str
    key_takeaways: List[KeyTakeaway]
    with_hints: bool
    with_explanations: bool
    review_recommendations: List[ReviewRecommendation]
    metadata: QuizMetadata
    error: Optional[str] = None

class QuizAnswerSubmission(BaseModel):
    """Schema for submitting an answer"""
    question_id: str
    user_answer: str
    time_taken_seconds: Optional[int] = None
    hints_used: int = 0

class QuizAnswerResult(BaseModel):
    """Schema for answer evaluation result"""
    is_correct: bool
    partial_credit: float
    points_earned: int
    max_points: int
    time_bonus: int
    feedback: str
    explanation: str
    correct_answer: str
    hints_available: int
    review_recommended: bool

class WeakArea(BaseModel):
    """Area needing improvement"""
    type: str
    accuracy: float
    recommendation: str

class QuizSummary(BaseModel):
    """Summary of completed quiz"""
    total_questions: int
    correct_answers: int
    accuracy_percentage: float
    total_points: int
    max_points: int
    score_percentage: float
    performance_by_type: Dict[str, Dict[str, int]]
    weak_areas: List[WeakArea]
    grade: str
    passed: bool
    recommendations: List[str]

# === Analytics Models (Advanced) ===
class AnalyticsSummary(BaseModel):
    """Summary statistics"""
    total_sessions: int
    total_summaries: int
    total_quizzes: int
    total_flashcards: int
    avg_score: float


class AnalyticsProgress(BaseModel):
    """Progress tracking"""
    current_level: int
    xp_earned: int
    next_level_xp: int
    completion_percentage: float
    topics_covered: int

class AnalyticsDashboardResponse(BaseModel):
    """Schema for analytics dashboard"""
    summary: AnalyticsSummary
    progress: AnalyticsProgress
    learning_curve: List[dict]
    strengths_weaknesses: dict
    recommendations: List[str]
    streak: dict
    time_analysis: dict

class AnalyticsPerformanceResponse(BaseModel):
    """Schema for performance analytics"""
    accuracy_percentage: float
    total_attempts: int
    correct_answers: int
    topic_performance: dict
    performance_trend: List[dict]

class AnalyticsTrendsResponse(BaseModel):
    """Schema for trend analytics"""
    weekly_activity: dict
    monthly_summary: dict
# === Generic Response Models ===
class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    success: bool = True

class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    detail: Optional[str] = None
    success: bool = False
