import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { category, message, email } = await request.json();

    // Validate required fields
    if (!category || !message) {
      return NextResponse.json(
        { error: 'Category and message are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['bug_report', 'feature_request', 'general_feedback'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Get user ID from the request headers (set by the client)
    const authHeader = request.headers.get('authorization');
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      // Try to verify the token and get user info
      const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && tokenUser) {
        user = tokenUser;
      }
    }
    
    // If no user from token, try to get from cookies or other means
    if (!user) {
      // For now, let's allow feedback without user ID (anonymous feedback)
    }

    // Insert feedback into the database
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: user?.id || null,
        category,
        message: message.trim(),
        email: email?.trim() || null,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting feedback:', error);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }


    return NextResponse.json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      feedback_id: data.id
    });

  } catch (error) {
    console.error('Error in feedback API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 