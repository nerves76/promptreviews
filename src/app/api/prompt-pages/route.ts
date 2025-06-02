import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { createServerClient } from '@supabase/ssr';
import { sanitizePromptPageInsert } from '@/utils/sanitizePromptPageInsert';
import { slugify } from '@/utils/slugify';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cookieStore = cookies() as any;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            // Not needed for this handler
          },
          remove: (name, options) => {
            // Not needed for this handler
          },
        },
      }
    );

    // Generate a unique slug from client_name or title
    let slug;
    if (body.client_name) {
      slug = slugify(body.client_name, Date.now().toString(36));
    } else if (body.title) {
      slug = slugify(body.title, Date.now().toString(36));
    } else {
      slug = nanoid(8);
    }
    
    // Create the prompt page in Supabase
    const insertData = sanitizePromptPageInsert({
      slug,
      client_name: body.client_name,
      location: body.location,
      tone_of_voice: body.tone_of_voice,
      project_type: body.project_type,
      features_or_benefits: Array.isArray(body.services_offered) ? body.services_offered : (typeof body.services_offered === 'string' ? [body.services_offered] : []),
      product_description: body.outcomes,
      date_completed: body.date_completed,
      team_member: body.team_member,
      review_platforms: body.review_platform_links,
      offer_enabled: body.offer_enabled,
      offer_title: body.offer_title,
      offer_body: body.offer_body,
      status: body.status,
      account_id: body.business_id, // This should come from the authenticated user
    });
    const { data, error } = await supabase
      .from('prompt_pages')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating prompt page:', error);
      return NextResponse.json(
        { error: 'Failed to create prompt page' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in POST /api/prompt-pages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 