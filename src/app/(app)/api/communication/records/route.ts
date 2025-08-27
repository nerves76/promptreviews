import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../@/utils/supabaseClient';
import { createCommunicationRecord, getCommunicationHistory } from '../@/utils/communication';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the current user (more reliable than getSession for server routes)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error in communication/records POST:', userError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contactId, promptPageId, communicationType, subject, message, followUpReminder } = body;

    // Validate required fields
    if (!contactId || !communicationType || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: contactId, communicationType, and message are required' },
        { status: 400 }
      );
    }

    if (!['email', 'sms'].includes(communicationType)) {
      return NextResponse.json(
        { error: 'Invalid communication type. Must be "email" or "sms"' },
        { status: 400 }
      );
    }

    // Create the communication record
    const record = await createCommunicationRecord(
      {
        contactId,
        promptPageId,
        communicationType,
        subject,
        message,
        followUpReminder
      },
      user.id,
      supabase
    );

    return NextResponse.json({ record }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating communication record:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create communication record' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the current user (more reliable than getSession for server routes)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error in communication/records GET:', userError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId parameter is required' },
        { status: 400 }
      );
    }

    // Get communication history for the contact
    const records = await getCommunicationHistory(contactId, user.id);

    return NextResponse.json({ records }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching communication records:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch communication records' },
      { status: 500 }
    );
  }
}