/**
 * Cron Job: Send Monthly Google Business Profile Insights
 * 
 * Comprehensive monthly email that includes:
 * - Unresponded reviews requiring attention
 * - Posting frequency and engagement metrics
 * - Photo upload statistics
 * - Overall GBP health score
 * 
 * This endpoint is called by Vercel's cron service monthly.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { sendTemplatedEmail } from '@/utils/emailTemplates';
import { getAccountIdForUser } from '@/auth/utils/accounts';

interface LocationMetrics {
  locationId: string;
  locationName: string;
  accountName: string;
  metrics: {
    unrespondedReviews: number;
    newReviewsThisMonth: number;
    postsThisMonth: number;
    photosUploadedThisMonth: number;
    lastPostDate: Date | null;
    lastPhotoDate: Date | null;
    averageRating: number;
    totalReviews: number;
  };
}

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('send-monthly-insights', async () => {
    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );


    // Get all accounts with selected GBP locations and insights enabled
    const { data: accountsWithGBP, error: accountsError } = await supabase
      .from('accounts')
      .select(`
        id,
        email,
        first_name,
        plan,
        account_users!inner(
          user_id
        ),
        selected_gbp_locations!inner(
          location_id,
          location_name,
          include_in_insights
        )
      `)
      .eq('selected_gbp_locations.include_in_insights', true);

    if (accountsError) {
      throw new Error('Failed to fetch accounts with selected GBP locations');
    }

    if (!accountsWithGBP || accountsWithGBP.length === 0) {
      return {
        success: true,
        summary: { emails_sent: 0, message: 'No accounts with selected GBP locations' },
      };
    }


    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Process each account
    for (const account of accountsWithGBP) {
      try {
        // Get the primary user for this account
        const userId = account.account_users[0]?.user_id;
        if (!userId) {
          continue;
        }

        // Check if insights are enabled for this user/account
        const { data: reminderSettings } = await supabase
          .from('review_reminder_settings')
          .select('enabled, last_reminder_sent')
          .eq('user_id', userId)
          .single();

        // If settings don't exist or are disabled, skip
        if (!reminderSettings?.enabled) {
          skippedCount++;
          continue;
        }

        // Check if we've sent insights recently (within last 25 days to ensure monthly)
        if (reminderSettings.last_reminder_sent) {
          const lastSentDate = new Date(reminderSettings.last_reminder_sent);
          const twentyFiveDaysAgo = new Date();
          twentyFiveDaysAgo.setDate(twentyFiveDaysAgo.getDate() - 25);
          
          if (lastSentDate > twentyFiveDaysAgo) {
            skippedCount++;
            continue;
          }
        }

        // Get Google Business Profile credentials
        const { data: gbpCredentials } = await supabase
          .from('google_business_profiles')
          .select('access_token, refresh_token, expires_at')
          .eq('account_id', account.id)
          .maybeSingle();

        if (!gbpCredentials) {
          skippedCount++;
          continue;
        }

        // Create Google Business Profile client
        const gbpClient = new GoogleBusinessProfileClient({
          accessToken: gbpCredentials.access_token,
          refreshToken: gbpCredentials.refresh_token,
          expiresAt: gbpCredentials.expires_at ? new Date(gbpCredentials.expires_at).getTime() : Date.now() + 3600000
        });

        // Collect metrics for each selected location
        const locationMetrics: LocationMetrics[] = [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        for (const location of account.selected_gbp_locations) {
          try {
            
            // Get unresponded reviews
            const unrespondedReviews = await gbpClient.getUnrespondedReviewsForLocation(location.location_id);
            
            // Get posting metrics (simplified - would need actual API calls)
            // For now, we'll get this from our database if we're tracking posts
            const { data: posts } = await supabase
              .from('gbp_posts') // This table would need to be created
              .select('created_at')
              .eq('location_id', location.location_id)
              .gte('created_at', thirtyDaysAgo.toISOString())
              .order('created_at', { ascending: false });

            // Get photo metrics (simplified - would need actual API calls)
            const { data: photos } = await supabase
              .from('gbp_photos') // This table would need to be created
              .select('uploaded_at')
              .eq('location_id', location.location_id)
              .gte('uploaded_at', thirtyDaysAgo.toISOString())
              .order('uploaded_at', { ascending: false });

            locationMetrics.push({
              locationId: location.location_id,
              locationName: location.location_name,
              accountName: account.first_name || 'Business',
              metrics: {
                unrespondedReviews: unrespondedReviews?.length || 0,
                newReviewsThisMonth: 0, // Would need to track this
                postsThisMonth: posts?.length || 0,
                photosUploadedThisMonth: photos?.length || 0,
                lastPostDate: posts?.[0]?.created_at ? new Date(posts[0].created_at) : null,
                lastPhotoDate: photos?.[0]?.uploaded_at ? new Date(photos[0].uploaded_at) : null,
                averageRating: 0, // Would need to calculate
                totalReviews: 0 // Would need to fetch
              }
            });
          } catch (error) {
            console.error(`Error fetching metrics for location ${location.location_name}:`, error);
          }
        }

        if (locationMetrics.length === 0) {
          skippedCount++;
          continue;
        }

        // Calculate aggregate metrics
        const totalUnresponded = locationMetrics.reduce((sum, loc) => sum + loc.metrics.unrespondedReviews, 0);
        const totalPosts = locationMetrics.reduce((sum, loc) => sum + loc.metrics.postsThisMonth, 0);
        const totalPhotos = locationMetrics.reduce((sum, loc) => sum + loc.metrics.photosUploadedThisMonth, 0);

        // Determine health score and recommendations
        let healthScore = 100;
        const recommendations = [];

        // Deduct points for unresponded reviews
        if (totalUnresponded > 0) {
          healthScore -= Math.min(30, totalUnresponded * 5);
          recommendations.push(`Respond to ${totalUnresponded} review${totalUnresponded > 1 ? 's' : ''} to improve customer engagement`);
        }

        // Deduct points for low posting frequency
        if (totalPosts < 4) { // Less than 1 per week
          healthScore -= 20;
          recommendations.push('Post more frequently (aim for at least once per week)');
        }

        // Deduct points for no photos
        if (totalPhotos === 0) {
          healthScore -= 15;
          recommendations.push('Upload photos to showcase your business visually');
        }

        // Format location details for email
        const locationDetails = locationMetrics.map(loc => ({
          name: loc.locationName,
          unrespondedReviews: loc.metrics.unrespondedReviews,
          postsThisMonth: loc.metrics.postsThisMonth,
          photosThisMonth: loc.metrics.photosUploadedThisMonth,
          needsAttention: loc.metrics.unrespondedReviews > 0 || loc.metrics.postsThisMonth === 0
        }));

        // Send insights email
        const emailResult = await sendTemplatedEmail('monthly_insights', account.email, {
          firstName: account.first_name || 'there',
          monthName: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          healthScore,
          healthScoreColor: healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red',
          totalLocations: locationMetrics.length,
          totalUnrespondedReviews: totalUnresponded,
          totalPosts,
          totalPhotos,
          locations: locationDetails,
          recommendations,
          hasUrgentItems: totalUnresponded > 5,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/google-business`
        });

        if (emailResult.success) {
          // Update last reminder sent timestamp
          await supabase
            .from('review_reminder_settings')
            .upsert({
              user_id: userId,
              account_id: account.id,
              last_reminder_sent: new Date().toISOString(),
              enabled: true
            });

          // Log the insights sent
          await supabase
            .from('review_reminder_logs')
            .insert({
              user_id: userId,
              account_id: account.id,
              reminder_type: 'monthly_insights',
              success: true,
              email_sent_to: account.email,
              metadata: {
                health_score: healthScore,
                total_unresponded: totalUnresponded,
                total_posts: totalPosts,
                total_photos: totalPhotos,
                locations_count: locationMetrics.length
              }
            });

          successCount++;
          results.push({
            accountId: account.id,
            email: account.email,
            status: 'sent',
            healthScore,
            metrics: {
              unresponded: totalUnresponded,
              posts: totalPosts,
              photos: totalPhotos
            }
          });

        } else {
          errorCount++;
          results.push({
            accountId: account.id,
            email: account.email,
            status: 'failed',
            error: emailResult.error
          });
          console.error(`❌ Failed to send insights to ${account.email}:`, emailResult.error);
        }

      } catch (error) {
        console.error(`Error processing account ${account.id}:`, error);
        errorCount++;
      }
    }


    return {
      success: true,
      summary: {
        sent: successCount,
        skipped: skippedCount,
        failed: errorCount,
        total: accountsWithGBP.length,
      },
    };
  });
}
