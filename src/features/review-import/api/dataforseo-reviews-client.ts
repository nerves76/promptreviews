/**
 * DataForSEO Reviews API Client
 *
 * Wrapper for DataForSEO's Business Data reviews APIs (async task model).
 * Supports Trustpilot and TripAdvisor review fetching.
 *
 * API Documentation: https://docs.dataforseo.com/v3/business_data/
 */

import type { DataForSEOPlatformId } from '../types';

// ============================================
// Configuration
// ============================================

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';

// Endpoint templates per platform
const ENDPOINTS: Record<DataForSEOPlatformId, { taskPost: string; tasksReady: string; taskGet: string }> = {
  trustpilot: {
    taskPost: '/business_data/trustpilot/reviews/task_post',
    tasksReady: '/business_data/trustpilot/reviews/tasks_ready',
    taskGet: '/business_data/trustpilot/reviews/task_get',
  },
  tripadvisor: {
    taskPost: '/business_data/tripadvisor/reviews/task_post',
    tasksReady: '/business_data/tripadvisor/reviews/tasks_ready',
    taskGet: '/business_data/tripadvisor/reviews/task_get',
  },
  google_play: {
    taskPost: '/app_data/google/app_reviews/task_post',
    tasksReady: '/app_data/google/app_reviews/tasks_ready',
    taskGet: '/app_data/google/app_reviews/task_get/advanced',
  },
  app_store: {
    taskPost: '/app_data/apple/app_reviews/task_post',
    tasksReady: '/app_data/apple/app_reviews/tasks_ready',
    taskGet: '/app_data/apple/app_reviews/task_get/advanced',
  },
};

// Polling configuration
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 15; // ~48s total (3s initial wait + 15 * 3s), fits within 60s function limit
const REQUEST_TIMEOUT_MS = 30000;

// DataForSEO status code indicating task not ready
const STATUS_NOT_READY = 40602;

// ============================================
// Credentials
// ============================================

interface DataForSEOCredentials {
  login: string;
  password: string;
}

function getCredentials(): DataForSEOCredentials {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      'DataForSEO credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables.'
    );
  }

  return { login, password };
}

function getAuthHeader(credentials: DataForSEOCredentials): string {
  const encoded = Buffer.from(`${credentials.login}:${credentials.password}`).toString('base64');
  return `Basic ${encoded}`;
}

// ============================================
// Response Types
// ============================================

interface DataForSEOTaskResponse {
  tasks?: Array<{
    id: string;
    status_code: number;
    status_message: string;
    cost: number;
    result?: Array<{
      items_count?: number;
      items?: Record<string, any>[];
    }>;
  }>;
}

interface DataForSEOTasksReadyResponse {
  tasks?: Array<{
    result?: Array<{
      id: string;
      tag?: string;
    }>;
  }>;
}

export interface CreateTaskResult {
  success: boolean;
  taskId?: string;
  error?: string;
  cost: number;
}

