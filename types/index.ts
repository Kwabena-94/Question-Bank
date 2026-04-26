// ── Exam tracks ──────────────────────────────────────────────────────────────

export type ExamTrack = "mccqe1" | "nac_osce" | "nclex_rn" | "pebc";

export type McqDomain =
  | "health_promotion"
  | "assessment_diagnosis"
  | "acute_care"
  | "chronic_care"
  | "management"
  | "communication"
  | "psychosocial"
  | "professional_behaviours";

export type CanmedsRole =
  | "medical_expert"
  | "communicator"
  | "collaborator"
  | "leader"
  | "health_advocate"
  | "scholar"
  | "professional";

// ── User / Auth ───────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  exam_pathway: ExamTrack | null;
  teachable_user_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Questions ─────────────────────────────────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard";

export interface QuestionOption {
  key: "a" | "b" | "c" | "d" | "e";
  text: string;
}

export type ClinicalSpecialty =
  | "medicine"
  | "obgyn"
  | "peds"
  | "pop_health"
  | "psych"
  | "surgery";

export const CLINICAL_SPECIALTY_LABELS: Record<ClinicalSpecialty, string> = {
  medicine: "Medicine",
  obgyn: "Obstetrics & Gynecology",
  peds: "Pediatrics",
  pop_health: "Population Health",
  psych: "Psychiatry",
  surgery: "Surgery",
};

export interface Question {
  id: string;
  content: string;
  options: QuestionOption[];
  correct_option: "a" | "b" | "c" | "d" | "e";
  explanation: string;
  topic_id: string | null;
  domain: McqDomain | null;
  subdomain: string | null;
  clinical_specialty: ClinicalSpecialty | null;
  difficulty: Difficulty | null;
  canmeds_role: CanmedsRole | null;
  source_reference: string | null;
  image_urls: string[] | null;
  is_published: boolean;
  created_at: string;
}

// ── Question Bank session ────────────────────────────────────────────────────

export type SessionLength = 5 | 10 | 20 | 40;

export interface QBSessionFilters {
  specialties: ClinicalSpecialty[];
  difficulties: Difficulty[];
  unseenOnly: boolean;
  incorrectOnly: boolean;
}

export interface QBSession {
  id: string;
  questionIds: string[];
  filters: QBSessionFilters;
  length: SessionLength;
  createdAt: string;
}

export interface QuestionAttempt {
  id: string;
  user_id: string;
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  time_spent_seconds: number | null;
  session_id: string | null;
  source: "question_bank" | "mock" | "recommendation";
  created_at: string;
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

export type MockType = "diagnostic" | "timed";
export type MockStatus = "in_progress" | "submitted" | "abandoned";

export interface MockTemplate {
  id: string;
  title: string;
  type: MockType;
  duration_minutes: number;
  question_count: number;
  domain_distribution: Partial<Record<McqDomain, number>>;
  is_published: boolean;
}

export interface MockAttempt {
  id: string;
  user_id: string;
  mock_template_id: string;
  status: MockStatus;
  started_at: string;
  submitted_at: string | null;
  time_spent_seconds: number | null;
  score: number | null;
  domain_scores: Partial<Record<McqDomain, number>> | null;
}

// ── Flashcards ────────────────────────────────────────────────────────────────

export type CardType =
  | "definition"
  | "clinical"
  | "investigation"
  | "management"
  | "complications"
  | "differentials"
  | "referral";

export type CardFormat = "basic" | "cloze" | "mcq";

export interface FlashcardMcqOption {
  label: string;
  text: string;
  correct: boolean;
}

export interface Flashcard {
  front: string;
  back: string;
  type: CardType;
  reasoning: string;
  context?: string | null;
  format?: CardFormat;
  mcq_options?: FlashcardMcqOption[] | null;
}

// SRS grade buttons (1=Again, 2=Hard, 3=Good, 4=Easy)
export type Grade = 1 | 2 | 3 | 4;

export interface FlashcardSet {
  id: string;
  user_id: string;
  topic: string;
  input_mode: "describe" | "paste";
  generation_mode: "manual" | "adaptive";
  weak_topic_tags: string[] | null;
  cards: Flashcard[];
  model_version: string | null;
  generated_at: string;
  cache_hit: boolean;
}

// ── Recommendations ───────────────────────────────────────────────────────────

export type RecommendationType = "question_set" | "flashcard" | "mock" | "topic_review";
export type RecommendationStatus = "pending" | "viewed" | "clicked" | "completed" | "dismissed";

export interface Recommendation {
  id: string;
  user_id: string;
  type: RecommendationType;
  title: string;
  description: string | null;
  topic_tags: string[] | null;
  source: "weak_area" | "recency" | "mock_result";
  status: RecommendationStatus;
  created_at: string;
}

// ── Readiness ─────────────────────────────────────────────────────────────────

export type ConfidenceTier = "early" | "developing" | "reliable";

export interface ReadinessScore {
  id: string;
  user_id: string;
  score: number;
  confidence_tier: ConfidenceTier;
  domain_scores: Partial<Record<McqDomain, number>>;
  narrative_improving: string | null;
  narrative_at_risk: string | null;
  top_actions: Array<{ action: string; reason: string }>;
  questions_answered: number;
  domains_covered: number;
  mocks_completed: number;
  computed_at: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface HomeSummary {
  streak_days: number;
  question_accuracy: number;
  mocks_completed: number;
  flashcard_sets_completed: number;
  readiness: ReadinessScore | null;
  recommendations: Recommendation[];
  recent_activity: RecentActivity[];
}

export interface RecentActivity {
  type: "question_session" | "mock" | "flashcard_set";
  label: string;
  timestamp: string;
  result?: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export type AnalyticsEventName =
  | "app_opened"
  | "module_opened"
  | "question_answered"
  | "mock_started"
  | "mock_submitted"
  | "flashcards_generated"
  | "flashcard_flipped"
  | "flashcards_review_started"
  | "flashcards_review_completed"
  | "flashcard_reviewed"
  | "flashcard_grader_used"
  | "recommendation_viewed"
  | "recommendation_clicked"
  | "recommendation_completed"
  | "readiness_viewed";

export interface AnalyticsEventPayload {
  user_id?: string;
  module?: string;
  topic?: string;
  domain?: string;
  source?: "manual" | "recommendation";
  session_id?: string;
  [key: string]: unknown;
}

// ── Admin / Ingestion ─────────────────────────────────────────────────────────

export type IngestionJobStatus = "pending" | "processing" | "completed" | "failed";
export type ReviewStatus = "pending" | "approved" | "rejected" | "edited";

export interface IngestionJob {
  id: string;
  status: IngestionJobStatus;
  source_files: Array<{ name: string; storage_path: string; size: number }>;
  questions_generated: number;
  questions_approved: number;
  questions_rejected: number;
  model_version: string | null;
  created_by: string;
  created_at: string;
  completed_at: string | null;
}

export interface ReviewQueueItem {
  id: string;
  job_id: string;
  draft_question: Omit<Question, "id" | "is_published" | "created_at">;
  auto_tags: {
    domain?: McqDomain;
    subdomain?: string;
    difficulty?: Difficulty;
    canmeds_role?: CanmedsRole;
  };
  source_reference: string | null;
  status: ReviewStatus;
  reject_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_question_id: string | null;
  created_at: string;
}
