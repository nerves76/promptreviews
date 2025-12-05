/**
 * Keyword Rotation Service
 *
 * Manages automatic and manual rotation of keywords to prevent overuse.
 * When a keyword in the active pool exceeds the threshold, it's moved
 * to the reserve pool and replaced with a fresh keyword from reserves.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface RotationResult {
  success: boolean;
  rotatedOut?: {
    keywordId: string;
    phrase: string;
    usageCount: number;
  };
  rotatedIn?: {
    keywordId: string;
    phrase: string;
    usageCount: number;
  };
  message: string;
}

export interface RotationSuggestion {
  keywordId: string;
  phrase: string;
  usageCount: number;
  threshold: number;
  percentOverThreshold: number;
}

export interface PromptPageRotationStatus {
  promptPageId: string;
  promptPageName: string;
  autoRotateEnabled: boolean;
  threshold: number;
  activePoolSize: number;
  activeCount: number;
  reserveCount: number;
  overusedKeywords: RotationSuggestion[];
  availableReplacements: number;
  canRotate: boolean;
}

/**
 * Get rotation status for a prompt page
 */
export async function getRotationStatus(
  promptPageId: string,
  accountId: string,
  supabase: SupabaseClient
): Promise<PromptPageRotationStatus | null> {
  // Get prompt page settings
  const { data: promptPage, error: ppError } = await supabase
    .from('prompt_pages')
    .select('id, name, keyword_auto_rotate_enabled, keyword_auto_rotate_threshold, keyword_active_pool_size')
    .eq('id', promptPageId)
    .eq('account_id', accountId)
    .single();

  if (ppError || !promptPage) {
    console.error('Failed to get prompt page:', ppError);
    return null;
  }

  const threshold = promptPage.keyword_auto_rotate_threshold ?? 16;
  const activePoolSize = promptPage.keyword_active_pool_size ?? 10;

  // Get keywords in active pool with usage counts
  const { data: activeKeywords, error: activeError } = await supabase
    .from('keyword_prompt_page_usage')
    .select(`
      keyword_id,
      is_in_active_pool,
      keywords!inner(id, phrase, review_usage_count)
    `)
    .eq('prompt_page_id', promptPageId)
    .eq('account_id', accountId)
    .eq('is_in_active_pool', true);

  if (activeError) {
    console.error('Failed to get active keywords:', activeError);
    return null;
  }

  // Get keywords in reserve pool
  const { data: reserveKeywords, error: reserveError } = await supabase
    .from('keyword_prompt_page_usage')
    .select(`
      keyword_id,
      keywords!inner(id, phrase, review_usage_count)
    `)
    .eq('prompt_page_id', promptPageId)
    .eq('account_id', accountId)
    .eq('is_in_active_pool', false);

  if (reserveError) {
    console.error('Failed to get reserve keywords:', reserveError);
    return null;
  }

  // Find overused keywords (usage >= threshold)
  const overusedKeywords: RotationSuggestion[] = [];
  for (const kw of activeKeywords || []) {
    const keyword = kw.keywords as any;
    if (keyword.review_usage_count >= threshold) {
      overusedKeywords.push({
        keywordId: keyword.id,
        phrase: keyword.phrase,
        usageCount: keyword.review_usage_count,
        threshold,
        percentOverThreshold: Math.round(((keyword.review_usage_count - threshold) / threshold) * 100),
      });
    }
  }

  // Sort by most overused first
  overusedKeywords.sort((a, b) => b.usageCount - a.usageCount);

  // Count available replacements (reserve keywords under threshold)
  const availableReplacements = (reserveKeywords || []).filter((kw) => {
    const keyword = kw.keywords as any;
    return keyword.review_usage_count < threshold;
  }).length;

  return {
    promptPageId,
    promptPageName: promptPage.name || 'Unnamed Page',
    autoRotateEnabled: promptPage.keyword_auto_rotate_enabled ?? false,
    threshold,
    activePoolSize,
    activeCount: activeKeywords?.length || 0,
    reserveCount: reserveKeywords?.length || 0,
    overusedKeywords,
    availableReplacements,
    canRotate: overusedKeywords.length > 0 && availableReplacements > 0,
  };
}

