import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/utils/emailTemplates';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🧪 Testing welcome email system...');
    
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
    };
    
    console.log('Environment check:', envCheck);
    
    // Check email templates
    let templateCheck: { exists: boolean; error: string | null } = { exists: false, error: null };
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: templates, error } = await supabase
        .from('email_templates')
        .select('name, subject, is_active')
        .eq('name', 'welcome')
        .eq('is_active', true)
        .single();
      
      if (error) {
        templateCheck.error = error.message;
      } else {
        templateCheck.exists = true;
        console.log('Welcome template found:', templates.subject);
      }
    } catch (err) {
      templateCheck.error = err instanceof Error ? err.message : 'Unknown error';
    }
    
    // Test welcome email function (with test email)
    let emailTest: { success: boolean; error: string | null } = { success: false, error: null };
    try {
      // Use a test email that won't actually send
      const result = await sendWelcomeEmail('test@example.com', 'Test User');
      emailTest.success = result.success;
      emailTest.error = result.error || null;
    } catch (err) {
      emailTest.error = err instanceof Error ? err.message : 'Unknown error';
    }
    
    const results = {
      environment: envCheck,
      emailTemplate: templateCheck,
      emailFunction: emailTest,
      timestamp: new Date().toISOString(),
    };
    
    console.log('Test results:', results);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    console.log('🧪 Testing welcome email send to:', email);
    
    const result = await sendWelcomeEmail(email, email.split('@')[0]);
    
    return NextResponse.json({
      success: result.success,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Welcome email test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}