/**
 * Individual Metadata Template API Routes
 * 
 * This endpoint manages individual metadata templates
 * allowing admins to view, update, and delete specific templates
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from '@/auth/providers/supabase';

const supabaseAdmin = createServiceRoleClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[METADATA-TEMPLATE] Fetching template: ${id}`);

    const { data: template, error } = await supabaseAdmin
      .from('metadata_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[METADATA-TEMPLATE] Error fetching template:', error);
      return NextResponse.json(
        { error: "Failed to fetch metadata template" },
        { status: 500 }
      );
    }

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    console.log(`[METADATA-TEMPLATE] Successfully fetched template: ${template.id}`);
    return NextResponse.json(template);
  } catch (error) {
    console.error('[METADATA-TEMPLATE] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log(`[METADATA-TEMPLATE] Updating template: ${id}`, body);

    const {
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
    } = body;

    // If setting this template as active, get its page_type first
    let pageType = null;
    if (is_active) {
      const { data: currentTemplate } = await supabaseAdmin
        .from('metadata_templates')
        .select('page_type')
        .eq('id', id)
        .single();
      
      if (currentTemplate) {
        pageType = currentTemplate.page_type;
        
        // Deactivate other templates for this page type
        const { error: deactivateError } = await supabaseAdmin
          .from('metadata_templates')
          .update({ is_active: false })
          .eq('page_type', pageType)
          .eq('is_active', true)
          .neq('id', id);

        if (deactivateError) {
          console.error('[METADATA-TEMPLATE] Error deactivating existing templates:', deactivateError);
        }
      }
    }

    const { data: template, error } = await supabaseAdmin
      .from('metadata_templates')
      .update({
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
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[METADATA-TEMPLATE] Error updating template:', error);
      return NextResponse.json(
        { error: "Failed to update metadata template" },
        { status: 500 }
      );
    }

    console.log(`[METADATA-TEMPLATE] Successfully updated template: ${template.id}`);
    return NextResponse.json(template);
  } catch (error) {
    console.error('[METADATA-TEMPLATE] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[METADATA-TEMPLATE] Deleting template: ${id}`);

    const { error } = await supabaseAdmin
      .from('metadata_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[METADATA-TEMPLATE] Error deleting template:', error);
      return NextResponse.json(
        { error: "Failed to delete metadata template" },
        { status: 500 }
      );
    }

    console.log(`[METADATA-TEMPLATE] Successfully deleted template: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[METADATA-TEMPLATE] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 