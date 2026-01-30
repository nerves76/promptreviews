/**
 * Work Manager Types
 * Types for the agency task management feature
 */

// Status enum matching database
export type WMTaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

// Priority enum matching database
export type WMTaskPriority = 'low' | 'medium' | 'high';

// Source type for tracking where tasks originated
export type WMTaskSourceType = 'manual' | 'gbp_suggestion' | 'library' | 'client_task';

// Action type enum matching database
export type WMActionType =
  | 'note'
  | 'status_change'
  | 'assignment_change'
  | 'priority_change'
  | 'due_date_change'
  | 'created'
  | 'updated';

// Status labels configuration
export interface WMStatusLabels {
  backlog: string;
  todo: string;
  in_progress: string;
  review: string;
  done: string;
}

// Default status labels
export const DEFAULT_WM_STATUS_LABELS: WMStatusLabels = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

// Board type
export interface WMBoard {
  id: string;
  account_id: string;
  name: string | null;
  status_labels: WMStatusLabels;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields (optional, populated by API)
  account_name?: string;
  business_name?: string;
  task_count?: number;
}

// Board list item (for dashboard)
export interface WMBoardListItem {
  id: string;
  account_id: string;
  name: string | null;
  account_name: string;
  business_name: string | null;
  task_count: number;
  created_at: string;
}

// User info for assignment
export interface WMUserInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url?: string | null;
}

// Task type
export interface WMTask {
  id: string;
  board_id: string;
  account_id: string;
  title: string;
  description: string | null;
  status: WMTaskStatus;
  priority: WMTaskPriority;
  due_date: string | null;
  assigned_to: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Source tracking fields
  source_type: WMTaskSourceType | null;
  source_reference: string | null;
  // Linked task fields (agency → client linking)
  linked_task_id: string | null;
  linked_account_id: string | null;
  // Joined fields (optional, populated by API)
  assignee?: WMUserInfo | null;
  creator?: WMUserInfo | null;
  // Linked client task data (populated by agency board API)
  linked_task?: {
    title: string;
    description: string | null;
    priority: WMTaskPriority;
    due_date: string | null;
    status: WMTaskStatus;
    client_name: string | null;
    client_board_status_labels: WMStatusLabels | null;
  } | null;
}

// Task action type
export interface WMTaskAction {
  id: string;
  task_id: string;
  account_id: string;
  activity_type: WMActionType;
  content: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  // Joined fields
  creator?: WMUserInfo | null;
}

// API Request/Response types

export interface CreateBoardRequest {
  account_id: string;
  name?: string;
}

export interface UpdateBoardRequest {
  name?: string;
  status_labels?: WMStatusLabels;
}

export interface CreateTaskRequest {
  board_id: string;
  title: string;
  description?: string;
  status?: WMTaskStatus;
  priority?: WMTaskPriority;
  due_date?: string | null;
  assigned_to?: string | null;
  source_type?: WMTaskSourceType;
  source_reference?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  status?: WMTaskStatus;
  priority?: WMTaskPriority;
  due_date?: string | null;
  assigned_to?: string | null;
}

export interface ReorderTasksRequest {
  updates: Array<{
    id: string;
    sort_order: number;
    status?: WMTaskStatus;
  }>;
}

export interface CreateTaskActionRequest {
  task_id: string;
  activity_type: WMActionType;
  content?: string;
  metadata?: Record<string, unknown>;
}

// Column data for Kanban view
export interface WMKanbanColumn {
  id: WMTaskStatus;
  label: string;
  tasks: WMTask[];
  color: string;
}

// Status color configuration
export const WM_STATUS_COLORS: Record<WMTaskStatus, string> = {
  backlog: 'bg-slate-500/70 backdrop-blur-sm',
  todo: 'bg-blue-500/70 backdrop-blur-sm',
  in_progress: 'bg-amber-500/70 backdrop-blur-sm',
  review: 'bg-purple-500/70 backdrop-blur-sm',
  done: 'bg-emerald-500/70 backdrop-blur-sm',
};