/**
 * Get the best replacement keyword from reserve pool
 * Prefers keywords with lowest usage count
 */
async function getBestReplacement(
  promptPageId: string,
  accountId: string,
  threshold: number,
  supabase: SupabaseClient
): Promise<{ keywordId: string; phrase: string; usageCount: number } | null> {
  // Fetch all reserve keywords
  const { data, error } = await supabase
    .from('keyword_prompt_page_usage')
    .select(`
      keyword_id,
      keywords!inner(id, phrase, review_usage_count)
    `)
    .eq('prompt_page_id', promptPageId)
    .eq('account_id', accountId)
    .eq('is_in_active_pool', false);

  if (error || !data || data.length === 0) {
    return null;
  }

  // Sort in JavaScript to avoid Supabase foreign table ordering issues
  const sorted = data.sort((a, b) => {
    const aCount = (a.keywords as any).review_usage_count;
    const bCount = (b.keywords as any).review_usage_count;
    return aCount - bCount;
  });

  // Find first keyword under threshold
  for (const kw of sorted) {
    const keyword = kw.keywords as any;
    if (keyword.review_usage_count < threshold) {
      return {
        keywordId: keyword.id,
        phrase: keyword.phrase,
        usageCount: keyword.review_usage_count,
      };
    }
  }

  return null;
}

/**
 * Rotate a specific keyword out and bring in a replacement
 */
export async function rotateKeyword(
  promptPageId: string,
  keywordIdToRotateOut: string,
  accountId: string,
  userId: string | null,
  triggerType: 'auto' | 'manual',
  supabase: SupabaseClient
): Promise<RotationResult> {
  // Get prompt page settings
  const { data: promptPage, error: ppError } = await supabase
    .from('prompt_pages')
    .select('keyword_auto_rotate_threshold')
    .eq('id', promptPageId)
    .eq('account_id', accountId)
    .single();

  if (ppError || !promptPage) {
    return { success: false, message: 'Prompt page not found' };
  }

  const threshold = promptPage.keyword_auto_rotate_threshold ?? 16;

  // Get the keyword being rotated out
  const { data: outKeyword, error: outError } = await supabase
    .from('keywords')
    .select('id, phrase, review_usage_count')
    .eq('id', keywordIdToRotateOut)
    .eq('account_id', accountId)
    .single();

  if (outError || !outKeyword) {
    return { success: false, message: 'Keyword not found' };
  }

  // Get replacement keyword
  const replacement = await getBestReplacement(promptPageId, accountId, threshold, supabase);

  if (!replacement) {
    return {
      success: false,
      message: 'No available replacements in reserve pool. Add more keywords or wait for usage counts to decrease.',
      rotatedOut: {
        keywordId: outKeyword.id,
        phrase: outKeyword.phrase,
        usageCount: outKeyword.review_usage_count,
      },
    };
  }

  const now = new Date().toISOString();

  // Get current rotation count
  const { data: usageData } = await supabase
    .from('keyword_prompt_page_usage')
    .select('rotation_count')
    .eq('prompt_page_id', promptPageId)
    .eq('keyword_id', keywordIdToRotateOut)
    .eq('account_id', accountId)
    .single();

  const currentRotationCount = usageData?.rotation_count || 0;

  // Move keyword out to reserve
  const { error: outUpdateError } = await supabase
    .from('keyword_prompt_page_usage')
    .update({
      is_in_active_pool: false,
      rotated_out_at: now,
      rotation_count: currentRotationCount + 1,
    })
    .eq('prompt_page_id', promptPageId)
    .eq('keyword_id', keywordIdToRotateOut)
    .eq('account_id', accountId);

  if (outUpdateError) {
    console.error('Failed to rotate out keyword:', outUpdateError);
    return { success: false, message: 'Failed to update keyword status' };
  }

  // Move replacement in to active pool
  const { error: inUpdateError } = await supabase
    .from('keyword_prompt_page_usage')
    .update({
      is_in_active_pool: true,
      rotated_in_at: now,
    })
    .eq('prompt_page_id', promptPageId)
    .eq('keyword_id', replacement.keywordId)
    .eq('account_id', accountId);

  if (inUpdateError) {
    console.error('Failed to rotate in keyword:', inUpdateError);
    // Try to rollback
    await supabase
      .from('keyword_prompt_page_usage')
      .update({ is_in_active_pool: true, rotated_out_at: null })
      .eq('prompt_page_id', promptPageId)
      .eq('keyword_id', keywordIdToRotateOut)
      .eq('account_id', accountId);
    return { success: false, message: 'Failed to activate replacement keyword' };
  }

  // Log the rotation
  await supabase.from('keyword_rotation_log').insert({
    account_id: accountId,
    prompt_page_id: promptPageId,
    rotated_out_keyword_id: keywordIdToRotateOut,
    rotated_in_keyword_id: replacement.keywordId,
    trigger_type: triggerType,
    usage_count_at_rotation: outKeyword.review_usage_count,
    threshold_at_rotation: threshold,
    created_by: userId,
  });

  return {
    success: true,
    message: `Rotated "${outKeyword.phrase}" out and "${replacement.phrase}" in`,
    rotatedOut: {
      keywordId: outKeyword.id,
      phrase: outKeyword.phrase,
      usageCount: outKeyword.review_usage_count,
    },
    rotatedIn: {
      keywordId: replacement.keywordId,
      phrase: replacement.phrase,
      usageCount: replacement.usageCount,
    },
  };
}

