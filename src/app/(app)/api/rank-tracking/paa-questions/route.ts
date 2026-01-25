/**
 * API endpoint to aggregate People Also Ask (PAA) questions from rank checks.
 *
 * GET /api/rank-tracking/paa-questions
 * Query params:
 *   - keywordId (optional): Filter to a specific keyword
 *   - isOurs (optional): 'true' or 'false' to filter by ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

interface PAAQuestion {
  question: string;
  answerDomain: string | null;
  answerUrl: string | null;
  answerTitle: string | null;
  isOurs: boolean;
  isAiGenerated: boolean;
}

interface SerpFeatures {
  peopleAlsoAsk?: {
    present: boolean;
    questions: PAAQuestion[];
    ourQuestionCount: number;
  };
}

interface AnsweringDomain {
  domain: string;
  count: number;
  isOurs: boolean;
  urls: string[];
}

interface TriggeringKeyword {
  keywordId: string;
  phrase: string;
}

interface PAAQuestionAggregated {
  question: string;
  frequency: number;
  answeringDomains: AnsweringDomain[];
  triggeringKeywords: TriggeringKeyword[];
  firstSeen: string;
  lastSeen: string;
  isOursLatest: boolean;
  ourAnswerCount: number;
}

interface PAAQuestionsResponse {
  questions: PAAQuestionAggregated[];
  summary: {
    totalUniqueQuestions: number;
    totalChecksWithPAA: number;
    questionsWeAnswer: number;
    mostRecentCheck: string | null;
  };
}

/**
 * Normalize question text for deduplication
 */
function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .trim()
    .replace(/[?!.]+$/, '')
    .replace(/\s+/g, ' ');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Get optional filters
    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('keywordId');
    const isOursFilter = searchParams.get('isOurs');

    // Fetch all rank checks with PAA data for this account
    let query = supabase
      .from('rank_checks')
      .select(`
        id,
        keyword_id,
        search_query_used,
        serp_features,
        checked_at,
        keywords!inner (
          id,
          phrase
        )
      `)
      .eq('account_id', accountId)
      .gt('paa_question_count', 0)
      .not('serp_features', 'is', null);

    if (keywordId) {
      query = query.eq('keyword_id', keywordId);
    }

    const { data: checks, error } = await query;

    if (error) {
      console.error('[paa-questions] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Aggregate PAA questions by normalized text
    const questionMap = new Map<string, {
      question: string;
      frequency: number;
      answeringDomains: Map<string, { count: number; isOurs: boolean; urls: Set<string> }>;
      triggeringKeywords: Map<string, { keywordId: string; phrase: string }>;
      firstSeen: Date;
      lastSeen: Date;
      isOursLatest: boolean;
      ourAnswerCount: number;
    }>();

    let totalChecksWithPAA = 0;
    let mostRecentCheck: Date | null = null;

    for (const check of checks || []) {
      const serpFeatures = check.serp_features as SerpFeatures | null;
      const paa = serpFeatures?.peopleAlsoAsk;

      if (!paa?.questions?.length) {
        continue;
      }

      totalChecksWithPAA++;
      const checkedAt = new Date(check.checked_at);
      const keywordPhrase = (check.keywords as any)?.phrase || 'Unknown';

      if (!mostRecentCheck || checkedAt > mostRecentCheck) {
        mostRecentCheck = checkedAt;
      }

      for (const q of paa.questions) {
        if (!q.question) continue;

        const normalized = normalizeQuestion(q.question);

        if (!questionMap.has(normalized)) {
          questionMap.set(normalized, {
            question: q.question, // Keep original casing from first occurrence
            frequency: 0,
            answeringDomains: new Map(),
            triggeringKeywords: new Map(),
            firstSeen: checkedAt,
            lastSeen: checkedAt,
            isOursLatest: false,
            ourAnswerCount: 0,
          });
        }

        const entry = questionMap.get(normalized)!;
        entry.frequency++;

        // Track answer domain
        if (q.answerDomain) {
          const domain = q.answerDomain.toLowerCase();
          if (!entry.answeringDomains.has(domain)) {
            entry.answeringDomains.set(domain, {
              count: 0,
              isOurs: false,
              urls: new Set(),
            });
          }
          const domainEntry = entry.answeringDomains.get(domain)!;
          domainEntry.count++;
          if (q.isOurs) {
            domainEntry.isOurs = true;
          }
          if (q.answerUrl) {
            domainEntry.urls.add(q.answerUrl);
          }
        }

        // Track our answer count
        if (q.isOurs) {
          entry.ourAnswerCount++;
        }

        // Track triggering keyword
        if (!entry.triggeringKeywords.has(check.keyword_id)) {
          entry.triggeringKeywords.set(check.keyword_id, {
            keywordId: check.keyword_id,
            phrase: keywordPhrase,
          });
        }

        // Update timestamps
        if (checkedAt < entry.firstSeen) {
          entry.firstSeen = checkedAt;
        }
        if (checkedAt > entry.lastSeen) {
          entry.lastSeen = checkedAt;
          entry.isOursLatest = q.isOurs;
        }
      }
    }

    // Convert map to sorted array
    let questions: PAAQuestionAggregated[] = Array.from(questionMap.entries())
      .map(([, data]) => ({
        question: data.question,
        frequency: data.frequency,
        answeringDomains: Array.from(data.answeringDomains.entries())
          .map(([domain, info]) => ({
            domain,
            count: info.count,
            isOurs: info.isOurs,
            urls: Array.from(info.urls).slice(0, 3),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5), // Limit to top 5 answering domains
        triggeringKeywords: Array.from(data.triggeringKeywords.values()).slice(0, 10),
        firstSeen: data.firstSeen.toISOString(),
        lastSeen: data.lastSeen.toISOString(),
        isOursLatest: data.isOursLatest,
        ourAnswerCount: data.ourAnswerCount,
      }));

    // Apply isOurs filter if specified
    if (isOursFilter === 'true') {
      questions = questions.filter(q => q.ourAnswerCount > 0);
    } else if (isOursFilter === 'false') {
      questions = questions.filter(q => q.ourAnswerCount === 0);
    }

    // Sort by frequency descending
    questions.sort((a, b) => b.frequency - a.frequency);

    // Count questions we answer
    const questionsWeAnswer = Array.from(questionMap.values())
      .filter(q => q.ourAnswerCount > 0).length;

    const response: PAAQuestionsResponse = {
      questions,
      summary: {
        totalUniqueQuestions: questionMap.size,
        totalChecksWithPAA,
        questionsWeAnswer,
        mostRecentCheck: mostRecentCheck?.toISOString() || null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[paa-questions] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
