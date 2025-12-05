import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  getRotationStatus,
  rotateKeyword,
  autoRotatePromptPage,
  updateRotationSettings,
  getRotationHistory,
  getRotationAlerts,
} from '@/features/keywords/keywordRotationService';

/**
 * GET /api/keywords/rotate
 *
 * Get rotation status for a prompt page or alerts for the account
 *
 * Query params:
 * - promptPageId: Get status for specific prompt page
 * - history: If "true", get rotation history instead of status
 * - limit: Limit for history (default 20)
 * - alerts: If "true", get rotation alerts for account
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const promptPageId = searchParams.get('promptPageId');
    const getHistory = searchParams.get('history') === 'true';
    const getAlertsOnly = searchParams.get('alerts') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get alerts for entire account
    if (getAlertsOnly) {
      const alerts = await getRotationAlerts(accountId, supabase);
      return NextResponse.json({ alerts });
    }

    // Need promptPageId for status/history
    if (!promptPageId) {
      return NextResponse.json(
        { error: 'promptPageId is required' },
        { status: 400 }
      );
    }

    // Get rotation history
    if (getHistory) {
      const history = await getRotationHistory(promptPageId, accountId, limit, supabase);
      return NextResponse.json(history);
    }

    // Get rotation status
    const status = await getRotationStatus(promptPageId, accountId, supabase);

    if (!status) {
      return NextResponse.json(
        { error: 'Prompt page not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting rotation status:', error);
    return NextResponse.json(
      { error: 'Failed to get rotation status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keywords/rotate
 *
 * Perform rotation or update settings
 *
 * Body:
 * - action: "rotate" | "autoRotate" | "updateSettings"
 * - promptPageId: Required for all actions
 * - keywordId: Required for "rotate" action
 * - settings: Required for "updateSettings" action
 *   - autoRotateEnabled?: boolean
 *   - threshold?: number
 *   - activePoolSize?: number
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const body = await request.json();
    const { action, promptPageId, keywordId, settings } = body;

    if (!promptPageId) {
      return NextResponse.json(
        { error: 'promptPageId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'rotate': {
        if (!keywordId) {
          return NextResponse.json(
            { error: 'keywordId is required for rotate action' },
            { status: 400 }
          );
        }

        const result = await rotateKeyword(
          promptPageId,
          keywordId,
          accountId,
          user.id,
          'manual',
          supabase
        );

        if (!result.success) {
          return NextResponse.json(
            { error: result.message, result },
            { status: 400 }
          );
        }

        return NextResponse.json(result);
      }

      case 'autoRotate': {
        const result = await autoRotatePromptPage(promptPageId, accountId, supabase);

        if (!result.success && result.rotations.length === 0) {
          return NextResponse.json(
            { error: result.message, result },
            { status: 400 }
          );
        }

        return NextResponse.json(result);
      }

      case 'updateSettings': {
        if (!settings) {
          return NextResponse.json(
            { error: 'settings object is required for updateSettings action' },
            { status: 400 }
          );
        }

        const result = await updateRotationSettings(
          promptPageId,
          accountId,
          settings,
          supabase
        );

        if (!result.success) {
          return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "rotate", "autoRotate", or "updateSettings"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in rotation action:', error);
    return NextResponse.json(
      { error: 'Failed to perform rotation action' },
      { status: 500 }
    );
  }
}
