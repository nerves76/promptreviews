/**
 * Work Manager Types
 * Types for the agency task management feature
 */

// Status enum matching database
export type WMTaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

// Priority enum matching database
export type WMTaskPriority = 'low' | 'medium' | 'high';

// Source type for tracking where tasks originated
export type WMTaskSourceType = 'manual' | 'gbp_suggestion';

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
  // Joined fields (optional, populated by API)
  assignee?: WMUserInfo | null;
  creator?: WMUserInfo | null;
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
  backlog: 'bg-slate-300/60 backdrop-blur-sm border-slate-100/70',
  todo: 'bg-blue-300/60 backdrop-blur-sm border-blue-100/70',
  in_progress: 'bg-amber-300/60 backdrop-blur-sm border-amber-100/70',
  review: 'bg-purple-300/60 backdrop-blur-sm border-purple-100/70',
  done: 'bg-emerald-300/60 backdrop-blur-sm border-emerald-100/70',
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
