import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
  try {
    const body = await req.json();
    const { contact_id, type, custom_note } = body;
    if (!contact_id || !type) {
      return NextResponse.json({ error: 'Missing contact_id or type' }, { status: 400 });
    }
    // Validate contact exists
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contact_id)
      .single();
    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    // Create prompt page in draft status, prefill with contact info
    const { data: promptPage, error: createError } = await supabase
      .from('prompt_pages')
      .insert([
        {
          contact_id,
          type,
          status: 'draft',
          friendly_note: custom_note || null,
          show_friendly_note: !!custom_note,
          // Prefill fields as needed, e.g. name/email
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          business_name: contact.business_name,
        },
      ])
      .select()
      .single();
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    return NextResponse.json({ promptPage });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
} 