// Priority color configuration
export const WM_PRIORITY_COLORS: Record<WMTaskPriority, { bg: string; text: string; border: string }> = {
  low: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  medium: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  high: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

// Priority labels for display
export const WM_PRIORITY_LABELS: Record<WMTaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

// Status order for iteration
export const WM_STATUS_ORDER: WMTaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

// ============================================
// Task Library Types
// ============================================

// Library task category
export type WMLibraryCategory =
  | 'research'
  | 'search_visibility'
  | 'ai_visibility'
  | 'local_visibility'
  | 'fix_issues'
  | 'track_maintain';

// Library task difficulty
export type WMLibraryDifficulty = 'easy' | 'medium' | 'advanced';

// Library task time estimate
export type WMLibraryTimeEstimate = '5_15_min' | '15_45_min' | '45_120_min' | 'multi_step';

// Relevant tool link
export interface WMRelevantTool {
  name: string;
  route: string;
}

// Further reading link (external resources)
export interface WMFurtherReading {
  title: string;
  url: string;
  source: string; // e.g., "Moz", "Search Engine Land", "Google"
}

// Library task from database
export interface WMLibraryTask {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  education: string | null;
  category: WMLibraryCategory;
  goals: string[];
  page_types: string[];
  offsite_sources: string[];
  difficulty: WMLibraryDifficulty;
  time_estimate: WMLibraryTimeEstimate;
  relevant_tools: WMRelevantTool[];
  further_reading: WMFurtherReading[];
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Library pack from database
export interface WMLibraryPack {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  task_count?: number; // Computed field from API
  created_at?: string;
  updated_at?: string;
}

// Library taxonomy constants
export const WM_LIBRARY_CATEGORIES = [
  { id: 'research', label: 'Research' },
  { id: 'search_visibility', label: 'Search visibility' },
  { id: 'ai_visibility', label: 'AI visibility' },
  { id: 'local_visibility', label: 'Local visibility' },
  { id: 'fix_issues', label: 'Fix issues' },
  { id: 'track_maintain', label: 'Track & maintain' },
] as const;

export const WM_LIBRARY_GOALS = [
  'Improve rankings for keyword',
  'Improve traffic',
  'Get more leads',
  'Get more sales',
  'Improve click-through rate',
  'Optimize Google Business',
  'Improve mentions in LLMs',
  'Improve site structure',
  'Discover keyword phrases',
  'Increase authority',
  'Get links and mentions',
] as const;

export const WM_LIBRARY_PAGE_TYPES = [
  'Site-wide',
  'Homepage',
  'Service page',
  'Case study',
  'Blog post',
  'Location page',
  'About page',
  'Contact page',
  'FAQ page',
  'Pricing page',
] as const;

export const WM_LIBRARY_OFFSITE_SOURCES = [
  'Google Business Profile',
  'Directories / Citations',
  'Social Profiles',
  'PR / Mentions',
  'Backlinks',
] as const;

export const WM_LIBRARY_DIFFICULTY = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'advanced', label: 'Advanced' },
] as const;

export const WM_LIBRARY_TIME_ESTIMATES = [
  { id: '5_15_min', label: '5-15 minutes' },
  { id: '15_45_min', label: '15-45 minutes' },
  { id: '45_120_min', label: '45-120 minutes' },
  { id: 'multi_step', label: 'Multi-step project' },
] as const;

// Category colors for display
export const WM_LIBRARY_CATEGORY_COLORS: Record<WMLibraryCategory, { bg: string; text: string }> = {
  research: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  search_visibility: { bg: 'bg-blue-100', text: 'text-blue-700' },
  ai_visibility: { bg: 'bg-purple-100', text: 'text-purple-700' },
  local_visibility: { bg: 'bg-green-100', text: 'text-green-700' },
  fix_issues: { bg: 'bg-red-100', text: 'text-red-700' },
  track_maintain: { bg: 'bg-amber-100', text: 'text-amber-700' },
};

// Difficulty colors for display
export const WM_LIBRARY_DIFFICULTY_COLORS: Record<WMLibraryDifficulty, { bg: string; text: string }> = {
  easy: { bg: 'bg-green-100', text: 'text-green-700' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
  advanced: { bg: 'bg-red-100', text: 'text-red-700' },
};