/**
 * Perform automatic rotation for all overused keywords in a prompt page
 */
export async function autoRotatePromptPage(
  promptPageId: string,
  accountId: string,
  supabase: SupabaseClient
): Promise<{ success: boolean; rotations: RotationResult[]; message: string }> {
  const status = await getRotationStatus(promptPageId, accountId, supabase);

  if (!status) {
    return { success: false, rotations: [], message: 'Failed to get rotation status' };
  }

  if (!status.autoRotateEnabled) {
    return { success: false, rotations: [], message: 'Auto-rotation is disabled for this page' };
  }

  if (status.overusedKeywords.length === 0) {
    return { success: true, rotations: [], message: 'No keywords need rotation' };
  }

  const rotations: RotationResult[] = [];

  for (const overused of status.overusedKeywords) {
    const result = await rotateKeyword(
      promptPageId,
      overused.keywordId,
      accountId,
      null, // Auto rotation has no user
      'auto',
      supabase
    );
    rotations.push(result);

    // Stop if we can't rotate anymore
    if (!result.success && result.message.includes('No available replacements')) {
      break;
    }
  }

  const successCount = rotations.filter((r) => r.success).length;

  return {
    success: successCount > 0,
    rotations,
    message: `Rotated ${successCount} of ${status.overusedKeywords.length} overused keywords`,
  };
}

/**
 * Update rotation settings for a prompt page
 */
