import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { createServerClient } from '@supabase/ssr';

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

    // Generate a unique slug
    const slug = nanoid(8);
    
    // Create the prompt page in Supabase
    const { data, error } = await supabase
      .from('prompt_pages')
      .insert([
        {
          slug,
          client_name: body.clientName,
          location: body.location,
          tone_of_voice: body.toneOfVoice,
          project_type: body.projectType,
          services_provided: body.servicesProvided,
          outcomes: body.outcomes,
          date_completed: body.dateCompleted,
          team_member: body.teamMember,
          review_platform_links: body.reviewPlatformLinks,
          custom_incentive: body.customIncentive,
          business_id: body.businessId, // This should come from the authenticated user
          status: 'draft',
        },
      ])
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