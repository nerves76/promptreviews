/**
 * Metadata Templates API Routes
 * 
 * This endpoint manages metadata templates for different prompt page types
 * allowing admins to customize SEO and social media metadata with variables
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from '@/auth/providers/supabase';

const supabaseAdmin = createServiceRoleClient();

export async function GET(request: NextRequest) {
  try {
    console.log('[METADATA-TEMPLATES] Fetching metadata templates');

    const { data: templates, error } = await supabaseAdmin
      .from('metadata_templates')
      .select('*')
      .order('page_type', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[METADATA-TEMPLATES] Error fetching templates:', error);
      return NextResponse.json(
        { error: "Failed to fetch metadata templates" },
        { status: 500 }
      );
    }

    
    return NextResponse.json(templates);
  } catch (error) {
    console.error('[METADATA-TEMPLATES] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[METADATA-TEMPLATES] Creating new template:', body);

    const {
      page_type,
      title_template,
      description_template,
      og_title_template,
      og_description_template,
      og_image_template,
      twitter_title_template,
      twitter_description_template,
      twitter_image_template,
      keywords_template,
      canonical_url_template,
      is_active = true
    } = body;

    if (!page_type) {
      return NextResponse.json(
        { error: "Page type is required" },
        { status: 400 }
      );
    }

    // If setting this template as active, deactivate others for this page type
    if (is_active) {
      const { error: deactivateError } = await supabaseAdmin
        .from('metadata_templates')
        .update({ is_active: false })
        .eq('page_type', page_type)
        .eq('is_active', true);

      if (deactivateError) {
        console.error('[METADATA-TEMPLATES] Error deactivating existing templates:', deactivateError);
      }
    }

    const { data: template, error } = await supabaseAdmin
      .from('metadata_templates')
      .insert({
        page_type,
        title_template,
        description_template,
        og_title_template,
        og_description_template,
        og_image_template,
        twitter_title_template,
        twitter_description_template,
        twitter_image_template,
        keywords_template,
        canonical_url_template,
        is_active
      })
      .select()
      .single();

    if (error) {
      console.error('[METADATA-TEMPLATES] Error creating template:', error);
      return NextResponse.json(
        { error: "Failed to create metadata template" },
        { status: 500 }
      );
    }

    console.log(`[METADATA-TEMPLATES] Successfully created template: ${template.id}`);
    return NextResponse.json(template);
  } catch (error) {
    console.error('[METADATA-TEMPLATES] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 