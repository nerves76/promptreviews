/**
 * Cron Job: Monitor GBP Profile Changes
 *
 * Monitors connected Google Business Profile locations for changes
 * and alerts users when changes are detected. Tracks both:
 * - Google-suggested changes (e.g., Google recommending edits)
 * - Direct profile edits (by user, team members, or third parties)
 *
 * Runs once daily at 8 AM UTC.
 * Only available for Builder and Maven tiers.
 *
 * Security: Uses a secret token to ensure only Vercel can call this endpoint.
 *
 * Improvements:
 * - Fixed change source attribution (Google vs owner detection)
 * - Per-alert email tracking
 * - Error handling for in-app notifications
 * - Uses ON CONFLICT for duplicate prevention
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { sendGbpProtectionAlertEmail } from '@/utils/emailTemplates';
import { createGbpChangeNotification, shouldSendEmail } from '@/utils/notifications';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
import crypto from 'crypto';

// Helper to create a hash for snapshot comparison
function createSnapshotHash(data: Record<string, any>): string {
  const sortedJson = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('md5').update(sortedJson).digest('hex');
}

// Helper to compare values and detect changes
function detectChanges(
  oldSnapshot: Record<string, any>,
  newSnapshot: Record<string, any>,
  fieldsToMonitor: string[]
): Array<{ field: string; oldValue: any; newValue: any }> {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

  for (const field of fieldsToMonitor) {
    const oldValue = oldSnapshot[field];
    const newValue = newSnapshot[field];

    // Deep comparison for objects
    const oldStr = JSON.stringify(oldValue);
    const newStr = JSON.stringify(newValue);

    if (oldStr !== newStr) {
      changes.push({ field, oldValue, newValue });
    }
  }

  return changes;
}

// Helper to format field name for display
function formatFieldName(field: string): string {
  const fieldNames: Record<string, string> = {
    title: 'Business Name',
    address: 'Address',
    phone: 'Phone Number',
    website: 'Website',
    hours: 'Business Hours',
    description: 'Business Description',
    categories: 'Business Categories'
  };
  return fieldNames[field] || field;
}

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('monitor-gbp-changes', async () => {
    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current hour for frequency filtering
    const currentHour = new Date().getHours();
    const isEvenHour = currentHour % 2 === 0;

    // Get all eligible accounts with GBP connections
    // Builder: Only check on even hours (every 2 hours)
    // Maven: Check every hour
    const planFilter = isEvenHour
      ? ['builder', 'maven']  // Both tiers on even hours
      : ['maven'];            // Only Maven on odd hours

    const { data: gbpProfiles, error: profilesError } = await supabase
      .from('google_business_profiles')
      .select(`
        id,
        account_id,
        access_token,
        refresh_token,
        expires_at,
        google_email,
        accounts!inner(
          id,
          plan,
          subscription_status,
          email,
          first_name
        )
      `)
      .in('accounts.plan', planFilter)
      .eq('accounts.subscription_status', 'active');

    if (profilesError) {
      console.error('Error fetching GBP profiles:', profilesError);
      return {
        success: false,
        error: 'Failed to fetch GBP profiles',
      };
    }

    console.log(`Found ${gbpProfiles?.length || 0} eligible accounts to check`);

    const results: any[] = [];
    let totalChangesDetected = 0;
    let totalLocationsChecked = 0;
    let totalEmailsSent = 0;
    let totalNotificationErrors = 0;

    // Process each account with GBP connection
    for (const profile of gbpProfiles || []) {
      const account = Array.isArray(profile.accounts) ? profile.accounts[0] : profile.accounts;
      if (!account) continue;

      try {
        // Get protection settings for this account
        const { data: settings } = await supabase
          .from('gbp_protection_settings')
          .select('*')
          .eq('account_id', profile.account_id)
          .single();

        // If protection is explicitly disabled, skip
        if (settings && settings.enabled === false) {
          results.push({
            accountId: profile.account_id,
            status: 'skipped',
            reason: 'Protection disabled'
          });
          continue;
        }

        // Default fields to monitor if no settings exist
        const fieldsToMonitor = settings?.protected_fields ||
          ['hours', 'address', 'phone', 'website', 'title', 'description'];

        // Get connected locations for this account
        // Note: Locations are stored in google_business_locations when selected via the UI
        const { data: selectedLocations } = await supabase
          .from('google_business_locations')
          .select('location_id, location_name')
          .eq('account_id', profile.account_id);

        if (!selectedLocations || selectedLocations.length === 0) {
          results.push({
            accountId: profile.account_id,
            status: 'skipped',
            reason: 'No locations selected'
          });
          continue;
        }

        // Initialize GBP client
        const client = new GoogleBusinessProfileClient({
          accessToken: profile.access_token,
          refreshToken: profile.refresh_token || undefined,
          expiresAt: profile.expires_at ? new Date(profile.expires_at).getTime() : undefined
        });

        const accountChanges: Array<{
          alertId?: string;
          locationId: string;
          locationName: string;
          field: string;
          oldValue?: any;
          newValue?: any;
          changeSource: 'google' | 'owner';
        }> = [];

        // Check each location
        for (const location of selectedLocations) {
          totalLocationsChecked++;

          try {
            // Get current snapshot from Google
            const currentData = await client.getLocationSnapshot(location.location_id);
            if (!currentData) continue;

            // Check Google's hasGoogleUpdated flag FIRST to know if Google has pending suggestions
            const hasGoogleUpdates = await client.hasGoogleUpdates(location.location_id);

            // Get the list of fields Google has suggested changes for (if any)
            let googleSuggestedFields: Set<string> = new Set();
            if (hasGoogleUpdates) {
              const googleUpdates = await client.getGoogleUpdates(location.location_id);
              if (googleUpdates && googleUpdates.diffMask) {
                googleUpdates.diffMask.split(',').forEach(f => googleSuggestedFields.add(f.trim()));
              }
            }

            // Get stored snapshot
            const { data: storedSnapshot } = await supabase
              .from('gbp_location_snapshots')
              .select('*')
              .eq('account_id', profile.account_id)
              .eq('location_id', location.location_id)
              .single();

            // If no stored snapshot, create one (first run)
            if (!storedSnapshot) {
              const hash = createSnapshotHash(currentData);
              await supabase
                .from('gbp_location_snapshots')
                .insert({
                  account_id: profile.account_id,
                  location_id: location.location_id,
                  location_name: location.location_name,
                  title: currentData.title,
                  address: currentData.address,
                  phone: currentData.phone,
                  website: currentData.website,
                  hours: currentData.hours,
                  description: currentData.description,
                  categories: currentData.categories,
                  snapshot_hash: hash
                });

              // If there are Google updates on first run, create alerts for them
              if (hasGoogleUpdates && googleSuggestedFields.size > 0) {
                for (const field of googleSuggestedFields) {
                  // Use upsert with ON CONFLICT to prevent duplicates (relies on unique index)
                  const { data: alertData, error: alertError } = await supabase
                    .from('gbp_change_alerts')
                    .upsert({
                      account_id: profile.account_id,
                      location_id: location.location_id,
                      location_name: location.location_name,
                      field_changed: field,
                      old_value: null,
                      new_value: (currentData as Record<string, any>)[field] || null,
                      change_source: 'google',
                      status: 'pending'
                    }, {
                      onConflict: 'account_id,location_id,field_changed',
                      ignoreDuplicates: true
                    })
                    .select('id')
                    .single();

                  if (!alertError && alertData) {
                    totalChangesDetected++;
                    accountChanges.push({
                      alertId: alertData.id,
                      locationId: location.location_id,
                      locationName: location.location_name,
                      field,
                      changeSource: 'google'
                    });

                    // Create in-app notification with error handling
                    try {
                      const notifResult = await createGbpChangeNotification(
                        profile.account_id,
                        location.location_name,
                        formatFieldName(field),
                        'google',
                        alertData.id
                      );
                      if (!notifResult.success) {
                        console.error(`Failed to create notification for alert ${alertData.id}:`, notifResult.error);
                        totalNotificationErrors++;
                      }
                    } catch (notifError) {
                      console.error(`Exception creating notification for alert ${alertData.id}:`, notifError);
                      totalNotificationErrors++;
                    }
                  }
                }
              }
              continue;
            }

            // Compare with stored snapshot
            const storedData = {
              title: storedSnapshot.title,
              address: storedSnapshot.address,
              phone: storedSnapshot.phone,
              website: storedSnapshot.website,
              hours: storedSnapshot.hours,
              description: storedSnapshot.description,
              categories: storedSnapshot.categories
            };

            const changes = detectChanges(storedData, currentData, fieldsToMonitor);

            if (changes.length > 0) {
              // Create alerts for each change
              for (const change of changes) {
                // FIX: Determine change source per-field, not globally
                // If this specific field is in Google's suggested changes, it's a Google change
                // Otherwise, it's an owner/third-party change
                const changeSource: 'google' | 'owner' = googleSuggestedFields.has(change.field)
                  ? 'google'
                  : 'owner';

                // Use upsert with ON CONFLICT to prevent duplicates
                const { data: alertData, error: alertError } = await supabase
                  .from('gbp_change_alerts')
                  .upsert({
                    account_id: profile.account_id,
                    location_id: location.location_id,
                    location_name: location.location_name,
                    field_changed: change.field,
                    old_value: change.oldValue,
                    new_value: change.newValue,
                    change_source: changeSource,
                    status: 'pending'
                  }, {
                    onConflict: 'account_id,location_id,field_changed',
                    ignoreDuplicates: true
                  })
                  .select('id')
                  .single();

                if (!alertError && alertData) {
                  totalChangesDetected++;
                  accountChanges.push({
                    alertId: alertData.id,
                    locationId: location.location_id,
                    locationName: location.location_name,
                    field: change.field,
                    oldValue: change.oldValue,
                    newValue: change.newValue,
                    changeSource
                  });

                  // Create in-app notification with error handling
                  try {
                    const notifResult = await createGbpChangeNotification(
                      profile.account_id,
                      location.location_name,
                      formatFieldName(change.field),
                      changeSource,
                      alertData.id
                    );
                    if (!notifResult.success) {
                      console.error(`Failed to create notification for alert ${alertData.id}:`, notifResult.error);
                      totalNotificationErrors++;
                    }
                  } catch (notifError) {
                    console.error(`Exception creating notification for alert ${alertData.id}:`, notifError);
                    totalNotificationErrors++;
                  }
                }
              }

              // Update the stored snapshot with current data
              const newHash = createSnapshotHash(currentData);
              await supabase
                .from('gbp_location_snapshots')
                .update({
                  title: currentData.title,
                  address: currentData.address,
                  phone: currentData.phone,
                  website: currentData.website,
                  hours: currentData.hours,
                  description: currentData.description,
                  categories: currentData.categories,
                  snapshot_hash: newHash,
                  snapshot_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', storedSnapshot.id);
            }
          } catch (locationError) {
            console.error(`Error checking location ${location.location_id}:`, locationError);
          }
        }

        // Send email notifications if changes were detected and notification is immediate
        const notificationFrequency = settings?.notification_frequency || 'immediate';

        // Check if user has email notifications enabled for GBP changes
        const shouldSendEmailNotif = await shouldSendEmail(profile.account_id, 'gbp_change_detected');

        if (accountChanges.length > 0 && notificationFrequency === 'immediate' && shouldSendEmailNotif) {
          // FIX: Send email for each change and track per-alert
          for (const change of accountChanges) {
            try {
              const formatValue = (val: any) => {
                if (val === null || val === undefined) return 'Not set';
                if (typeof val === 'object') return JSON.stringify(val, null, 2);
                return String(val);
              };

              await sendGbpProtectionAlertEmail(
                account.email,
                account.first_name || '',
                change.locationName,
                formatFieldName(change.field),
                formatValue(change.oldValue),
                formatValue(change.newValue),
                change.changeSource
              );

              totalEmailsSent++;

              // FIX: Mark this specific alert as email sent (per-alert tracking)
              if (change.alertId) {
                await supabase
                  .from('gbp_change_alerts')
                  .update({
                    email_sent: true,
                    email_sent_at: new Date().toISOString()
                  })
                  .eq('id', change.alertId);
              }
            } catch (emailError) {
              console.error(`Failed to send email for alert ${change.alertId}:`, emailError);
              // Don't mark as sent if email failed
            }
          }
        }

        results.push({
          accountId: profile.account_id,
          plan: account.plan,
          locationsChecked: selectedLocations.length,
          changesDetected: accountChanges.length,
          emailsSent: accountChanges.filter(c => c.alertId).length
        });

      } catch (accountError) {
        console.error(`Error processing account ${profile.account_id}:`, accountError);
        results.push({
          accountId: profile.account_id,
          status: 'error',
          error: accountError instanceof Error ? accountError.message : 'Unknown error'
        });
      }
    }

    return {
      success: true,
      summary: {
        accountsProcessed: gbpProfiles?.length || 0,
        locationsChecked: totalLocationsChecked,
        changesDetected: totalChangesDetected,
        emailsSent: totalEmailsSent,
        notificationErrors: totalNotificationErrors,
      },
    };
  });
}
