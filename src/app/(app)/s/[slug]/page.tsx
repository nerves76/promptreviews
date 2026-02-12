/**
 * Public Survey Page - Server Component
 *
 * Fetches survey + questions + business styling via service role,
 * then passes to client component for rendering.
 */

import { notFound } from 'next/navigation';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { Metadata } from 'next';
import { GLASSY_DEFAULTS } from '@/app/(app)/config/styleDefaults';
import SurveyPageClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  try {
    const supabase = createServiceRoleClient();
    const { data: survey } = await supabase
      .from('surveys')
      .select('title, description')
      .eq('slug', slug)
      .single();

    if (!survey) {
      return { title: 'Survey not found' };
    }

    return {
      title: survey.title,
      description: survey.description || 'Share your feedback',
      robots: 'noindex, nofollow',
    };
  } catch {
    return { title: 'Survey', robots: 'noindex, nofollow' };
  }
}

async function getSurveyData(slug: string) {
  try {
    const supabase = createServiceRoleClient();

    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*, survey_questions(*)')
      .eq('slug', slug)
      .single();

    if (surveyError || !survey) {
      return null;
    }

    // Sort questions by position
    if (survey.survey_questions) {
      survey.survey_questions.sort((a: any, b: any) => a.position - b.position);
    }

    // Fetch business styling if enabled
    let businessProfile = null;
    if (survey.use_business_styling && survey.account_id) {
      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', survey.account_id)
        .maybeSingle();

      businessProfile = business;
    }

    return { survey, businessProfile };
  } catch (error) {
    console.error('Error fetching survey data:', error);
    return null;
  }
}

export default async function SurveyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getSurveyData(slug);

  if (!data) {
    notFound();
  }

  const { survey, businessProfile } = data;

  // Build style config from business profile or defaults
  const styleConfig = {
    primaryFont: businessProfile?.primary_font || GLASSY_DEFAULTS.primary_font,
    gradientStart: businessProfile?.gradient_start || GLASSY_DEFAULTS.gradient_start,
    gradientMiddle: businessProfile?.gradient_middle || GLASSY_DEFAULTS.gradient_middle,
    gradientEnd: businessProfile?.gradient_end || GLASSY_DEFAULTS.gradient_end,
    cardBg: businessProfile?.card_bg || GLASSY_DEFAULTS.card_bg,
    cardText: businessProfile?.card_text || GLASSY_DEFAULTS.card_text,
    cardTransparency: businessProfile?.card_transparency ?? GLASSY_DEFAULTS.card_transparency,
    inputTextColor: businessProfile?.input_text_color || GLASSY_DEFAULTS.input_text_color,
    logoUrl: businessProfile?.logo_url || null,
    businessName: businessProfile?.name || null,
  };

  return (
    <SurveyPageClient
      survey={survey}
      questions={survey.survey_questions || []}
      styleConfig={styleConfig}
    />
  );
}