export async function updateRotationSettings(
  promptPageId: string,
  accountId: string,
  settings: {
    autoRotateEnabled?: boolean;
    threshold?: number;
    activePoolSize?: number;
  },
  supabase: SupabaseClient
): Promise<{ success: boolean; message: string }> {
  const updateData: Record<string, any> = {};

  if (settings.autoRotateEnabled !== undefined) {
    updateData.keyword_auto_rotate_enabled = settings.autoRotateEnabled;
  }

  if (settings.threshold !== undefined) {
    if (settings.threshold < 1 || settings.threshold > 100) {
      return { success: false, message: 'Threshold must be between 1 and 100' };
    }
    updateData.keyword_auto_rotate_threshold = settings.threshold;
  }

  if (settings.activePoolSize !== undefined) {
    if (settings.activePoolSize < 1 || settings.activePoolSize > 50) {
      return { success: false, message: 'Active pool size must be between 1 and 50' };
    }
    updateData.keyword_active_pool_size = settings.activePoolSize;
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, message: 'No settings to update' };
  }

  const { error } = await supabase
    .from('prompt_pages')
    .update(updateData)
    .eq('id', promptPageId)
    .eq('account_id', accountId);

  if (error) {
    console.error('Failed to update rotation settings:', error);
    return { success: false, message: 'Failed to update settings' };
  }

  return { success: true, message: 'Settings updated successfully' };
}

/**
 * Get rotation history for a prompt page
 */
export async function getRotationHistory(
  promptPageId: string,
  accountId: string,
  limit: number = 20,
  supabase: SupabaseClient
): Promise<{
  logs: Array<{
    id: string;
    rotatedOutPhrase: string | null;
    rotatedInPhrase: string | null;
    triggerType: 'auto' | 'manual';
    usageCountAtRotation: number | null;
    thresholdAtRotation: number | null;
    createdAt: string;
  }>;
  total: number;
}> {
  const { data, error, count } = await supabase
    .from('keyword_rotation_log')
    .select(
      `
      id,
      trigger_type,
      usage_count_at_rotation,
      threshold_at_rotation,
      created_at,
      rotated_out:keywords!rotated_out_keyword_id(phrase),
      rotated_in:keywords!rotated_in_keyword_id(phrase)
    `,
      { count: 'exact' }
    )
    .eq('prompt_page_id', promptPageId)
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to get rotation history:', error);
    return { logs: [], total: 0 };
  }

  const logs = (data || []).map((log: any) => ({
    id: log.id,
    rotatedOutPhrase: log.rotated_out?.phrase || null,
    rotatedInPhrase: log.rotated_in?.phrase || null,
    triggerType: log.trigger_type as 'auto' | 'manual',
    usageCountAtRotation: log.usage_count_at_rotation,
    thresholdAtRotation: log.threshold_at_rotation,
    createdAt: log.created_at,
  }));

  return { logs, total: count || 0 };
}

/**
 * Check if any prompt pages need rotation alerts
 * Returns pages that have overused keywords but no available replacements
 */
export async function getRotationAlerts(
  accountId: string,
  supabase: SupabaseClient
): Promise<
  Array<{
    promptPageId: string;
    promptPageName: string;
    overusedCount: number;
    replacementsNeeded: number;
    message: string;
  }>
> {
  // Get all prompt pages with auto-rotation enabled
  const { data: promptPages, error } = await supabase
    .from('prompt_pages')
    .select('id, name, keyword_auto_rotate_enabled, keyword_auto_rotate_threshold')
    .eq('account_id', accountId)
    .eq('keyword_auto_rotate_enabled', true);

  if (error || !promptPages) {
    console.error('Failed to get prompt pages for alerts:', error);
    return [];
  }

  const alerts: Array<{
    promptPageId: string;
    promptPageName: string;
    overusedCount: number;
    replacementsNeeded: number;
    message: string;
  }> = [];

  for (const pp of promptPages) {
    const status = await getRotationStatus(pp.id, accountId, supabase);
    if (!status) continue;

    if (status.overusedKeywords.length > 0 && status.availableReplacements < status.overusedKeywords.length) {
      const needed = status.overusedKeywords.length - status.availableReplacements;
      alerts.push({
        promptPageId: pp.id,
        promptPageName: pp.name || 'Unnamed Page',
        overusedCount: status.overusedKeywords.length,
        replacementsNeeded: needed,
        message: `${status.overusedKeywords.length} keywords need rotation but only ${status.availableReplacements} replacements available. Add ${needed} more keywords to the reserve pool.`,
      });
    }
  }

  return alerts;
}