export interface FetchReviewsResult {
  success: boolean;
  items: Record<string, any>[];
  totalCount: number;
  cost: number;
  error?: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Create a review fetch task on DataForSEO
 */
export async function createReviewTask(
  platform: DataForSEOPlatformId,
  payload: Record<string, any>
): Promise<CreateTaskResult> {
  const credentials = getCredentials();
  const endpoint = ENDPOINTS[platform];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${DATAFORSEO_API_BASE}${endpoint.taskPost}`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(credentials),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([payload]),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DataForSEO Reviews] API error on task_post:`, response.status, errorText);
      if (response.status === 402) {
        return {
          success: false,
          cost: 0,
          error: 'Service temporarily unavailable. Please contact support@promptreviews.app',
        };
      }
      return {
        success: false,
        cost: 0,
        error: `API returned ${response.status}: ${errorText}`,
      };
    }

    const data: DataForSEOTaskResponse = await response.json();
    const task = data.tasks?.[0];

    if (!task) {
      return { success: false, cost: 0, error: 'No task returned from API' };
    }

    if (task.status_code !== 20100 && task.status_code !== 20000) {
      return {
        success: false,
        cost: task.cost || 0,
        error: `Task creation failed: ${task.status_message}`,
      };
    }

    return {
      success: true,
      taskId: task.id,
      cost: task.cost || 0,
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, cost: 0, error: 'Request timeout (30 seconds)' };
    }
    console.error(`[DataForSEO Reviews] Request failed:`, error);
    return {
      success: false,
      cost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get task results from DataForSEO
 */
export async function getTaskResults(
  platform: DataForSEOPlatformId,
  taskId: string
): Promise<FetchReviewsResult> {
  const credentials = getCredentials();
  const endpoint = ENDPOINTS[platform];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${DATAFORSEO_API_BASE}${endpoint.taskGet}/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(credentials),
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DataForSEO Reviews] API error on task_get:`, response.status, errorText);
      return {
        success: false,
        items: [],
        totalCount: 0,
        cost: 0,
        error: `API returned ${response.status}: ${errorText}`,
      };
    }

    const data: DataForSEOTaskResponse = await response.json();
    const task = data.tasks?.[0];

    if (!task) {
      return { success: false, items: [], totalCount: 0, cost: 0, error: 'No task in response' };
    }

    // Task not ready yet
    if (task.status_code === STATUS_NOT_READY) {
      return {
        success: false,
        items: [],
        totalCount: 0,
        cost: task.cost || 0,
        error: 'TASK_NOT_READY',
      };
    }

    if (task.status_code !== 20000) {
      return {
        success: false,
        items: [],
        totalCount: 0,
        cost: task.cost || 0,
        error: `Task failed: ${task.status_message}`,
      };
    }

    const result = task.result?.[0];
    const items = result?.items || [];

    return {
      success: true,
      items,
      totalCount: result?.items_count || items.length,
      cost: task.cost || 0,
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, items: [], totalCount: 0, cost: 0, error: 'Request timeout (30 seconds)' };
    }
    console.error(`[DataForSEO Reviews] Request failed:`, error);
    return {
      success: false,
      items: [],
      totalCount: 0,
      cost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper: wait for a specified duration
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * High-level: create task + poll until ready + get results
 *
 * Polling strategy:
 * 1. POST task
 * 2. Wait 3 seconds
 * 3. GET task results
 * 4. If not ready (status 40602), wait 3s and retry
 * 5. Max 7 attempts (~25s total)
 * 6. If still not ready, return error
 */
export async function fetchReviews(
  platform: DataForSEOPlatformId,
  payload: Record<string, any>
): Promise<FetchReviewsResult> {
  // Step 1: Create the task
  const createResult = await createReviewTask(platform, payload);
  if (!createResult.success || !createResult.taskId) {
    return {
      success: false,
      items: [],
      totalCount: 0,
      cost: createResult.cost,
      error: createResult.error || 'Failed to create task',
    };
  }

  const taskId = createResult.taskId;
  let totalCost = createResult.cost;

  // Step 2: Wait initial interval then poll
  await wait(POLL_INTERVAL_MS);

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const result = await getTaskResults(platform, taskId);
    totalCost += result.cost;

    if (result.success) {
      return { ...result, cost: totalCost };
    }

    // If task not ready, wait and retry
    if (result.error === 'TASK_NOT_READY') {
      console.log(`[DataForSEO Reviews] Task ${taskId} not ready, attempt ${attempt + 1}/${MAX_POLL_ATTEMPTS}`);
      await wait(POLL_INTERVAL_MS);
      continue;
    }

    // Any other error, return immediately
    return { ...result, cost: totalCost };
  }

  // Timed out
  return {
    success: false,
    items: [],
    totalCount: 0,
    cost: totalCost,
    error: 'Task did not complete in time. Try importing fewer reviews or retry later.',
  };
}
