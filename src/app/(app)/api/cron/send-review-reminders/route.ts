/**
 * Cron Job: Send Review Reminders
 * 
 * Smart review reminder system that sends emails only when there are new
 * unresponded reviews from the last 30 days. Prevents spam by tracking
 * last reminder dates and only sending when there are new reviews.
 * 
 * This endpoint is called by Vercel's cron service monthly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { sendTemplatedEmail } from '@/utils/emailTemplates';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel cron
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Cron secret not configured' }, 
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error('Invalid cron authorization token');
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );


    // Get all users with Google Business Profile connections and reminders enabled
    const { data: usersWithGBP, error: gbpError } = await supabase
      .from('google_business_profiles')
      .select(`
        account_id,
        user_id,
        access_token,
        refresh_token,
        expires_at,
        profiles!inner(
          first_name,
          email
        )
      `)
      .eq('profiles.email', supabase.from('profiles').select('email').neq('email', ''));

    if (gbpError) {
      console.error('Error fetching users with GBP:', gbpError);
      return NextResponse.json(
        { error: 'Failed to fetch users with Google Business Profile' }, 
        { status: 500 }
      );
    }

    if (!usersWithGBP || usersWithGBP.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with Google Business Profile connections',
        reminders_sent: 0
      });
    }


    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Process each user
    for (const userData of usersWithGBP) {
      try {
        const userId = userData.user_id;
        const profile = Array.isArray(userData.profiles) ? userData.profiles[0] : userData.profiles;
        if (!profile) {
          continue;
        }

        const { data: reminderSettings } = await supabase
          .from('review_reminder_settings')
          .select('enabled, frequency, last_reminder_sent')
          .eq('account_id', userData.account_id)
          .maybeSingle();

        // Check if reminders are enabled for this user
        if (reminderSettings && !reminderSettings.enabled) {
          skippedCount++;
          continue;
        }

        // Check if we've sent a reminder recently (within last 7 days)
        if (reminderSettings?.last_reminder_sent) {
          const lastReminderDate = new Date(reminderSettings.last_reminder_sent);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          if (lastReminderDate > sevenDaysAgo) {
            skippedCount++;
            continue;
          }
        }

        // Create Google Business Profile client
        const gbpClient = new GoogleBusinessProfileClient({
          accessToken: userData.access_token,
          refreshToken: userData.refresh_token,
          expiresAt: userData.expires_at ? new Date(userData.expires_at).getTime() : Date.now() + 3600000
        });

        // Fetch unresponded reviews from last 30 days
        const unrespondedReviews = await gbpClient.getUnrespondedReviews();

        if (!unrespondedReviews || unrespondedReviews.length === 0) {
          skippedCount++;
          continue;
        }

        // Check if there are new reviews since last reminder
        let hasNewReviews = true;
        if (reminderSettings?.last_reminder_sent) {
          const lastReminderDate = new Date(reminderSettings.last_reminder_sent);
          hasNewReviews = unrespondedReviews.some(location => 
            location.reviews.some(review => 
              new Date(review.createTime) > lastReminderDate
            )
          );
        }

        if (!hasNewReviews) {
          skippedCount++;
          continue;
        }

        // Prepare email data
        const totalReviews = unrespondedReviews.reduce((sum, location) => sum + location.reviews.length, 0);
        const accountCount = new Set(unrespondedReviews.map(location => location.accountId)).size;

        // Group by account for email template
        const accountsByAccountId = new Map();
        unrespondedReviews.forEach(location => {
          if (!accountsByAccountId.has(location.accountId)) {
            accountsByAccountId.set(location.accountId, {
              businessName: location.accountName,
              locations: []
            });
          }
          accountsByAccountId.get(location.accountId).locations.push({
            locationName: location.locationName,
            reviewCount: location.reviews.length,
            multipleReviews: location.reviews.length > 1
          });
        });

        const accounts = Array.from(accountsByAccountId.values()).map(account => ({
          businessName: account.businessName,
          reviewCount: account.locations.reduce((sum: number, loc: any) => sum + loc.reviewCount, 0),
          multipleReviews: account.locations.reduce((sum: number, loc: any) => sum + loc.reviewCount, 0) > 1,
          locations: account.locations
        }));

        // Send reminder email
        const emailResult = await sendTemplatedEmail('review_reminder', profile.email, {
          firstName: profile.first_name || 'there',
          reviewCount: totalReviews,
          accountCount,
          accounts
        });

        if (emailResult.success) {
          // Log the reminder
          const reviewIds = unrespondedReviews.flatMap(location => 
            location.reviews.map(review => review.id)
          );

          await supabase
            .from('review_reminder_logs')
            .insert({
              user_id: userId,
              account_id: userData.account_id,
              location_id: unrespondedReviews[0]?.locationId,
              review_ids: reviewIds,
              reminder_type: 'monthly_review',
              success: true,
              email_sent_to: profile.email,
              review_count: totalReviews
            });

          // Update last reminder sent timestamp
          if (reminderSettings) {
            await supabase
              .from('review_reminder_settings')
              .upsert({
                user_id: userId,
                account_id: userData.account_id,
                last_reminder_sent: new Date().toISOString()
              });
          } else {
            // Create settings record if it doesn't exist
            await supabase
              .from('review_reminder_settings')
              .insert({
                user_id: userId,
                account_id: userData.account_id,
                enabled: true,
                frequency: 'monthly',
                last_reminder_sent: new Date().toISOString()
              });
          }

          successCount++;
          results.push({
            userId,
            email: profile.email,
            status: 'sent',
            reviewCount: totalReviews,
            accountCount
          });

        } else {
          errorCount++;
          results.push({
            userId,
            email: profile.email,
            status: 'failed',
            error: emailResult.error
          });

          console.error(`❌ Failed to send reminder to ${profile.email}:`, emailResult.error);
        }

        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        errorCount++;
        const profile = Array.isArray(userData.profiles) ? userData.profiles[0] : userData.profiles;
        const email = profile?.email || 'unknown';
        
        console.error(`Error processing reminder for ${email}:`, error);
        results.push({
          userId: userData.user_id,
          email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }


    return NextResponse.json({
      success: true,
      summary: {
        total: usersWithGBP.length,
        sent: successCount,
        failed: errorCount,
        skipped: skippedCount
      },
      results
    });

  } catch (error) {
    console.error('Error in review reminder cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 
