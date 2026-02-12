/**
 * Survey Builder - TypeScript Types
 */

// --- Question Types ---

export type QuestionType =
  | 'text'
  | 'multiple_choice_single'
  | 'multiple_choice_multi'
  | 'rating_star'
  | 'rating_number'
  | 'section_header';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: 'Free text',
  multiple_choice_single: 'Multiple choice (single)',
  multiple_choice_multi: 'Multiple choice (multi)',
  rating_star: 'Star rating',
  rating_number: 'Number rating',
  section_header: 'Section header',
};

// --- Survey Status ---

export type SurveyStatus = 'draft' | 'active' | 'paused' | 'closed';

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: 'Draft',
  active: 'Enabled',
  paused: 'Disabled',
  closed: 'Closed',
};

export const SURVEY_STATUS_COLORS: Record<SurveyStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  closed: 'bg-red-100 text-red-700',
};

// --- Source Channel ---

export type SurveySourceChannel = 'direct' | 'qr' | 'email' | 'sms';

// --- Survey Question ---

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  position: number;
  question_type: QuestionType;
  question_text: string;
  description?: string | null;
  is_required: boolean;
  options: string[];
  allow_other: boolean;
  rating_min: number;
  rating_max: number;
  rating_labels: Record<string, string>;
  text_max_length: number;
  text_placeholder?: string | null;
  created_at: string;
  updated_at: string;
}

// --- Survey ---

export interface Survey {
  id: string;
  account_id: string;
  slug: string;
  title: string;
  description?: string | null;
  status: SurveyStatus;
  use_business_styling: boolean;
  thank_you_message: string;
  show_progress_bar: boolean;
  collect_respondent_info: boolean;
  require_respondent_email: boolean;
  collect_name: boolean;
  require_name: boolean;
  collect_email: boolean;
  require_email: boolean;
  collect_phone: boolean;
  require_phone: boolean;
  collect_business_name: boolean;
  require_business_name: boolean;
  one_response_per_email: boolean;
  free_responses_remaining: number;
  agency_account_id?: string | null;
  is_onboarding_survey: boolean;
  target_client_account_id?: string | null;
  template_id?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  questions?: SurveyQuestion[];
  response_count?: number;
}

// --- Survey Response Answer ---

export interface SurveyAnswer {
  question_id: string;
  question_type: QuestionType;
  answer: string | string[] | number;
}

// --- Survey Response ---

export interface SurveyResponse {
  id: string;
  survey_id: string;
  account_id: string;
  respondent_name?: string | null;
  respondent_email?: string | null;
  respondent_phone?: string | null;
  respondent_business_name?: string | null;
  answers: SurveyAnswer[];
  source_channel: SurveySourceChannel;
  utm_params: Record<string, string>;
  user_agent?: string | null;
  is_free_response: boolean;
  submitted_at: string;
  created_at: string;
}

// --- Survey Template ---

export interface SurveyTemplateQuestion {
  question_type: QuestionType;
  question_text: string;
  description?: string;
  is_required: boolean;
  options?: string[];
  allow_other?: boolean;
  rating_min?: number;
  rating_max?: number;
  rating_labels?: Record<string, string>;
  text_max_length?: number;
  text_placeholder?: string;
}

export interface SurveyTemplate {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  questions: SurveyTemplateQuestion[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// --- Response Pack ---

export interface SurveyResponsePack {
  id: string;
  name: string;
  response_count: number;
  credit_cost: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// --- Response Purchase ---

export interface SurveyResponsePurchase {
  id: string;
  survey_id: string;
  account_id: string;
  pack_id: string;
  responses_purchased: number;
  responses_used: number;
  credit_ledger_id?: string | null;
  idempotency_key?: string | null;
  created_at: string;
}

// --- API Request/Response Types ---

export interface CreateSurveyRequest {
  title: string;
  description?: string;
  questions: Omit<SurveyQuestion, 'id' | 'survey_id' | 'created_at' | 'updated_at'>[];
  use_business_styling?: boolean;
  thank_you_message?: string;
  show_progress_bar?: boolean;
  collect_respondent_info?: boolean;
  require_respondent_email?: boolean;
  collect_name?: boolean;
  require_name?: boolean;
  collect_email?: boolean;
  require_email?: boolean;
  collect_phone?: boolean;
  require_phone?: boolean;
  collect_business_name?: boolean;
  require_business_name?: boolean;
  one_response_per_email?: boolean;
}

export interface UpdateSurveyRequest extends Partial<CreateSurveyRequest> {
  status?: SurveyStatus;
}

export interface SurveyListResponse {
  surveys: Survey[];
  total: number;
}

export interface SurveySubmitRequest {
  survey_id: string;
  answers: SurveyAnswer[];
  respondent_name?: string;
  respondent_email?: string;
  respondent_phone?: string;
  respondent_business_name?: string;
  source_channel?: SurveySourceChannel;
  utm_params?: Record<string, string>;
}

export interface SurveyResponsesListResponse {
  responses: SurveyResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SurveyResponseSummary {
  totalResponses: number;
  questionSummaries: QuestionSummary[];
}

export interface QuestionSummary {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  // For rating questions
  averageRating?: number;
  ratingDistribution?: Record<number, number>;
  // For multiple choice questions
  choiceDistribution?: Record<string, number>;
  // For text questions
  responseCount?: number;
}

export interface ResponseQuota {
  free_remaining: number;
  purchased_remaining: number;
  total_remaining: number;
  total_used: number;
}

export interface PurchaseResponsesRequest {
  pack_id: string;
}
